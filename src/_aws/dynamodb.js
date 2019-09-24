const co = require('co')
const crypto = require('crypto')
const { tools: { throttle } } = require('core-async')
const { promise: { retry } } = require('../utils')

let _db
const getDB = () => {
	if (!_db) {
		const AWS = require('aws-sdk')
		_db = new AWS.DynamoDB.DocumentClient({apiVersion: '2012-08-10'})
	}
	return _db
}

const PRIMITIVE_TYPES = {
	N: v => v*1,
	S: v => v,
	B: v => v,
	BOOL: v => `${v}`.toLowerCase().trim() == 'true',
	NULL: () => null
}

const SET_TYPES = {
	NS: v => (v || []).map(x => x*1),
	L: v => (v || []).map(getNative),
	BS: v => v,
	SS: v => v
}

/**
 * Converts a dynamo DB object using attributes values to the original object.
 * 
 * @param  {Object} obj e.g., { device_id: { N: '1' }, value: { S: '2' }, timestamp: { S: '2019-08-30T04:39:35.405Z' } }
 * @return {Object}	 	e.g., { device_id: 1, value: '2', timestamp: '2019-08-30T04:39:35.405Z' }
 */
const getNative = obj => {
	const t = typeof(obj)
	if (obj === null || obj === undefined || t != 'object')
		return obj

	if (Array.isArray(obj))
		return obj.map(getNative)

	const keys = Object.keys(obj)
	const keyOne = keys[0]
	if (keys.length == 1) {
		if (PRIMITIVE_TYPES[keyOne])
			return PRIMITIVE_TYPES[keyOne](obj[keyOne])
		else if (SET_TYPES[keyOne])
			return SET_TYPES[keyOne](obj[keyOne])
		else if (keyOne == 'M')
			return getNative(obj[keyOne])
	}

	return keys.reduce((acc, key) => {
		acc[key] = getNative(obj[key])
		return acc
	}, {})
}	

const escapeDates = obj => {
	const t = typeof(obj)
	if (obj === null || obj === undefined || t != 'object')
		return obj

	if (Array.isArray(obj))
		return obj.map(escapeDates)

	if (obj instanceof Date)
		return obj.toISOString()

	const keys = Object.keys(obj)
	return keys.reduce((acc, key) => {
		acc[key] = escapeDates(obj[key])
		return acc
	}, {})
}

const _newId = (size=5) => crypto.randomBytes(50).toString('base64').toLowerCase().replace(/[=/\\+-]/g,'').slice(0,size)

const _checkRequired = ({ name, value }, options) => {
	const { required } = options || {}
	if (required && (value === undefined || value === null)) 
		throw new Error(`Field '${name}' is required.`)
	return true
}
	
/**
 * Checks if the field matches the type's requirements. 
 * 
 * @param  {String}  name				
 * @param  {Object}  value				
 * @param  {String}  type				
 * @param  {Boolean} options.required	Default false.
 * @return {Boolean}
 */
const _mustBe = ({ name, value, type }, options) => {
	_checkRequired({ name, value }, options)
	if (!value)
		return true

	if (!type)
		return true

	const t = type == 'date' ? ((value instanceof Date || !isNaN(new Date(value))) ? 'date' : typeof(value)) : typeof(value)
	if (t != type)
		throw new Error(`Field '${name}' must be a ${type} (current: '${t}').`)
	return true
}

/**
 * Checks if the field matches the array type's requirements. 
 * 
 * @param  {String}  name				
 * @param  {Object}  value				
 * @param  {String}  type				
 * @param  {Boolean} options.required			Default false.
 * @param  {Boolean} options.elementRequired	Default false. If true, it enforces that all array elements exist.
 * @return {Boolean}
 */
const _mustBeArrayOf = ({ name, value, type }, options) => {
	_checkRequired({ name, value }, options)
	if (!value)
		return true

	const t = typeof(value)
	if (!Array.isArray(value))
		throw new Error(`Field '${name}' must be an array (current: '${t}').`)

	if (!type)
		return true

	const { elementRequired } = options || {}
	value.forEach((v,idx) => _mustBe({ name:`${name}[${idx}]`, value:v, type }, { required:elementRequired }))
	return true
}

const _mustExist = ({ name, value }) => _mustBe({ name, value }, { required:true })

const _validateClauseField = field => {
	if (!field)
		throw new Error('Missing required argeument \'field\'.')

	const t = typeof(field)
	if (t != 'string' && t != 'object')
		throw new Error(`Wrong argument exception. 'field' must be a atring or an object (current: ${t}).`)

	return t
}

/**
 * 
 * @param  {String|Object} 	field
 * @param  {String} 		condition    	Valid values: 'and', 'or'
 * @param  {Array}  		whereClauses 	Accumulator with all the where clauses
 * 
 * @return {WhereClause}	output			Refer to the '_getWhereClause' function to get the details of the 'WhereClause' type.
 */
const _addWhereClause = ({ field, condition, whereClauses }, options) => {
	whereClauses.push(condition)
	const fieldType = _validateClauseField(field)
	if (fieldType == 'string')
		return _getWhereClause(field, whereClauses, options)
	else {
		const subWhereClauses = field.clause
		whereClauses.push(subWhereClauses)
		return _andOrSortLimitClauses({ whereClauses }, options)
	}
}

/**
 * [description]
 * @param  {Array}  		whereClauses 	Accumulator with all the where clauses
 * @return {Function} 		output.and		field => <WhereClause>
 * @return {Function} 		output.or		field => <WhereClause>
 * @return {Function} 		output.clause	() => [{ field:<string>, op:<string>, value: <object> }, ...]
 */
const _andOrSortLimitClauses = ({ whereClauses }, options) => ({
	and: field => _addWhereClause({ field, condition:'and', whereClauses }, options),
	or: field => _addWhereClause({ field, condition:'or', whereClauses }, options),
	sortByRange: dir => {
		whereClauses.sortByRange = dir 
		return _andOrSortLimitClauses({ whereClauses }, options)
	},
	limit: l => {
		whereClauses.limit = l 
		return _andOrSortLimitClauses({ whereClauses }, options)
	},
	last: () => {
		whereClauses.sortByRange = 'desc' 
		whereClauses.limit = 1
		return _andOrSortLimitClauses({ whereClauses }, options)
	},
	first: () => {
		whereClauses.sortByRange = 'asc' 
		whereClauses.limit = 1
		return _andOrSortLimitClauses({ whereClauses }, options)
	},
	get clause() {
		return whereClauses
	},
	execute: () => Promise.resolve(null).then(() => options && options.execute ? options.execute(whereClauses) : null)
})

/**
 * [description]
 * @param  {String|Object} 	field
 * @param  {String} 		op				Valiud values: 'eq', 'gt', 'lt', 'ge', 'le', 'between'
 * @param  {Object} 		value				
 * @param  {Array}  		whereClauses 	Accumulator with all the where clauses
 * @return {Function} 		output.and		field => <WhereClause>
 * @return {Function} 		output.or		field => <WhereClause>
 * @return {Function} 		output.clause	() => [{ field:<string>, op:<string>, value: <object> }, ...]
 */
const _createOp = ({ field, op, value, whereClauses }, options) => {
	whereClauses.push({ field, op, value })
	return _andOrSortLimitClauses({ whereClauses }, options)
}

/**
 * [description]
 * @param  {String|Object}	field	
 * 		
 * @return {WhereClause}	output	
 * @return {Function}	
 * @return {Function} 		output.eq		(if 'field' is string) value => { and: <Function<Object>>, or: <Function<Object>>, clause:<Function> }
 * @return {Function} 		output.ne		(if 'field' is string) value => { and: <Function<Object>>, or: <Function<Object>>, clause:<Function> }
 * @return {Function} 		output.between	(if 'field' is string) value => { and: <Function<Object>>, or: <Function<Object>>, clause:<Function> }
 * @return {Function} 		output.gt		(if 'field' is string) value => { and: <Function<Object>>, or: <Function<Object>>, clause:<Function> }
 * @return {Function} 		output.lt		(if 'field' is string) value => { and: <Function<Object>>, or: <Function<Object>>, clause:<Function> }
 * @return {Function} 		output.ge		(if 'field' is string) value => { and: <Function<Object>>, or: <Function<Object>>, clause:<Function> }
 * @return {Function} 		output.le		(if 'field' is string) value => { and: <Function<Object>>, or: <Function<Object>>, clause:<Function> }
 * @return {Function} 		output.and		(if 'field' is object) field => <WhereClause>
 * @return {Function} 		output.or		(if 'field' is object) field => <WhereClause>
 * @return {Function} 		output.clause	(if 'field' is object) () => [{ field:<string>, op:<string>, value: <object> }, ...]
 */
const _getWhereClause = (field, whereClauses, options) => {
	whereClauses = whereClauses || []
	const fieldType = _validateClauseField(field)
	if (fieldType == 'string')
		return {
			eq: value => _createOp({ field, op:'eq', value, whereClauses }, options),
			ne: value => _createOp({ field, op:'ne', value, whereClauses }, options),
			between: value => _createOp({ field, op:'between', value, whereClauses }, options),
			in: value => _createOp({ field, op:'in', value, whereClauses }, options),
			gt: value => _createOp({ field, op:'gt', value, whereClauses }, options),
			lt: value => _createOp({ field, op:'lt', value, whereClauses }, options),
			ge: value => _createOp({ field, op:'ge', value, whereClauses }, options),
			le: value => _createOp({ field, op:'le', value, whereClauses }, options)
		}
	else {
		const subWhereClauses = field.clause
		whereClauses.push(subWhereClauses)
		return _andOrSortLimitClauses({ whereClauses }, options)
	}
}


const COMPARATORS = { eq: '=', gt: '>', lt: '<', ge: '>=', le: '<=', ne:'<>' }
/**
 * 
 * @param  {Array} 	 where						e.g., [{ field:'device_id', op:'eq', value:1 }, 'and', { field:'timestamp', op:'between', value:['2019-08-01T00:00Z', '2019-08-02T00:00Z'] }]
 * @param  {Boolean} options.uniqueId			Default true. False means that the 'ExpressionAttributeValues' are not anonymoized.
 * 
 * @return {String}  KeyConditionExpression		e.g., '#device_id = :device_id AND #timestamp BETWEEN :start_e2d2 AND :end_e2d2'
 * @return {Object}  ExpressionAttributeNames	e.g., { '#device_id': 'device_id', '#timestamp': 'timestamp' }
 * @return {Object}  ExpressionAttributeValues	e.g., { ':device_id': 1, ':start_e2d2': '2019-08-01T00:00Z', ':end_e2d2': '2019-08-02T00:00Z' }
 */
const _convertToQueryParams = ({ where }, options) => {
	const { uniqueId=true } = options || {}
	const genId = () => uniqueId ? _newId() : ''
	return where.reduce((acc, clause) => {
		// Case 1: clause equals 'and' or 'or'
		if (typeof(clause) == 'string')
			acc.KeyConditionExpression = `${acc.KeyConditionExpression} ${clause.trim().toUpperCase()}`
		// Case 2: clause is a nested clause
		else if (Array.isArray(clause)) {
			const { KeyConditionExpression, ExpressionAttributeNames, ExpressionAttributeValues } = _convertToQueryParams({ where:clause }, options)
			acc.KeyConditionExpression = acc.KeyConditionExpression 
				? `${acc.KeyConditionExpression} (${KeyConditionExpression})`
				: `(${KeyConditionExpression})`
			Object.assign(acc.ExpressionAttributeNames, ExpressionAttributeNames)
			Object.assign(acc.ExpressionAttributeValues, ExpressionAttributeValues)
		// Case 3. clause is a standard clause { field, op, value }
		} else {
			const { field, op, value } = clause
			const fields = field.split('.')
			const aliases = fields.map(f => `#${f}`)
			const alias = aliases.join('.')
			aliases.forEach((a,idx) => acc.ExpressionAttributeNames[a] = fields[idx])
			if (op == 'between') {
				const [start, end] = value || []
				if (start === undefined || end  === undefined)
					throw new Error('Wrong argument exception. \'between\' expects an array with 2 elements.')
				const startLabel = `:start_${genId()}`
				const endLabel = `:end_${genId()}`
				const cond = `(${alias} BETWEEN ${startLabel} AND ${endLabel})`
				acc.ExpressionAttributeValues[startLabel] = start
				acc.ExpressionAttributeValues[endLabel] = end
				acc.KeyConditionExpression = acc.KeyConditionExpression
					? `${acc.KeyConditionExpression} ${cond}`
					: `${cond}`
			} else if (op == 'in') {
				if (!(value || []).length)
					throw new Error('Wrong argument exception. \'in\' expects an array with at least one element.')
				const els = value.map(val => ({ label:`:${genId()}`, val }))
				const cond = `(${alias} IN (${els.map(({ label }) => label)}))`
				els.forEach(({ label, val }) => acc.ExpressionAttributeValues[label] = val)
				acc.KeyConditionExpression = acc.KeyConditionExpression
					? `${acc.KeyConditionExpression} ${cond}`
					: `${cond}`
			} else {
				const label = `:${fields.join('_')}_${genId()}`
				acc.ExpressionAttributeValues[label] = value
				const cond = `(${alias} ${COMPARATORS[op]} ${label})`
				acc.KeyConditionExpression = acc.KeyConditionExpression
					? `${acc.KeyConditionExpression} ${cond}`
					: `${cond}`
			}
		}

		return acc
	}, { KeyConditionExpression:'', ExpressionAttributeNames:{}, ExpressionAttributeValues:{} })
}

/**
 * Query a DynamoDB table.
 *
 * @param  {String}  table			
 * @param  {Array} 	 where			e.g., [{ field:'device_id', op:'eq', value:1 }, 'and', { field:'timestamp', op:'between', value:['2019-08-01T00:00Z', '2019-08-02T00:00Z'] }]
 *                          		which could be created with _getWhereClause('device_id').eq(1).and('timestamp').between(['2019-08-01T00:00Z', '2019-08-02T00:00Z'])
 * 
 * @yield {[Object]} output.Items				Array of records
 * @yield {Number} 	 output.Count				
 * @yield {Number} 	 output.ScannedCount
 * @yield {Object} output.LastEvaluatedKey		{ 'hash_key':..., 'range_key':... }. For example, 
 *        										If the hash key is location_id and the range key is timestamp, this object 
 *        										could be { location_id: 123, timestamp:'2019-09-22T17:45:00.000Z' }
 *
 * 												If this value exists, this means that the maximum payload was reached
 * 												and that there is more data.
 */
const _query = ({ table, where }) => new Promise((success, failure) => {	
	try {
		const { KeyConditionExpression, ExpressionAttributeNames, ExpressionAttributeValues } = _convertToQueryParams({ where })

		const ScanIndexForward = !where.sortByRange ? undefined : where.sortByRange == 'asc' ? true : where.sortByRange == 'desc' ? false : undefined

		getDB().query({ 
			TableName: table,
			KeyConditionExpression,
			ExpressionAttributeNames,
			ExpressionAttributeValues,
			ScanIndexForward,
			Limit: where.limit
		}, (err, data) => err ? failure(err): success(data))
	} catch (err) {
		failure(err)
	}
})


const _insertEntity = ({ table, entity }) => new Promise((success, failure) => {
	try {
		const Item = escapeDates(entity)
		getDB().put({
			TableName: table,
			Item
		}, err => err ? failure(err) : success(Item))
	} catch (err) {
		failure(err)
	}
})

const _queryWithRetry = input => retry({
	fn: () => _query(input),
	retryOnFailure: err => err && (err.code == 'ProvisionedThroughputExceededException') || (err.code == 'UnknownEndpoint'),
	retryInterval: [500,2000],
	retryAttempts: 10
}).catch(err => { throw new Error(err.stack) })

const _insertEntityWithRetry = input => retry({
	fn: () => _insertEntity(input),
	retryOnFailure: err => err && (err.code == 'ProvisionedThroughputExceededException') || (err.code == 'UnknownEndpoint'),
	retryInterval: [500,2000],
	retryAttempts: 10
}).catch(err => { throw new Error(err.stack) })

/**
 * Creates a Table object. 
 * 
 * @param {String} 	  name 					Table's name
 * @param {Object} 	  schema 				Optional table schema. Default null, which means no schema validation. If specified, then
 *                               			each write must be validated against this scheme. Example: 
 *                               			{ 
 *                               				name:'string!', 
 *                               				age: 'number',
 *                               				pets:'[string]',
 *                               				address: null,
 *                               				created: '!'
 *                               			} 
 *                               			means that 'name', 'age' and 'pets' must respectively be a required string, an optional 
 *                               			number and an optional array of strings. As for 'address' and 'created', they are
 *                               			respectively an optional anything, and a required anything.
 * 
 * @return {Function} Table.query			Function<String|Object>: Promise<Object|Array<Object>>
 * @return {Function} Table.insert			Function<Object|Array<Object>>: Promise<Object|Array<Object>>
 */
const Table = function({ name, schema }) {
	if (!name)
		throw new Error('Missing required argument \'name\'.')

	// This seems weird, but this allows to lazy load the table name. This can be necessary when the table names
	// come from environment variables (process.env.YOUR_TABLE_NAME) that are set up asynchrounously when the server starts.
	const getTableName = typeof(name) != 'function' ? (() => name) : name

	const _schemaFieldValidators = !schema ? [] : Object.keys(schema).reduce((acc,field) => {
		const fieldType = (schema[field] || '').trim().toLowerCase()
		if (!fieldType)
			acc.push({ field, validator: () => true })
		else if (fieldType == '!') 
			acc.push({ field, validator: entity => _mustExist({ name:field, value:entity[field] }) })
		else {
			const required = /!$/.test(fieldType)
			const isArray = /^\[(.*?)\](!){0,1}$/.test(fieldType)
			if (isArray) {
				const arrayType = fieldType.replace(/^\[|(\](!){0,1})$|/g, '') // e.g., '[string]!' -> 'string', '[number]' -> 'number'
				const arrayTypeRequired = /!$/.test(arrayType)
				const nakedType = arrayType.replace(/!$/,'')
				acc.push({ field, validator: entity => _mustBeArrayOf({ name:field, value:entity[field], type:nakedType }, { required, elementRequired:arrayTypeRequired }) })
			} else {
				const nakedType = fieldType.replace(/!$/,'')
				acc.push({ field, validator: entity => _mustBe({ name:field, value:entity[field], type:nakedType }, { required }) })
			}
		}
		return acc
	}, [])

	const _validateEntityType = !schema ? (() => true) : (e => _schemaFieldValidators.forEach(({ validator }) => validator(e)))

	/**
	 * Inserts a new object. 
	 * 
	 * @param {Object} 	 entity 
	 * @param {Function} options.transform		Transforms the entity before inserting it. Useful to set the 'id' for example:
	 *                                      		_insert({ businessId:1, name:'Hello' }, { keepId:true, transform:e => e.id = e.businessId })
	 * @yield {Object}   newEntity				Same as 'entity' but with new 'id' (unless the 'options.keepId' was set to true and 
	 *											the 'entity.id' already exists), 'created' and 'updated' properties.
	 */
	const _insert = (entity,options) => co(function *(){
		const { transform } = options || {}
		if (!entity || typeof(entity) != 'object')
			return 0

		if (transform && typeof(transform) == 'function')
			yield Promise.resolve(null).then(() => transform(entity))

		_validateEntityType(entity)
		const newEntity = yield _insertEntityWithRetry({ table:getTableName(), entity })

		return newEntity
	})	

	this.where = _getWhereClause

	this.query = field => {
		const execute = where => _queryWithRetry({ table:getTableName(), where })
		return _getWhereClause(field, null, { execute }) 
	}

	/**
	 * Inserts new objects. 
	 * 
	 * @param {Object} entity 
	 * @param {Number} options.concurrency	Default 1.
	 * @yield {Object} entity 
	 */
	this.insert = (entity,options) => co(function *(){
		const { concurrency=1 } = options || {}
		if (!entity)
			return 0
		
		if (!Array.isArray(entity))
			return yield _insert(entity,options)

		const tasks = entity.map(e => (() => _insert(e,options)))
		return yield throttle(tasks, concurrency)
	})

	return this
}

module.exports = {
	Table,
	getDB,
	tools: {
		getNative,
		escapeDates
	},
	_: {
		convertToQueryParams: _convertToQueryParams,
		getWhereClause: _getWhereClause,
		mustBe:_mustBe,
		mustBeArrayOf:_mustBeArrayOf,
		mustExist:_mustExist
	}
}
