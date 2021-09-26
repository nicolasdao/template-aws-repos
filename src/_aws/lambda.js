const { error:{ catchErrors, wrapErrors } } = require('puffy')
const AWS = require('aws-sdk')
const lambda = new AWS.Lambda({apiVersion: '2015-03-31'})

// Doc: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Lambda.html#invoke-property
const _invoke = arg => new Promise(next => lambda.invoke(arg, (err,data) => next(err ? [[err],null] : [null,data])))

/**
 * Synchronouly invokes a lambda.
 * 
 * WARNING: Requires the 'lambda:InvokeFunction' permission in the policy.
 * 
 * @param  {String}  arn						Lambda's ARN.
 * @param  {Object}  body
 * @param  {Boolean} async						Default false. True means the request is a fire and forget. The response only includes a 
 *                              				StatusCode indicating if the event was delivered.
 * @param  {Boolean} json						Default false. True means the payload is JSON parsed.
 * 
 * @return {Number}	 output.StatusCode
 * @return {String}	 output.FunctionError				
 * @return {String}	 output.LogResult					
 * @return {String}	 output.Payload
 * @return {String}	 output.ExecutedVersion		e.g., '$LATEST'
 */
const invoke = ({ arn, body, async, json }) => catchErrors((async () => {
	const errMsg = `Failed to invoke AWS Lambda '${arn}'`
	if (!arn)
		throw wrapErrors(errMsg, [new Error('Missing required argument \'arn\'.')])

	const t = typeof(body)
	const Payload = (body instanceof Buffer) || (t == 'string') ? body : t == 'object' ? JSON.stringify(body) : `${body}`

	const [errors, data] = await _invoke({ 
		FunctionName:arn, 
		Payload,
		InvocationType: async ? 'Event' : 'RequestResponse'
	})
	if (errors)
		throw wrapErrors(errMsg, errors)

	if (json && data && data.Payload) {
		const tt = typeof(data.Payload)
		if (tt == 'object')
			return data
		else if (tt == 'string') {
			try {
				data.Payload = JSON.parse(data.Payload)
			} catch(err) {
				throw wrapErrors(errMsg, [new Error(`Failed to parse the Lambda result.Payload to JSON. Response: ${data.Payload}`)])
			}
		}
	}

	return data
})())

module.exports = {
	invoke
}