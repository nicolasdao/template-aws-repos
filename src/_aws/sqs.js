let _sqs
const getSQS = () => {
	if (!_sqs) {
		const AWS = require('aws-sdk')
		_sqs = new AWS.SQS({apiVersion: '2012-11-05'})
	}
	return _sqs
}

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
