const co = require('co')
const { fetch, url: { buildUrl } } = require('../utils')

let _lambda
const getLambda = () => {
	if (!_lambda) {
		const AWS = require('aws-sdk')
		_lambda = new AWS.Lambda({apiVersion: '2015-03-31'})
	}
	return _lambda
}

const invokeLambda = ({ name, body }) => new Promise((success, failure) => {
	try {
		const t = typeof(body)
		const Payload = (body instanceof Buffer) || (t == 'string') ? body : t == 'object' ? JSON.stringify(body) : `${body}`
		getLambda().invoke({
			FunctionName: name,
			Payload,
		}, (err,data) => err ? failure(err) : success(data))
	} catch(err) {
		console.log(`Error - Failed to invoke lambda. Details: ${err.stack}`)
		failure(err)
	}
})

/**
 * Invokes a Lambda. Example: invoke({ name:'arn:lambda...', body:{ path:'/hello', data: {} } })
 * 
 * @param {String}	name	Lambda's ARN or 'http://localhost...' if your testing locally
 * @yield {Object}	body	Can be whatever, but if it uses this schema: { path:'/your/path', data:{ hello:'world' } }, then the
 *        					'path' will be used to route the request to the right endpoint if you're using @neap/funky.
 */
const invoke = ({ name, body }) => co(function *(){
	const isDev = /^http:\/\/localhost/.test(name)
	if (isDev) {
		const { path } = body || {}
		const uri = buildUrl({ origin:name, pathname:path })
		return yield fetch.post({ uri, body:{ _awsParams:body } })
	} else
		return yield invokeLambda({ name, body })
}).catch(err => {
	console.log(err.stack)
	throw err
})

module.exports = {
	invoke
}
