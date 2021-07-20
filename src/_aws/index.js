/**
 * Copyright (c) 2017-2019, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

// AWS Regions
// ===========
// 
// US East (Ohio)				us-east-2
// US East (N. Virginia)		us-east-1
// US West (N. California)		us-west-1
// US West (Oregon)				us-west-2
// Asia Pacific (Hong Kong)		ap-east-1
// Asia Pacific (Mumbai)		ap-south-1
// Asia Pacific (Osaka-Local)	ap-northeast-3
// Asia Pacific (Seoul)			ap-northeast-2
// Asia Pacific (Singapore)		ap-southeast-1
// Asia Pacific (Sydney)		ap-southeast-2
// Asia Pacific (Tokyo)			ap-northeast-1
// Canada (Central)				ca-central-1
// China (Beijing)				cn-north-1
// China (Ningxia)				cn-northwest-1
// EU (Frankfurt)				eu-central-1
// EU (Ireland)					eu-west-1
// EU (London)					eu-west-2
// EU (Paris)					eu-west-3
// EU (Stockholm)				eu-north-1
// Middle East (Bahrain)		me-south-1
// South America (Sao Paulo)	sa-east-1
// AWS GovCloud (US-East)		us-gov-east-1
// AWS GovCloud (US-West)		us-gov-west-1

/**
 * Sets the AWS credentials explicitely so that the AWS SDK can authenticate
 * each API requests.
 * 
 * @param  {String} options.accessKeyId     
 * @param  {String} options.secretAccessKey 
 * @param  {String} options.region          
 * @return {Void}
 */
const setCreds = ({ accessKeyId, secretAccessKey, region }) => {
	if (accessKeyId)
		process.env['AWS_ACCESS_KEY_ID'] = accessKeyId
	if (secretAccessKey)
		process.env['AWS_SECRET_ACCESS_KEY'] = secretAccessKey
	if (region)
		process.env['AWS_REGION'] = region
}

module.exports = {
	dynamodb: require('./dynamodb'),
	sqs: require('./sqs'),
	sns: require('./sns'),
	lambda: require('./lambda'),
	apigateway: require('./apigateway'),
	s3: require('./s3'),
	codeCommit: require('./codeCommit'),
	setCreds
}