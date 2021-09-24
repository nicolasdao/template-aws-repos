const { error:{ catchErrors, wrapErrors } } = require('puffy')
const AWS = require('aws-sdk')
const sf = new AWS.StepFunctions({apiVersion: '2016-11-23'})

// Doc: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/StepFunctions.html#startExecution-property
const _startExecution = arg => new Promise(next => sf.startExecution(arg, (err,data) => next(err ? [[err],null] : [null,data])))

/**
 * Starts a step-function's execution.
 *
 * WARNING: Requires the 'states:StartExecution' permission in the policy.
 * 
 * @param  {String}  arn							Required. Step-function's ARN.
 * @param  {Object}  input							Optional. 
 * @param  {String}  name							Optional. If set, it must be unique. This is used to create idempotent requests. The results are stored for 90 days.	
 * @param  {String}  traceHeader					Optional. AWS X-Ray trace header.
 * 
 * @return {String}	 output.executionArn
 * @return {Date}	 output.startDate				UTC date
 */
const startExecution = ({ arn, input, name, traceHeader }) => catchErrors((async () => {
	const errMsg = `Failed to run 'startExecution' on step-function '${arn}'`
	if (!arn)
		throw wrapErrors(errMsg, [new Error('Missing required argument \'arn\'.')])

	const t = typeof(input)
	const i = input === null || input === undefined ? undefined : 
		t == 'string' ? input : t == 'object' ? JSON.stringify(input) : `${input}`
		
	const [errors, data] = await _startExecution({ 
		stateMachineArn: arn,
		input: i,
		name,
		traceHeader
	})
	if (errors)
		throw wrapErrors(errMsg, errors)

	return data
})())

module.exports = {
	startExecution
}