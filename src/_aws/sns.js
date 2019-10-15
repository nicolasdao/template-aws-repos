let _sns
const getSNS = () => {
	if (!_sns) {
		const AWS = require('aws-sdk')
		_sns = new AWS.SNS({apiVersion: '2010-03-31'})
	}
	return _sns
}

/**
 * Maps our lean attributes to AWS more verbose attributes.
 * 
 * @param  {Object} attributes 	e.g., 	{ 
 *                              			'your-attribute-name-1': 'whatever value', 
 *                              			'your-attribute-name-2': 123,
 *                              			'your-attribute-name-3': { hello: 'world' },
 *                              			'your-attribute-name-4': 00 03 05,
 *                              		}
 *                              		
 * @return {Object}				e.g., 	{
 *                            				'your-attribute-name-1': {
 *                            					DataType: 'String',
 *                            					StringValue: 'whatever value'
 *                            				},
 *                            				'your-attribute-name-2': {
 *                            					DataType: 'Number',
 *                            					StringValue: 123
 *                            				},
 *                            				'your-attribute-name-3': {
 *                            					DataType: 'String',
 *                            					StringValue: '{ "hello":"world" }'
 *                            				},
 *                            				'your-attribute-name-4': {
 *                            					DataType: 'Binary',
 *                            					BinaryValue: 00 03 05
 *                            				}
 *                           			}
 */
const _formatAttr = attributes => {
	if (!attributes || typeof(attributes) != 'object')
		return 

	const attrNames = Object.keys(attributes)
	if (!attrNames || !attrNames.length)
		return

	return attrNames.reduce((acc,key) => {
		const value = attributes[key]
		const t = typeof(value)
		acc[key] = value instanceof Buffer 
			? { DataType: 'Binary', BinaryValue:value } 
			: t == 'object' 
				? { DataType: 'String', StringValue: JSON.stringify(value) }
				: t == 'string'
					? { DataType: 'String', StringValue: value }
					: t == 'number'
						? { DataType: 'Number', StringValue: value }
						: { DataType: 'String', StringValue: `${value}` }

		return acc 
	}, {})
}

/**
 * Pushes a message to an SNS topic.
 * 
 * @param  {String}			topicARN						topic's ARN
 * @param  {String|Object}	payload.body					The body can be anything, but eventually, it is stringified.
 *                                        					(WARNING: Max size is 250KB)
 * @param  {Object}			payload.attributes				e.g., { 'your-attribute-name': 'whatever value' }
 * 
 * @yield  {String}		output.ResponseMetadata.RequestId
 * @yield  {String}		output.MessageId	
 */
const _send = (topicARN, { body, attributes }) => {
	const Message = typeof(body) == 'object' ? JSON.stringify(body) : `${body}`
	const MessageAttributes = attributes 
		? _formatAttr(attributes)
		: undefined

	return getSNS().publish({ 
		Message, 
		MessageAttributes,
		TopicArn:topicARN 
	}).promise()
}

/**
 * Example: sns.topic('arn:2132132').send('Hello world')
 * 
 * @param  {String} 	topicARN 
 * @return {Function}   output.send 
 */
const getTopic = topicARN => {
	if (!topicARN)
		throw new Error('Missing required \'topicARN\' argument.')

	return {
		get ARN() {
			return topicARN
		},
		send: payload => _send(topicARN, payload)
	}
}

module.exports = {
	getSNS,
	topic: getTopic
}
