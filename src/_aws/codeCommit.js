// Doc: https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CodeCommit.html
const { error: { catchErrors, wrapErrors } } = require('puffy')

let _codeCommit
const getCodeCommit = () => {
	if (!_codeCommit) {
		const AWS = require('aws-sdk')
		if (process.env.REGION)
			AWS.config.update({region:process.env.REGION})
		_codeCommit = new AWS.CodeCommit({apiVersion: '2015-04-13'})
	}
	return _codeCommit
}

const _promisify = fn => (...args) => catchErrors(new Promise((next,fail) => {
	const codeCommit = getCodeCommit()
	codeCommit[fn](...args, (err,data) => {
		if (err)
			fail(err)
		else
			next(data)
	})
}))

/**
 * Pushes a file to a repo. If the subfolder does not exist, it is created. 
 * 
 * @param  {String}  content
 * @param  {String}  repo
 * @param  {String}  branch				Default: 'master'
 * @param  {String}  filePath
 * @param  {String}  email
 * @param  {String}  commitMessage
 * @param  {String}  committer
 * @param  {String}  parentCommitId		Required if this is not the first commit in this repo.
 * 
 * @return {[Error]} resp[0].errors
 * @return {String}  resp[1].commitId
 * @return {String}  resp[1].blobId
 * @return {String}  resp[1].treeId
 */
const pushFile = ({ content='', repo, branch='master', filePath, email, commitMessage, committer, parentCommitId }) => catchErrors((async () => {
	const errMsg = `Fail to push file ${filePath} to ${repo}:${branch}`
	const [errors, resp] = await _promisify('putFile')({
		branchName: branch,
		fileContent: content,
		filePath,
		repositoryName: repo,
		commitMessage,
		email,
		name: committer,
		parentCommitId
	})
	if (errors)
		throw wrapErrors(errMsg, errors)
	return resp
})())

/**
 * Lists all repositories in the current account. 
 * 
 * @param  {String}  order		Valid values: 'asc' (default), 'desc'
 * @param  {String}  sortBy		Valid values: 'name' (default), 'creation_date'
 * @param  {String}  nextToken	
 * 
 * @return {[Error]} resp[0].errors
 * @return {String}  resp[1].count
 * @return {String}  resp[1].data[].id
 * @return {String}  resp[1].data[].name
 */
const listRepositories = query => catchErrors((async () => {
	const { order, sortBy, nextToken } = query||{}
	const errMsg = 'Fail to list repositories'
	const [errors, resp] = await _promisify('listRepositories')({ 
		order: order ? order == 'asc' ? 'ascending' : 'descending' : 'ascending', 
		sortBy, 
		nextToken 
	})
	if (errors)
		throw wrapErrors(errMsg, errors)

	if (!resp || !resp.repositories || !resp.repositories.length)
		return {
			count: 0,
			data:[]
		}
	else 
		return {
			count: resp.repositories.length, 
			data: resp.repositories.map(r => ({
				id: r.repositoryId,
				name: r.repositoryName
			}))
		}
})())

/**
 * Gets a repository from the current account. 
 * 
 * @param  {String}  order		Valid values: 'asc' (default), 'desc'
 * @param  {String}  sortBy		Valid values: 'name' (default), 'creation_date'
 * @param  {String}  nextToken	
 * 
 * @return {[Error]} resp[0].errors
 * @return {String}  resp[1].id
 * @return {String}  resp[1].name
 * @return {String}  resp[1].defaultBranch
 * @return {String}  resp[1].accountId
 * @return {String}  resp[1].lastModifiedDate
 * @return {String}  resp[1].creationDate
 * @return {String}  resp[1].cloneUrlHttp
 * @return {String}  resp[1].cloneUrlSsh
 * @return {String}  resp[1].Arn
 */
const getRepository = name => catchErrors((async () => {
	if (!name)
		return null
	
	const errMsg = `Fail to get repository ${name}`
	const [errors, resp] = await _promisify('getRepository')({ 
		repositoryName: name
	})
	if (errors)
		throw wrapErrors(errMsg, errors)

	if (!resp || !resp.repositoryMetadata)
		return null 
	else 
		return {
			id: resp.repositoryMetadata.repositoryId,
			name: resp.repositoryMetadata.repositoryName,
			defaultBranch: resp.repositoryMetadata.defaultBranch,
			accountId: resp.repositoryMetadata.accountId,
			lastModifiedDate: resp.repositoryMetadata.lastModifiedDate ? new Date(resp.repositoryMetadata.lastModifiedDate) : null,
			creationDate: resp.repositoryMetadata.creationDate ? new Date(resp.repositoryMetadata.creationDate) : null,
			cloneUrlHttp: resp.repositoryMetadata.cloneUrlHttp,
			cloneUrlSsh: resp.repositoryMetadata.cloneUrlSsh,
			Arn: resp.repositoryMetadata.Arn
		}
})())

module.exports = {
	pushFile,
	listRepositories,
	getRepository
}