/* eslint-disable @typescript-eslint/camelcase */
import * as core from '@actions/core'
import * as github from '@actions/github'
import {COMMENT_IDENTIFIER} from './config/comment'
import getPackageFiles from './modules/packages/getPackageFiles'
import analysePackage from './modules/packages/analysePackage'

async function run(): Promise<void> {
  try {
    // setup an hydrated Octokit client
    const ghToken = core.getInput('token')
    const octokit = new github.GitHub(ghToken)
    const repoContext = github.context.repo
    const prContext = github.context.issue

    // get updated files in this PR
    const packageFiles = await getPackageFiles()

    // early-termination if there is no file
    if (!packageFiles.length) return

    // select the main package file
    const packageFile = packageFiles[0]

    // fetch list of new dependencies for this package
    const newDependencies = await analysePackage(packageFile)

    // early-termination if there is no new dependencies
    if (
      !newDependencies.dependencies.length &&
      !newDependencies.devDependencies.length
    ) {
      return
    }

    // creates the content of the comment
    const commentBody = `
${COMMENT_IDENTIFIER}
deps: ${newDependencies.dependencies.join(',')}
devDeps: ${newDependencies.devDependencies.join(',')}
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
