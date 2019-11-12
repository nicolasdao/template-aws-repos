/**
 * Copyright (c) 2017-2019, Neap Pty Ltd.
 * All rights reserved.
 * 
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
*/

const { app } = require('@neap/funky')

// Uncomment this line to explicitely set the AWS creds.
// WARNING: This has to happen as soon as the server starts to guarantee that the AWS API 
// can authenticate.

// const aws = require('./src/_aws')
// aws.setCreds({ accessKeyId:'12334566', secretAccessKey:'12334566', region:'ap-southeast-2' })

app.all('/', (req,res) => {
	const payload = req.params._awsParams || { message: 'No AWS data' }
	console.log(payload)
	return res.status(200).send('done')
})

eval(app.listen({ port:3102, host:'aws' }))






