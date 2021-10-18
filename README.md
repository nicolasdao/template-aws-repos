# AWS SDK Repos &middot; [![License](https://img.shields.io/badge/License-BSD%203--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause) [![Neap](https://neap.co/img/made_by_neap.svg)](#this-is-what-we-re-up-to)
The __*AWS SDK Repos*__ project is a fork from the [https://github.com/nicolasdao/template-emptyjs](https://github.com/nicolasdao/template-emptyjs) project with an extra `_aws` folder and and extra `repos` folder. The first folder contains wrappers around the `AWS SDK` (easier APIs and retry mechanism) while the `repos` folder contains concrete examples on how to use those wrappers.

# Table of Contents

> * [Install](#install) 
> * [APIs](#apis)
>	- [Cloudfront](#cloudfront)
>		- [`cloudfront.distribution.exists`](#cloudfrontdistributionexists)
>		- [`cloudfront.distribution.select` and `cloudfront.distribution.find`](#cloudfrontdistributionselect-and-cloudfrontdistributionfind`)
>		- [`cloudfront.distribution.create`](#cloudfrontdistributioncreate)
>		- [`cloudfront.distribution.invalidate`](#cloudfrontdistributioninvalidate)
>		- [`cloudfront.distribution.update`](#cloudfrontdistributionupdate)
>	- [DynamoDB](#dynamodb)
>	- [Invoking Lambda](#invoking-lambda)
>	- [Parameter Store](#parameter-store)
>	- [Resource](#resource)
>	- [S3](#s3)
>		- [`s3.bucket.exists`](#s3bucketexists)
>		- [`s3.bucket.list`](#s3bucketlist)
>		- [`s3.bucket.get`](#s3bucketget)
>		- [`s3.bucket.setWebsite`](#s3bucketsetWebsite)
>		- [`s3.bucket.files.upload`](#s3bucketfilesupload)
>		- [`s3.bucket.files.sync`](#s3bucketfilessync)
>		- [`s3.bucket.files.remove`](#s3bucketfilesremove)
>	- [SNS](#sns)
>	- [Step-function](#step-function)
> * [Run locally](#run-locally)
> * [Deployment](#deployment)
> * [License](#license)
> * [Annexes](#annexes)
>	- [Cloudfront distribution with S3 static website bucket](#cloudfront-distribution-with-s3-static-website-bucket)
>	- [Cloudfront distribution with private S3 bucket ](#cloudfront-distribution-with-private-s3-bucket)


# Install
```
git clone https://github.com/nicolasdao/template-aws-repos.git new-project-name
cd new-project-name
npm install
npm test
npm start
```

# APIs
## Cloudfront

For concrete examples, please refer to the [Annexes](#annexes):
- [Cloudfront distribution with S3 static website bucket](#cloudfront-distribution-with-s3-static-website-bucket)
- [Cloudfront distribution with private S3 bucket ](#cloudfront-distribution-with-private-s3-bucket)

### `cloudfront.distribution.exists`

```js
const { error: { catchErrors, wrapErrors } } = require('puffy')
const { cloudfront } = require('./src/_aws')

const DISTRO = `my-distro-name`

const main = () => catchErrors((async () => {
	// ID exists
	const [idExistsErrors, idExists] = await cloudfront.distribution.exists({ 
		id: '12345'
	})
	if (idExistsErrors)
		throw wrapErrors(`Failed to find by ID`, idExistsErrors)
	else 
		console.log(`ID exists`)

	// Distro with tag exists
	const [tagExistsErrors, tagExists] = await cloudfront.distribution.exists({ 
		tags: { Name:DISTRO }
	})
	if (tagExistsErrors)
		throw wrapErrors(`Failed to find by ID`, tagExistsErrors)
	else 
		console.log(`Tag exists`)
```

### `cloudfront.distribution.select` and `cloudfront.distribution.find`

`find` and `select` uses the same API. `find` returns an object while `select` returns an array.

```js
const { error: { catchErrors, wrapErrors } } = require('puffy')
const { cloudfront } = require('./src/_aws')

const DISTRO = `my-distro-name`

const main = () => catchErrors((async () => {
	// Find by ID
	const [distroErrors, distro] = await cloudfront.distribution.find({ 
		id: '12345'
	})
	if (distroErrors)
		throw wrapErrors(`Failed to find by ID`, distroErrors)
	else if (distro)
		console.log(distro)
		// {
		// 	id: 'E2WJO325O501XD',
		// 	arn: 'arn:aws:cloudfront::084126072180:distribution/E2WJO325O501XD',
		// 	domainName: 'dyoumeptyjf92.cloudfront.net',
		// 	status: 'InProgress',
		// 	lastUpdate: 2021-10-15T08:40:11.908Z,
		// 	eTag: 'E1AQWRQF1J4O48',
		// 	origin: {
		// 		domain: 'nic-today-20211015.s3.ap-southeast-2.amazonaws.com',
		// 		type: 's3'
		// 	},
		// 	aliases: [],
		// 	enabled: true
		// }
	else
		console.log(`Distro not found`)

	// Find by tag
	const [distro2Errors, distro2] = await cloudfront.distribution.find({ 
		tags: { Name:DISTRO }
	})
	if (distro2Errors)
		throw wrapErrors(`Failed to find by tag`, distro2Errors)
	else if (distro2)
		console.log(distro2)
		// {
		// 	id: 'E2WJO325O501XD',
		// 	arn: 'arn:aws:cloudfront::084126072180:distribution/E2WJO325O501XD',
		// 	domainName: 'dyoumeptyjf92.cloudfront.net',
		// 	status: 'InProgress',
		// 	lastUpdate: 2021-10-15T08:40:11.908Z,
		// 	eTag: 'E1AQWRQF1J4O48',
		// 	origin: {
		// 		domain: 'nic-today-20211015.s3.ap-southeast-2.amazonaws.com',
		// 		type: 's3'
		// 	},
		// 	aliases: [],
		// 	enabled: true
		// }
	else
		console.log(`Distro not found`)
```

### `cloudfront.distribution.create`

```js
const { error: { catchErrors, wrapErrors } } = require('puffy')
const { cloudfront } = require('./src/_aws')

const DISTRO = `my-distro-name`

const main = () => catchErrors((async () => {
	const [distroErrors, distro] = await cloudfront.distribution.create({
		name: DISTRO,
		domain: 'my-bucket-website.s3.ap-southeast-2.amazonaws.com',
		operationId: '123456', 
		enabled: true,
		tags: { 
			Project:'Demo', 
			Env:'Dev',
			Name: DISTRO
		}
	})

	if (distroErrors)
		throw wrapErrors(`Distro creation failed`, distroErrors)

	console.log(distro)
	// {
	// 	id: 'E2WJO325O501XD',
	// 	arn: 'arn:aws:cloudfront::084126072180:distribution/E2WJO325O501XD',
	// 	status: 'InProgress'.
	// 	domain: 'dyoumeptyjf92.cloudfront.net'
	// }
```

### `cloudfront.distribution.invalidate`

```js
const { error: { catchErrors, wrapErrors } } = require('puffy')
const { cloudfront } = require('./src/_aws')

const main = () => catchErrors((async () => {
	// Invalidate all paths
	const [invalidationErrors, invalidation] = await cloudfront.distribution.invalidate({ 
		id: 'E2WJO325O501XD', 
		operationId: `${Date.now()}`, 
		paths: ['/*']
	})
	if (invalidationErrors)
		throw wrapErrors(`Failed to invalidate distro`, invalidationErrors) 

	console.log('Distro invalidation started')
	console.log(invalidation)
	// {
	// 	location: 'https://cloudfront.amazonaws.com/2019-03-26/distribution/E3ICGTU0Z3IYAZ/invalidation/IGLGGAGD9PT2X',
	// 	invalidation: {
	// 		id: 'IGLGGAGD9PT2X',
	// 		status: 'InProgress',
	// 		createTime: 2021-10-16T04:14:34.514Z,
	// 		paths: [ '/*' ],
	// 		operationId: '1634357673513'
	// 	}
	// }
```

### `cloudfront.distribution.update`

```js
const { error: { catchErrors, wrapErrors } } = require('puffy')
const { cloudfront } = require('./src/_aws')

const main = () => catchErrors((async () => {
	// Invalidate all paths
	const [updateErrors, results] = await cloudfront.distribution.update({ 
		id:'E2WJO325O501XD', 
		// tags: { Name:'my-distro' } // find by tags
		config: { // Update
			domain:bucketWeb01.bucketRegionalDomainName
		} 
	})
	if (updateErrors)
		throw wrapErrors('Failed to update distro', updateErrors) 

	console.log('Distro update successfull')
	console.log(results)
	// {
	// 	updateOccured: true, // False means that the last config is the same is the new, meaning there was no need for an update.
	// 	config: {
	// 		... 
	// 	}
	// }
```

## DynamoDB

```js
const { my_table } = require('./src/repos')

const now = new Date()

my_table.insert({ device_id:1, timestamp: new Date(), hello:'world' })

// Insert also supports arrays. Optionally, you can set the concurrency level for those inserts to match 
// your provisioning set up (default is 1). 
my_table.insert([
	{ device_id:2, timestamp: now, hello:'Nic' },
	{ device_id:3, timestamp: now, hello:'Carl' }
], { concurrency:2 })

// Check if a record already exists before inserting it. 
// IMPORTANT: 'ifNotExists' can either be a string or an array of strings. If the table is set up with a hash and a range,
// then this option must be an array with the names of those two keys, otherwise, it won't work. If there is no range key,
// then both a string or an array with a single item will work.
my_table.insert({ device_id:2, timestamp:now }, { ifNotExists:['device_id', 'timestamp'] })
	.catch(err => {
		if (err && err.code == 'ConditionalCheckFailedException')
			return 'This message already exists.'
		else
			return err.message
	})
	.then(console.log)

my_table
	.query('device_id').eq(1) // supported operators: 'eq', 'ne', 'between', 'in', 'gt', 'lt', 'ge', 'le'
	.and('timestamp').between(['2019-08-01', '2019-08-02'])
	.sortByRange('desc')
	.limit(20)
	.execute()
	.then(console.log) // { Items: [], Count: 0, ScannedCount: 0, LastEvaluatedKey:{} }

my_table
	.query('device_id').eq(1)
	.and('timestamp').between(['2019-08-01', '2019-08-02'])
	.first()
	.execute()
	.then(console.log) // { Items: [], Count: 0, ScannedCount: 0, LastEvaluatedKey:{} }

my_table
	.query('device_id').eq(1)
	.and('timestamp').between(['2019-08-01', '2019-08-02'])
	.last()
	.execute()
	.then(console.log) // { Items: [], Count: 0, ScannedCount: 0, LastEvaluatedKey:{} }

// This uses a DynamoDB SCAN instead of a QUERY (QUERY must be provided with a HASH key). With SCAN, you cannot:
//	- Limit
//	- Sort by
my_table
	.query()
	.and('timestamp').gt('2019-08-01')
	.execute()
	.then(console.log) // { Items: [], Count: 0, ScannedCount: 0, LastEvaluatedKey:{} }

// Scans the entire table ascending. Will only return the first 1MB. After, that you must use the 'LastEvaluatedKey' with the 'cursor' API.
my_table
	.query()
	.execute()
	.then(console.log) // { Items: [], Count: 0, ScannedCount: 0, LastEvaluatedKey:{} }

// Scans the entire table ascending. Will only return the first 1MB. After, that you must use the 'LastEvaluatedKey' with the 'cursor' API.
my_table
	.query()
	.cursor(LastEvaluatedKey)
	.execute()
	.then(console.log) // { Items: [], Count: 0, ScannedCount: 0, LastEvaluatedKey:{} }

my_table
	.delete('device_id').eq(1)
	.and('timestamp').between(['2019-08-01', '2019-08-02'])
	.execute()
	.then(console.log)

// IMPORTANT: In the following 3 examples:
//	- If there is a range key, 'key' MUST contain it. 'key' cannot just be made of the partition key.
//	- The type of 'some_field' must be number.
my_table.add(3).to('some_field').whereKey({ device_id:1, timestamp: '2019-10-29T03:04:33.579Z' }).then(console.log) // New value of some_field
my_table.increment('some_field').whereKey({ device_id:1, timestamp: '2019-10-29T03:04:33.579Z' }).then(console.log) // some_field + 1
my_table.decrement('some_field').whereKey({ device_id:1, timestamp: '2019-10-29T03:04:33.579Z' }).then(console.log) // some_field - 1
```

## Invoking Lambda

```js
const lambda = require('./aws/lambda')

const main = async () => {
	const [lambdaErrors, lambdaData] = await lambda.invoke({
		arn: process.env.LAMBDA_CREATE_S3_ARN,
		body: {
			project_id
		},
		async: false // Default false. True means fire and forget. Only StatusCode is returned.
		json:true //  Default false.  True means the 'lambdaData.Payload' which is a string is parsed to JSON.
	})

	console.log(lambdaData.StatusCode)
	console.log(lambdaData.Payload)
}

main()
```

## Parameter Store

```js
const { parameterStore } = require('.src/_aws')

parameterStore.get({
	name: 'my-parameter-store-name',
	version: 2, // Optional. If not defined, the latest version is used.
	json: true // Optional. Default false.
}).then(([errors, { Value }]) => console.log(Value))
```

To use this API, the following policy must be attached to the hosting environmnet's IAM role:

```js
{
	Version: '2012-10-17',
	Statement: [{
		Action: [
			'ssm:GetParameter'
		],
		Resource: '*',
		Effect: 'Allow'
	}]
}
```

## Resource

> __WARNING__: Certain AWS services are global (e.g., 'cloudfront'), which means their region is 'us-east-1'. 		

```js
const { error: { catchErrors, mergeErrors } } = require('puffy')
const { resource } = require('.src/_aws')

const main = () => catchErrors((async () => {
	const [resourceErrors, resources] = await resource.getByTags({ 
		tags: { // required
			Name:'my-resource-name' 
		}, 
		region: 'us-east-1', // required
		types: ['cloudfront:distribution'] // optional
	})
	if (resourceErrors)
		throw wrapErrors(`Failed to get resource by tag`, resourceErrors)

	console.log(resources)
	// {
	// 	paginationToken: '',
	// 	resources:[{
	// 		arn: 'arn:aws:cloudfront::1234567:distribution/SHWHSW3213',
	// 		tags: {
	// 			Name:'my-resource-name'
	// 		}
	// 	}]
	// }
})())

main().then(([errors]) => {
	if (errors)
		console.error(mergeErrors(errors).stack)
	else
		console.log('All good')
})
```

## S3

For concrete examples, please refer to the [Annexes](#annexes):
- [Cloudfront distribution with S3 static website bucket](#cloudfront-distribution-with-s3-static-website-bucket)
- [Cloudfront distribution with private S3 bucket ](#cloudfront-distribution-with-private-s3-bucket)

### `s3.bucket.exists`

```js
const { error: { catchErrors, mergeErrors } } = require('puffy')
const { s3 } = require('.src/_aws')

const main = () => catchErrors((async () => {
	const bucketName = 'some-bucket-name'
	const bucketExists = await s3.bucket.exists(bucketName)
	console.log(`Bucket '${bucketName} ${bucketExists ? ' ' : 'does not '}exist'`)
})())

main().then(([errors]) => {
	if (errors)
		console.error(mergeErrors(errors).stack)
	else
		console.log('All good')
})
```

### `s3.bucket.list`

```js
const { error: { catchErrors, wrapErrors, mergeErrors } } = require('puffy')
const { s3 } = require('.src/_aws')

const main = () => catchErrors((async () => {
	const [errors, bucketList] = await s3.bucket.list()
	if (errors)
		throw wrapErrors('Failed to list buckets', errors)
	else {
		console.log(`Found ${bucketList.buckets.length} buckets.`)
		console.log(bucketList.owner)
		if (bucketList.buckets.length) {
			console.log('First bucket')
			console.log(bucketList.buckets[0].name)
			console.log(bucketList.buckets[0].creationDate)
		}
	}
})())

main().then(([errors]) => {
	if (errors)
		console.error(mergeErrors(errors).stack)
	else
		console.log('All good')
})
```

### `s3.bucket.get`

```js
const { error: { catchErrors, wrapErrors, mergeErrors } } = require('puffy')
const { s3 } = require('.src/_aws')

const main = () => catchErrors((async () => {
	const bucketName = 'some-bucket-name'
	const [errors, bucket] = await s3.bucket.get(bucketName, { website:true })
	if (errors)
		throw wrapErrors('Failed to get bucket', errors)
	else {
		console.log(bucket)
		// {
		// 		region: 'ap-southeast-2',
		// 		location: 'http://some-bucket-name.s3.amazonaws.com/'
		// 		regionalLocation: 'http://some-bucket-name.s3.ap-southeast-2.amazonaws.com/',
		// 		bucketDomainName: 'some-bucket-name.s3.amazonaws.com'
		// 		bucketRegionalDomainName: 'some-bucket-name.s3.ap-southeast-2.amazonaws.com',
		// 		website: true, // Only with 'options.website:true'
		// 		websiteEndpoint: 'http://some-bucket-name.s3-website-ap-southeast-2.amazonaws.com' // Only with 'options.website:true'
		// }
	}
}
})())

main().then(([errors]) => {
	if (errors)
		console.error(mergeErrors(errors).stack)
	else
		console.log('All good')
})
```

### `s3.bucket.setWebsite`

```js
const { error: { catchErrors, wrapErrors, mergeErrors } } = require('puffy')
const { s3 } = require('.src/_aws')

const main = () => catchErrors((async () => {
	const bucketName = 'some-bucket-name'
	const [errors] = await s3.bucket.setWebsite({ 
		bucket: bucketName, 
		index: 'home.html', // default 'index.html'
		error: 'error.html'
	})
	if (errors)
		throw wrapErrors('Failed to get bucket', errors)
	else {
		console.log(`Bucket set as website`)
	}
}
})())

main().then(([errors]) => {
	if (errors)
		console.error(mergeErrors(errors).stack)
	else
		console.log('All good')
})
```

### `s3.bucket.files.upload`

```js
const { error: { catchErrors, wrapErrors, mergeErrors } } = require('puffy')
const { join } = require('path')
const { s3 } = require('.src/_aws')

const main = () => catchErrors((async () => {
	const [uploadErrors, filesInDir] = await s3.bucket.files.upload({ 
		bucket: 'my-super-bucket', 
		dir: join(__dirname, './app'), 
		ignore: '**/node_modules/**', 
		ignoreObjects:[{ key:'src/bundle.js', hash:'123456' }], // If 'src/bundle.js' has not changed (i.e., its hash is the same), then don't upload it
		noWarning: true
	})
	if (uploadErrors)
		throw wrapErrors('Failed to upload files to bucket', uploadErrors)
	else {
		console.log(`${filesInDir.length} files in directory`)
		console.log(filesInDir[0].key)
		console.log(filesInDir[0].hash)
	}
}
})())

main().then(([errors]) => {
	if (errors)
		console.error(mergeErrors(errors).stack)
	else
		console.log('All good')
})
```

### `s3.bucket.files.sync`

Does the same as 'upload' but with the ability to delete files that have been removed locally.

```js
const { error: { catchErrors, wrapErrors, mergeErrors } } = require('puffy')
const { join } = require('path')
const { s3 } = require('.src/_aws')

const main = () => catchErrors((async () => {
	const [syncErrors, synchedData] = await s3.bucket.files.sync({ 
		bucket: 'my-super-bucket', 
		dir: join(__dirname, './app'), 
		ignore: '**/node_modules/**', 
		ignoreObjects:[{ key:'src/bundle.js', hash:'123456' }], // If 'src/bundle.js' has not changed (i.e., its hash is the same), then don't upload it
		noWarning: true
	})
	if (syncErrors)
		throw wrapErrors('Failed to sync files to bucket', syncErrors)
	else {
		console.log(synchedData)
		// {
		// 	updated: true, // True means at least one file was either uploaded or deleted.
		// 	srcFiles:[{
		// 		file: '/Users/you/Documents/my-app/bundle.js',
		// 		dir: '/Users/you/Documents/my-app/',
		// 		key: 'bundle.js',
		// 		path: '/bundle.js',
		// 		hash: '32132313213123321313',
		// 		contentType: 'application/javascript',
		// 		contentLength: '12345',
		// 		content: 'dewdwedewdeewdedewdedewdedewdeew...',
		// 	}],
		// 	uploadedFiles:[{
		// 		file: '/Users/you/Documents/my-app/bundle.js',
		// 		dir: '/Users/you/Documents/my-app/',
		// 		key: 'bundle.js',
		// 		path: '/bundle.js',
		// 		hash: '32132313213123321313',
		// 		contentType: 'application/javascript',
		// 		contentLength: '12345',
		// 		content: 'dewdwedewdeewdedewdedewdedewdeew...',
		// 	}],
		// 	deletedFiles:[]
		// }
	}
}
})())

main().then(([errors]) => {
	if (errors)
		console.error(mergeErrors(errors).stack)
	else
		console.log('All good')
})
```

### `s3.bucket.files.remove`

```js
const { error: { catchErrors, wrapErrors, mergeErrors } } = require('puffy')
const { s3 } = require('.src/_aws')

const main = () => catchErrors((async () => {
	const [rmErrors] = await s3.bucket.files.remove({ 
		bucket: 'my-super-bucket', 
		keys:[
			'src/bundle.js',
			'src/bundle.map.js'
		]
	})
	if (rmErrors)
		throw wrapErrors('Failed to remove files from bucket', rmErrors)
	else
		console.log(`Files removed`)
}
})())

main().then(([errors]) => {
	if (errors)
		console.error(mergeErrors(errors).stack)
	else
		console.log('All good')
})
```

## SNS

```js
const { sns } = require('.src/_aws')

// process.env.YOUR_TOPIC_ARN.
// WARNING: To get a topic's ARN in the serverless.yml, use `!Ref` instead of the usual `GetAttr`.
const topic = sns.topic(process.env.YOUR_TOPIC_ARN)

topic.send('Hello world').then(console.log) // { ResponseMetadata: { RequestId: '123' }, MessageId: '173' }

topic.send({ 
	body:{ hello: 'world' },
	attributes: {
		'whatever-name': 'whatever value' // List of attributes at https://docs.aws.amazon.com/sns/latest/dg/sns-message-attributes.html#SNSMessageAttributes.DataTypes.
	}
}).then(console.log) // { ResponseMetadata: { RequestId: '123' }, MessageId: '173' }

// Sends an SMS.
// WARNING: 
//	- You actually don't need to set up the topic ARN for this to work. Sending an SMS uses SNS' SMS capability which is unique to your AWS account.
//	- SNS's SMS has MASSIVE limitations:
//		1. You are limited to 1USD per month worth of SMSes sent!!! That will get you nowhere. To increase that limit contact AWS and describe your business case.
//		2. Though you receive a response from the send API, it is useless. If you need to debug your messages, you have to configure CloudWatch.
//
// IMHO, use Twilio or any other SaaS to delive SMSes. AWS SNS for SMSes is dead easy to use, but quite frankly, not really usefull for production usage.
topic.send('hello world', {
	phone: '+61435765432', // Phone number in E.164 format.
	subject: 'ALERT', // (Optional) limited to 11 characters.
	type: 'transactional' // (Optional, default is 'promotional').
}).then(console.log) // { ResponseMetadata: { RequestId: '123' }, MessageId: '173' }
```

## Step-function

```js
const { stepFunction } = require('.src/_aws')

stepFunction.startExecution({ 
	arn:'arn:aws:states:ap-southeast-2:1234:stateMachine:my-step-function-name',
	// name: 'dewd', // Optional name used for idempotence. Must be unique.
	input: {
		some: 'value'
	}
}).then(([errors]) => console.log(errors))

parameterStore.get({
	name: 'my-parameter-store-name',
	version: 2, // Optional. If not defined, the latest version is used.
	json: true // Optional. Default false.
}).then(([errors, { Value }]) => console.log(Value))
```

To use this API, the following policy must be attached to the hosting environmnet's IAM role:

```js
{
	Version: '2012-10-17',
	Statement: [{
		Action: [
			'ssm:GetParameter'
		],
		Resource: '*',
		Effect: 'Allow'
	}]
}
```

# Run locally

This template offers preconfigured npm scripts that cover the most common deployment types:

| NPM Command | Command | Description |
|:------------|:--------|:------------|
| `npm run dev` | `TZ=UTC NODE_ENV=dev node-dev -r sls-config-parser/setenv index.js --inclcreds` | Set up all the enviornment variables defined in the `serverless.yml` and also include the AWS credentials associated to the AWS profile defined in the `serverless.yml` under `provider.profile` or in the `default` profile defined under `~/.aws/credentials`. Those credentials are necessary if you wish to call AWS APIs. |
| `npm run prod` | `TZ=UTC NODE_ENV=dev node-dev -r sls-config-parser/setenv index.js --inclcreds --stage prod --force 'provider.profile=neap_prod;provider.region=ap-southeast-2'` | `--force ...` overrides specific properties in the `serverless.yml`. |


# Deployment

This template offers preconfigured npm scripts that cover the most common deployment types:

| NPM Command | Command | Description |
|:------------|:--------|:------------|
| `npm run deploy:dev` | `sls deploy --stage dev` | Basic deploy using the `serverless CLI` tool. Because no profile is passed, it first tries to use the profile defined in the `serverless.yml` under `provider.profile`. It falls back on the `default` profile defined under `~/.aws/credentials` if the serverless.yml file does not specify a profile. |
| `npm run deploy:prod` | `sls deploy --stage prod --aws-profile neap_prod --force` | Explicitely defines which `~/.aws/credentials` to use and forces the deployment (i.e., deploy even if no changes to the infrastructure are detected). |

# Annexes
## Cloudfront distribution with S3 static website bucket

The 2 APIs in the code below are:
- `cloudfront.distribution.exists`
- `cloudfront.distribution.create`

Notice that the only way to use `cloudfront.distribution.exists` with another predicate than the Cloudfront distribution ID is with tagging. This means that the distro MUST be tagged. 

```js
const { error: { catchErrors, wrapErrors, mergeErrors } } = require('puffy')
const { join } = require('path')
const { s3, cloudfront, resource } = require('./src/_aws')

const BUCKET = 'nic-today-20211015'
const DISTRO = `${BUCKET}-distro`
const REGION = 'ap-southeast-2'

const main = () => catchErrors((async () => {
	// 1.Making sure the bucket exists
	if (!(await s3.bucket.exists(BUCKET))) {
		console.log(`Creating bucket '${BUCKET}'...`)
		const [createErrors, newBucket] = await s3.bucket.create({ 
			name: BUCKET, 
			acl: 'public-read',  // Default 'private'
			region: REGION, // default: 'us-east-1' 
			tags: { 
				Project:'Demo', 
				Env:'Dev' 
			}
		})

		if (createErrors)
			throw wrapErrors(`Bucket creation failed`, createErrors)

		console.log(`Bucket '${BUCKET}' successfully created.`)
	} else
		console.log(`Bucket '${BUCKET}' already exists.`)

	const [getErrors, bucketDetails] = await s3.bucket.get(BUCKET, { website:true })
	if (getErrors)
		throw wrapErrors(`Bucket info failed`, getErrors)

	// 2. Making sure the website is set as a website
	if (!bucketDetails.website) {
		console.log(`Setting bucket '${BUCKET}' to website`)
		const [websiteErrors] = await s3.bucket.setWebsite({ bucket:BUCKET })
		if (websiteErrors)
			throw wrapErrors(`Failed to set bucket as website`, websiteErrors)
	} else
		console.log(`Bucket '${BUCKET}' already set to website`)

	// 3. Uploading files to the bucket
	const [syncErrors] = await s3.bucket.files.sync({
		bucket: BUCKET, 
		dir: join(__dirname, './demo'), 
		noWarning: true
	})

	if (syncErrors)
		throw wrapErrors(`Synching files failed`, syncErrors)

	// 4. Adding a cloudfront distro on the bucket
	const [distroExistsErrors, distroExists] = await cloudfront.distribution.exists({ 
		tags: { Name:DISTRO }
	})
	if (distroExistsErrors)
		throw wrapErrors(`Failed to confirm whether the distro exists or not`, distroExistsErrors)

	if (!distroExists) {
		console.log(`Creating new distro tagged 'Name:${DISTRO}' for bucket '${BUCKET}'`)
		const [distroErrors, distro] = await cloudfront.distribution.create({
			name: DISTRO,
			domain: bucketDetails.bucketRegionalDomainName,
			operationId: DISTRO, 
			enabled: true,
			tags: { 
				Project:'Demo', 
				Env:'Dev',
				Name: DISTRO
			}
		})

		if (distroErrors)
			throw wrapErrors(`Distro creation failed`, distroErrors)

		console.log(`Distro successfully created`)
		console.log(distro)
	} else
		console.log(`Distro tagged 'Name:${DISTRO}' already exist`)
})())

main().then(([errors]) => {
	if (errors)
		console.error(mergeErrors(errors).stack)
	else
		console.log('All good')
})
```

## Cloudfront distribution with private S3 bucket 

# License
Copyright (c) 2017-2019, Neap Pty Ltd.
All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
* Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
* Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
* Neither the name of Neap Pty Ltd nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL NEAP PTY LTD BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

<p align="center"><a href="https://neap.co" target="_blank"><img src="https://neap.co/img/neap_color_horizontal.png" alt="Neap Pty Ltd logo" title="Neap" height="89" width="200"/></a></p>
