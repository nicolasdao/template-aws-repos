/**
 * Copyright (c) 2017-2019, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/
const fs = require('fs')
const fetch = require('node-fetch')
const { Writable } = require('stream')
const { getInfo } = require('./url')
const FormData = require('form-data')
const { retry } = require('./promise')

/**
 * Transforms the HTTP respnse into something readable.
 * 
 * @param  {Response} res     				
 * @param  {String}   uri     				
 * @param  {Writable} options.streamReader 	
 * @param  {String}   options.dst		Path to a destination file
 * @param  {String}   options.parsing		e.g., 'json' to force the parsing method to json. Valid values: 'json', 'text', 'buffer'
 * 
 * @yield {Number}   		output.status
 * @yield {Object}   		output.data
 * @yield {Object}   		output.headers        				
 */
const _processResponse = (res, uri, options={}) => {
	let contentType = res && res.headers && typeof(res.headers.get) == 'function' ? res.headers.get('content-type') : null	
	const { ext, contentType:ct } = getInfo(uri || '')
	contentType = contentType || ct
	
	const isBuffer = options.parsing == 'buffer'
	const isText = !isBuffer && (options.parsing == 'text' || (!options.dst && !options.streamReader && contentType && contentType.match(/(text|html|css|xml|javascript|rss|csv)/)))
	const isJson = !isBuffer && (options.parsing == 'json' || (!options.dst && !options.streamReader && (!ext || !contentType || contentType.match(/json/))))

	const getData = isText 
		? res.text()
		: isJson
			? res.json()
			: (() => {
				const chunks = []
				const customStreamReader = options.streamReader && (options.streamReader instanceof Writable)
				const writeResponseToFile = options.dst
				const dontReturnResp = customStreamReader || writeResponseToFile
				const reader = writeResponseToFile 
					? fs.createWriteStream(options.dst)
					: customStreamReader
						? options.streamReader
						: new Writable({
							write(chunk, encoding, callback) {
								chunks.push(chunk)
								callback()
							}
						})
				return new Promise((onSuccess, onFailure) => {
					res.body.pipe(reader)
					res.body.on('close', () => onSuccess())
					res.body.on('end', () => onSuccess())
					res.body.on('finish', () => onSuccess())
					res.body.on('error', err => onFailure(err))
				}).then(() => dontReturnResp ? null : Buffer.concat(chunks))
			})()

	return getData
		.then(data => ({ status: res.status, data, headers: res.headers }))
		.catch(() => ({ status: res.status, data: res, headers: res.headers }))
}

/**
 * Performs HTTP request. Examples:
 *
 * 	// Calling an API
 * 	_fetch({ uri: 'https://example.com/yourapi' }, 'GET').then(({ data }) => console.log(data)) // shows JSON object
 *
 *	// Downloading a file
 * 	_fetch({ uri: 'https://example.com/image/test.jpeg', parser: 'buffer' }, 'GET').then(({ data }) => console.log(data)) // shows buffer
 *
 * 	// Downloading a file using a custom stream reader
 * 	const chunks = []
 * 	const customStreamReader = new Writable({
 * 		write(chunk, encoding, callback) {
 * 			chunks.push(chunk)
 * 			callback()
 * 		}
 * 	})
 *	_fetch({ uri: 'https://example.com/somefile.pdf', streamReader:customStreamReader }, 'GET').then(() => console.log(Buffer.concat(chunks)))
 *  
 * 
 * @param  {String}			uri				e.g., 'https://example.com'
 * @param  {Object}			headers			e.g., { Authorization: 'bearer 12345' }
 * @param  {String|Object}	body			e.g., { hello: 'world' }
 * @param  {Writable} 		streamReader	
 * @param  {String}			dst				Absolute file path on local machine where to store the file (e.g., '/Documents/images/img.jpeg')
 * @param  {String} 		parsing			Forces the response to be parsed using one of the following output formats:
 *                              				'json', 'text', 'buffer'
 * @param  {String}			method			Valid values: 'GET', 'POST', 'PUT', 'DELETE', 'PATCH'
 * 
 * @yield {Number}   		output.status
 * @yield {Object}   		output.data
 * @yield {Object}   		output.headers
 */
const _fetch = ({ uri, headers={}, body, streamReader, dst, parsing }, method) => {
	const _body = !body || typeof(body) == 'string' || (body instanceof Buffer) || (body instanceof FormData) ? body : JSON.stringify(body)
	return fetch(uri, { method, headers, body:_body }).then(res => _processResponse(res, uri, { streamReader, dst, parsing }))
}

const postData = input => _fetch(input, 'POST')

const putData = input => _fetch(input, 'PUT')

const patchData = input => _fetch(input, 'PATCH')

const deleteData = input => _fetch(input, 'DELETE')

const getData = input => _fetch(input, 'GET')

const graphQLQuery = ({ uri, headers, query }) => {
	if (!uri)
		throw new Error('Missing required \'uri\' argument.')
	if (!query)
		throw new Error('Missing required \'query\' argument.')
	if (typeof(query) != 'string')
		throw new Error('Wrong argument exception. \'query\' must be a string.')

	const api_url = `${uri}?query=${encodeURIComponent(query)}`
	return getData({ uri:api_url, headers })
}

const graphQLMutation = ({ uri, headers, query }) => {
	if (!uri)
		throw new Error('Missing required \'uri\' argument.')
	if (!query)
		throw new Error('Missing required \'query\' argument.')
	if (typeof(query) != 'string')
		throw new Error('Wrong argument exception. \'query\' must be a string.')
	const api_url = `${uri}?query=mutation${encodeURIComponent(query)}`
	return postData({ uri:api_url, headers })
}

const retryGetData = (input, options) => retry({ 
	fn: () => getData(input), 
	...(options || {})
})

const retryGraphQLQuery = (input, options) => retry({ 
	fn: () => graphQLQuery(input), 
	...(options || {})
})

module.exports = {
	post: postData,
	'get': getData,
	put: putData,
	patch: patchData,
	delete: deleteData,
	graphql: {
		query: graphQLQuery,
		mutate: graphQLMutation,
		retry: {
			query: retryGraphQLQuery
		}
	},
	retry: {
		'get': retryGetData
	}
}
