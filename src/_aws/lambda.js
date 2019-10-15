const { co } = require('core-async')
const { fetch } = require('../utils')

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

const invoke = ({ name, body }) => co(function *(){
	const isDev = /^http:\/\/localhost/.test(name)
	return yield (isDev ? fetch.post({ uri:name, body:{ _awsParams:body } }) : invokeLambda({ name, body }))
})

module.exports = {
	invoke
}