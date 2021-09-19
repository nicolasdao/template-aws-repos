const { error:{ catchErrors, wrapErrors } } = require('puffy')
const AWS = require('aws-sdk')
const ssm = new AWS.SSM({apiVersion: '2014-11-06'})

// Doc: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SSM.html#getParameter-property
const ssmGetParameter = arg => new Promise(next => ssm.getParameter(arg, (err,data) => next(err ? [[err],null] : [null,data])))

/**
 * Gets a parameter from AWS Parameter Store.
 * 
 * @param  {String}  name
 * @param  {String}  version						Optional. If null, then the latest version is returned.	
 * @param  {Boolean} json							Default false. True means the Value is parsed to JSON.
 * 
 * @return {String}	 output.Name
 * @return {String}	 output.Type					Valid values: 'String', 'StringList', 'SecureString'
 * @return {String}	 output.Value					If 'json' is true, this is an object.
 * @return {Number}	 output.Version
 * @return {Date}	 output.LastModifiedDate		UTC date
 * @return {String}	 output.ARN
 * @return {String}	 output.DataType				Valid values: 'text', 'aws:ec2:image'
 */
const getParameter = ({ name, version, json }) => catchErrors((async () => {
	const errMsg = `Failed to get AWS Parameter Store '${name}'`
	if (!name)
		throw wrapErrors(errMsg, [new Error('Missing required argument \'name\'.')])

	const Name = version ? `${name}:${version}` : name
	const [errors, data] = await ssmGetParameter({ Name })
	if (errors)
		throw wrapErrors(errMsg, errors)

	if (json && data && data.Parameter && data.Parameter.Value) {
		try {
			data.Parameter.Value = JSON.parse(data.Parameter.Value)
		} catch(err) {
			throw wrapErrors(errMsg, [new Error(`Failed to JSON parse Parameter Store '${Name}'. Failed parsed value: ${data.Parameter.Value}`)])
		}
	} 
	return (data ? data.Parameter : null) || null
})())

module.exports = {
	get: getParameter
}
