const { dynamodb: { Table } } = require('../_aws')

const TABLE = () => process.env.NUMBER_TABLE

const SCHEMA = {
	device_id: 'number!',
	timestamp: 'date!'
}

module.exports = new Table({ name:TABLE, schema:SCHEMA })

