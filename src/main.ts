/* eslint-disable @typescript-eslint/camelcase */
import * as core from '@actions/core'
import * as github from '@actions/github'
import _ from 'underscore'
import getLocalPackageInfo from './modules/packages/getLocalPackageInfo'
import {COMMENT_IDENTIFIER} from './config/comment'

async function run(): Promise<void> {
  try {
    // setup an hydrated Octokit client
    const ghToken = core.getInput('token')
    const octokit = new github.GitHub(ghToken)
    const repoContext = github.context.repo
    const prContext = github.context.issue
    const context = {
      ...repoContext,
      pull_number: prContext.number
    }

    // get information about the PR
    const {data: pullRequest} = await octokit.pulls.get({
      ...context
    })
    const {ref: baseBranch} = pullRequest.base

    // get updated files in this PR
    const {data: files} = await octokit.pulls.listFiles({
      ...context
    })

    // filters `package.json` files in this PR
    const packagesFiles = files.filter(file =>
      file.filename.includes('package.json')
    )

    // early-termination if there is no file
    if (!packagesFiles.length) return

    // select the main package file
    const packageFile = packagesFiles[0]
    const {filename: packageFileName} = packageFile

    // fetch content from the base branch
    const {data: basePackage} = await octokit.repos.getContents({
      ...repoContext,
      path: packageFileName,
      ref: baseBranch
    })

    // throw error if the result is not a file
    if (
      _.isArray(basePackage) ||
      !basePackage.content ||
      !basePackage.encoding
    ) {
      throw new Error(
        'It looks like the result sent by the GitHub API is not what was expected.'
      )
    }

    // get the content of the base dependencies
    const basePackageContent = JSON.parse(
      new Buffer(
        basePackage.content,
        basePackage.encoding as 'base64'
      ).toString()
    )

    // get the current dependencies
    const currentPackageContent = await getLocalPackageInfo(packageFileName)

    // fetches deps list from both files
    const existingDeps = Object.keys(basePackageContent.dependencies)
    const existingDevDeps = Object.keys(basePackageContent.devDependencies)
    const updatedDeps = Object.keys(currentPackageContent.dependencies)
    const updatedDevDeps = Object.keys(currentPackageContent.devDependencies)

    // detect new dependencies
    const newDeps = updatedDeps.filter(dep => !existingDeps.includes(dep))
    const newDevDeps = updatedDevDeps.filter(
      dep => !existingDevDeps.includes(dep)
    )

    // early-termination if there is no new dependencies
    if (!newDeps.length && !newDevDeps.length) return

    // creates the content of the comment
    const commentBody = `
${COMMENT_IDENTIFIER}
deps: ${newDeps.join(',')}
devDeps: ${newDevDeps.join(',')}
`

    // checks if a comment already exists
    const {data: comments} = await octokit.issues.listComments({
      ...repoContext,
      issue_number: prContext.number
    })
    const actionComments = comments.filter(comment =>
      comment.body.includes(COMMENT_IDENTIFIER)
    )

    // if existing, update the comment with the new body
    if (actionComments.length) {
      await octokit.issues.updateComment({
        ...repoContext,
        comment_id: actionComments[0].id,
        body: commentBody
      })

      return
    }

    // if not already existing, create a new comment
    await octokit.issues.createComment({
      ...repoContext,
      issue_number: prContext.number,
      body: commentBody
    })
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
