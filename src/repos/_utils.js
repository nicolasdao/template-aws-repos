

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

module.exports = {
	getNative,
	escapeDates
}






