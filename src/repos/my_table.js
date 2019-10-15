/**
 * Copyright (c) 2017-2019, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const { dynamodb: { Table } } = require('../_aws')

const TABLE = () => process.env.NUMBER_TABLE

const SCHEMA = {
	device_id: 'number!',
	timestamp: 'date!'
}

module.exports = new Table({ name:TABLE, schema:SCHEMA })

