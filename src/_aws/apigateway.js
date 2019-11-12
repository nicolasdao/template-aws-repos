const { co } = require('core-async')

let api_gateways = {}
const getApiGateway = endpoint => {
	if (!endpoint)
		throw new Error('Missing required argument \'endpoint\'.')

	let api_gw = api_gateways[endpoint]
	if (!api_gw) {
		const AWS = require('aws-sdk')
		// apply the patch
		require('./_apigateway_patch.js')
		api_gw = new AWS.ApiGatewayManagementApi({ apiVersion: '2018-11-29', endpoint })
		api_gateways[endpoint] = api_gw
	}
	return api_gw
}

/**
 * Posts a message to an AWS API Gateway.
 * 
 * @param {String}	endpoint		API Gateway endpoint (without the protocol).
 * @param {String}	connectionId	Websocket connection ID.
 * @param {Object}	data			Any payload.
 * @yield {Object} 					Empty object
 */
const post = ({ endpoint, connectionId, data }) => co(function *(){
	if (!connectionId)
		throw new Error('Missing required argument \'connectionId\'.')

	if (!data)
		return 

	const api_gw = getApiGateway(endpoint)
	const t = typeof(data)
	const payload = t == 'string' || (data instanceof Buffer) 
		? data 
		: (data instanceof Date)
			? data.toISOString()
			: t == 'object' 
				? JSON.stringify(data) : `${data}`

	return yield api_gw.postToConnection({ ConnectionId: connectionId, Data: payload }).promise()
})

module.exports = {
	post
}