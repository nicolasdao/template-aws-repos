// Doc: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
const { error: { catchErrors, wrapErrors } } = require('puffy')

let _s3
const getS3 = () => {
	if (!_s3) {
		const AWS = require('aws-sdk')
		_s3 = new AWS.S3({apiVersion: '2006-03-01'})
	}
	return _s3
}

const _promisify = fn => (...args) => catchErrors(new Promise((next,fail) => {
	const s3 = getS3()
	s3[fn](...args, (err,data) => {
		if (err)
			fail(err)
		else
			next(data)
	})
}))

const _listBuckets = _promisify('listBuckets')

const listBuckets = () => catchErrors((async () => {
	const errMsg = 'Fail to list buckets'
	const [errors, resp] = await _listBuckets({})
	if (errors)
		throw wrapErrors(errMsg, errors)
	return resp
})())

module.exports = {
	listBuckets
}