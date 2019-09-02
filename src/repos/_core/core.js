
let _db
const getDB = () => {
	if (!_db) {
		const AWS = require('aws-sdk')
		_db = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'})
	}
	return _db
}

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
		const QueueUrl = queue == 'stream' ? process.env.STREAM_QUEUE : null 
		getSQS().sendMessage({
			MessageBody: typeof(body) == 'object' ? JSON.stringify(body) : `${body}`,
			QueueUrl
		}, (err,data) => err ? failure(err) : success(data))
	} catch(err) {
		console.log(`Error - Failed to queue message. Details: ${err.stack}`)
		failure(err)
	}
})

const pull = ({ queue, max }) => new Promise((success, failure) => {
	try {
		const QueueUrl = queue == 'stream' ? process.env.STREAM_QUEUE : null 
		getSQS().receiveMessage({
			QueueUrl,
			MaxNumberOfMessages: max ? max > 10 ? 10 : max : 1 
		}, (err,data) => err ? failure(err) : success(data))
	} catch(err) {
		console.log(`Error - Failed to queue message. Details: ${err.stack}`)
		failure(err)
	}
})

const deleteMessage = ({ queue, id }) => new Promise((success, failure) => {
	try {
		const QueueUrl = queue == 'stream' ? process.env.STREAM_QUEUE : null 
		getSQS().deleteMessage({
			QueueUrl,
			ReceiptHandle: id 
		}, (err,data) => err ? failure(err) : success(data))
	} catch(err) {
		console.log(`Error - Failed to delete message from queue. Details: ${err.stack}`)
		failure(err)
	}
})

module.exports = {
	getDB,
	getSQS,
	queue: {
		send,
		pull,
		message: {
			delete: deleteMessage
		}
	}
}