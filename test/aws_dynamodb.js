/**
 * Copyright (c) 2017-2019, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const { assert } = require('chai')
const { dynamodb: { _:{ mustBe, mustBeArrayOf, mustExist, convertToQueryParams, getWhereClause } } } = require('../src/_aws')

describe('repos.core._', () => {
	describe('#mustExist', () => {
		it('Should validate types', () => {
			const entity = {
				id:1,
				firstName: 'Nic',
				lastName: null,
				age:38,
				friends: ['Boris', 'Brendan']
			}
			try {
				const field = 'id'
				const result = mustExist({ name:field, value:entity[field] })
				assert.strictEqual(result, true, '01-A')
			} catch(err) {
				assert.isNotOk(err.message, '01-B')
			}
			try {
				const field = 'lastName'
				const result = mustExist({ name:field, value:entity[field] })
				assert.strictEqual(result, false, '02-A')
			} catch(err) {
				assert.equal(err.message, 'Field \'lastName\' is required.','02-B')
			}
		})
	})
	describe('#mustBe', () => {
		it('Should validate types', () => {
			const entity = {
				id:1,
				firstName: 'Nic',
				lastName: null,
				age:38,
				score:null,
				friends: ['Boris', 'Brendan']
			}
			try {
				const field = 'firstName'
				const result = mustBe({ name:field, value:entity[field], type:'string' }, { required:true })
				assert.strictEqual(result, true, '01-A')
			} catch(err) {
				assert.isNotOk(err.message, '01-B')
			}
			try {
				const field = 'lastName'
				const result = mustBe({ name:field, value:entity[field], type:'string' }, { required:true })
				assert.strictEqual(result, false, '02-A')
			} catch(err) {
				assert.equal(err.message, 'Field \'lastName\' is required.','02-B')
			}
			try {
				const field = 'age'
				const result = mustBe({ name:field, value:entity[field], type:'number' })
				assert.strictEqual(result, true, '03-A')
			} catch(err) {
				assert.isNotOk(err.message, '03-B')
			}
			try {
				const field = 'score'
				const result = mustBe({ name:field, value:entity[field], type:'number' })
				assert.strictEqual(result, true, '04-A')
			} catch(err) {
				assert.isNotOk(err.message, '04-B')
			}
		})
	})
	describe('#mustBeArrayOf', () => {
		it('Should validate types', () => {
			const entity = {
				id:1,
				firstName: 'Nic',
				lastName: null,
				age:38,
				score:null,
				friends: ['Boris', 'Brendan'],
				parents: [1,0,null]
			}
			try {
				const field = 'friends'
				const result = mustBeArrayOf({ name:field, value:entity[field], type:'string' }, { required:true })
				assert.strictEqual(result, true, '01-A')
			} catch(err) {
				assert.isNotOk(err.message, '01-B')
			}
			try {
				const field = 'friends'
				const result = mustBeArrayOf({ name:field, value:entity[field], type:'boolean' }, { required:true })
				assert.strictEqual(result, false, '02-A')
			} catch(err) {
				assert.equal(err.message, 'Field \'friends[0]\' must be a boolean (current: \'string\').','02-B')
			}
			try {
				const field = 'parents'
				const result = mustBeArrayOf({ name:field, value:entity[field], type:'number' }, { required:true, elementRequired:true })
				assert.strictEqual(result, false, '03-A')
			} catch(err) {
				assert.equal(err.message, 'Field \'parents[2]\' is required.','03-B')
			}
			try {
				const field = 'parents'
				const result = mustBeArrayOf({ name:field, value:entity[field], type:'number' }, { required:true })
				assert.strictEqual(result, true, '04-A')
			} catch(err) {
				assert.isNotOk(err.message, '04-B')
			}
		})
	})
	describe('#getWhereClause', () => {
		it('Should convert a series of chained APIs to an array of queries', () => {
			const clause_01 = getWhereClause('device_id').eq(1).and('timestamp').between(['2019-08-01', '2019-08-02']).clause
			
			assert.equal(clause_01.length, 3, '01')
			assert.equal(clause_01[0].field, 'device_id', '02')
			assert.equal(clause_01[0].op, 'eq', '03')
			assert.equal(clause_01[0].value, 1, '04')
			assert.equal(clause_01[1], 'and', '05')
			assert.equal(clause_01[2].field, 'timestamp', '06')
			assert.equal(clause_01[2].op, 'between', '07')
			assert.equal(clause_01[2].value[0], '2019-08-01', '08')
			assert.equal(clause_01[2].value[1], '2019-08-02', '09')

			const clause_02 = getWhereClause('device_id').eq(1).and(getWhereClause('name').eq('Nic').or('name').eq('Boris')).clause

			assert.equal(clause_02.length, 3, '10')
			assert.equal(clause_02[0].field, 'device_id', '11')
			assert.equal(clause_02[0].op, 'eq', '12')
			assert.equal(clause_02[0].value, 1, '13')
			assert.equal(clause_02[1], 'and', '14')
			assert.equal(clause_02[2].length, 3, '15')
			assert.equal(clause_02[2][0].field, 'name', '16')
			assert.equal(clause_02[2][0].op, 'eq', '17')
			assert.equal(clause_02[2][0].value, 'Nic', '18')
			assert.equal(clause_02[2][1], 'or', '19')
			assert.equal(clause_02[2][2].field, 'name', '20')
			assert.equal(clause_02[2][2].op, 'eq', '21')
			assert.equal(clause_02[2][2].value, 'Boris', '22')
		})
	})
	describe('#convertToQueryParams', () => {
		it('Should convert an array of queries into DynamoDB params', () => {
			const clause_01 = getWhereClause('device_id').eq(1).and('timestamp').between(['2019-08-01', '2019-08-02']).clause
			const params_01 = convertToQueryParams({ where:clause_01 }, { uniqueId:false })

			assert.equal(params_01.KeyConditionExpression, '(#device_id = :device_id_) AND (#timestamp BETWEEN :start_ AND :end_)', '01')
			assert.equal(params_01.ExpressionAttributeNames['#device_id'], 'device_id', '02')
			assert.equal(params_01.ExpressionAttributeNames['#timestamp'], 'timestamp', '03')
			assert.equal(params_01.ExpressionAttributeValues[':device_id_'], 1, '04')
			assert.equal(params_01.ExpressionAttributeValues[':start_'], '2019-08-01', '05')
			assert.equal(params_01.ExpressionAttributeValues[':end_'], '2019-08-02', '06')

			const clause_02 = getWhereClause('device_id').eq(1).and(getWhereClause('data.first_name').eq('Nic').or('data.last_name').eq('Dao')).clause
			const params_02 = convertToQueryParams({ where:clause_02 }, { uniqueId:false })

			assert.equal(params_02.KeyConditionExpression, '(#device_id = :device_id_) AND ((#data.#first_name = :data_first_name_) OR (#data.#last_name = :data_last_name_))', '07')
			assert.equal(params_02.ExpressionAttributeNames['#device_id'], 'device_id', '08')
			assert.equal(params_02.ExpressionAttributeNames['#data'], 'data', '09')
			assert.equal(params_02.ExpressionAttributeNames['#first_name'], 'first_name', '10')
			assert.equal(params_02.ExpressionAttributeNames['#last_name'], 'last_name', '11')
			assert.equal(params_02.ExpressionAttributeValues[':device_id_'], 1, '12')
			assert.equal(params_02.ExpressionAttributeValues[':data_first_name_'], 'Nic', '13')
			assert.equal(params_02.ExpressionAttributeValues[':data_last_name_'], 'Dao', '14')
		})
	})
})


