let _sqs
const getSQS = () => {
	if (!_sqs) {
		const AWS = require('aws-sdk')
		_sqs = new AWS.SQS({apiVersion: '2012-11-05'})
	}
	return _sqs
}

/**
 * Pushes a message to a queue.
 * 
 * @param  {String}			queue		Queue's ARN
 * @param  {String|Object}	body		The body can be anything, but eventually, it is stringified.
 *                               		(WARNING: Max size is 250KB)
 * @yield  {Object}			output		AWS SNS response
 */
const send = ({ queue, body }) => new Promise((success, failure) => {
	try {
		getSQS().sendMessage({
			MessageBody: typeof(body) == 'object' ? JSON.stringify(body) : `${body}`,
			QueueUrl:queue
		}, (err,data) => err ? failure(err) : success(data))
	} catch(err) {
		console.log(`Error - Failed to queue message. Details: ${err.stack}`)
		failure(err)
	}
})

/**
 * Pulls messages from a queue.
 * 
 * @param  {String}		queue	Queue's ARN
 * @param  {Number}		max		Default 1, max 10.
 * 
 * @yield  {String}		output.Messages[].Body
 * @yield  {String}		output.Messages[].ReceiptHandle		This is the message ID. Use it to delete the message from the queue.
 */
const pull = ({ queue, max }) => new Promise((success, failure) => {
	try {
		getSQS().receiveMessage({
			QueueUrl:queue,
			MaxNumberOfMessages: max ? max > 10 ? 10 : max : 1 
		}, (err,data) => err ? failure(err) : success(data))
	} catch(err) {
		console.log(`Error - Failed to queue message. Details: ${err.stack}`)
		failure(err)
	}
})

/**
 * Pushes a message to a queue.
 * 
 * @param  {String}		queue	Queue's ARN
 * @param  {String}		id		Message's ID (aka ReceiptHandle)
 * @yield  {Object}		output	AWS SNS response
 */
const deleteMessage = ({ queue, id }) => new Promise((success, failure) => {
	try {
		getSQS().deleteMessage({
			QueueUrl:queue,
			ReceiptHandle: id 
		}, (err,data) => err ? failure(err) : success(data))
	} catch(err) {
		console.log(`Error - Failed to delete message from queue. Details: ${err.stack}`)
		failure(err)
	}
})

module.exports = {
	getSQS,
	send,
	pull,
	message: {
		delete: deleteMessage
	}
}
