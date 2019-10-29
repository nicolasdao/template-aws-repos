/**
 * Copyright (c) 2017-2019, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const { my_table } = require('./src/repos')

my_table.insert({ device_id:1, timestamp: new Date(), hello:'world' })

// Insert also supports arrays. Optionally, you can set the concurrency level for those inserts to match 
// your provisioning set up (default is 1). 
my_table.insert([
	{ device_id:2, timestamp: new Date(), hello:'Nic' },
	{ device_id:3, timestamp: new Date(), hello:'Carl' }
], { concurrency:2 })

my_table
	.query('device_id').eq(1)
	.and('timestamp').between(['2019-08-01', '2019-08-02'])
	.sortByRange('desc')
	.limit(20)
	.execute()
	.then(console.log) // { Items: [], Count: 0, ScannedCount: 0 }

my_table
	.query('device_id').eq(1)
	.and('timestamp').between(['2019-08-01', '2019-08-02'])
	.first()
	.execute()
	.then(console.log) // { Items: [], Count: 0, ScannedCount: 0 }

my_table
	.query('device_id').eq(1)
	.and('timestamp').between(['2019-08-01', '2019-08-02'])
	.last()
	.execute()
	.then(console.log) // { Items: [], Count: 0, ScannedCount: 0 }

// IMPORTANT: In the following 3 examples:
//	- If there is a range key, 'key' MUST contain it. 'key' cannot just be made of the partition key.
//	- The type of 'some_field' must be number.
my_table.add(3).to('some_field').whereKey({ device_id:1, timestamp: '2019-10-29T03:04:33.579Z' }).then(console.log) // New value of some_field
my_table.increment('some_field').whereKey({ device_id:1, timestamp: '2019-10-29T03:04:33.579Z' }).then(console.log) // some_field + 1
my_table.decrement('some_field').whereKey({ device_id:1, timestamp: '2019-10-29T03:04:33.579Z' }).then(console.log) // some_field - 1






