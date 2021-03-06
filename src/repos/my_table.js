/**
 * Copyright (c) 2017-2019, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const { dynamodb: { Table } } = require('../_aws')

const TABLE = process.env.MY_TABLE_NAME

// The SCHEMA allows to validate new records or updates on existing records. The types below are references 
// to the native Javascript types plus the following custom types: 
//	- 'id' for a value that can eitehr be a number or a string.
//	- '[<native JS type>]' for an array.
//	- 'date' for a Date.
//	- '<type>!' for a required type.
//	- null to indicates that the type can be anything or that you simply do not want to validate that type.
const SCHEMA = {
	device_id: 'id!',
	count: 'number',
	timestamp: 'date!'
}

module.exports = new Table({ name:TABLE, schema:SCHEMA })

