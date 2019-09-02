/**
 * Copyright (c) 2017-2019, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const { my_table } = require('./src/repos')

my_table
	.query('device_id').eq(1)
	.and('timestamp').between(['2019-08-01', '2019-08-02'])
	.sortByRange('desc')
	.limit(20)
	.execute()
	.then(console.log)

my_table
	.query('device_id').eq(1)
	.and('timestamp').between(['2019-08-01', '2019-08-02'])
	.first()
	.execute()
	.then(console.log)

my_table
	.query('device_id').eq(1)
	.and('timestamp').between(['2019-08-01', '2019-08-02'])
	.last()
	.execute()
	.then(console.log)