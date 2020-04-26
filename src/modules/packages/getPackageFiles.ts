import {getInput} from '@actions/core'
import {GitHub} from '@actions/github'
import {PACKAGE_FILE_NAME} from '../../config/package'

/**
 * Lists all updated package files in the current pull request
 *
 * @param context Context to use for the GitHub API call
 */
async function getPackageFiles(context: {
  owner: string
  pull_number: number
  repo: string
}): Promise<string[]> {
  // setups GitHub API
  const ghToken = getInput('token')
  const octokit = new GitHub(ghToken)

  // lists all updated files in the current pull request
  const {data: files} = await octokit.pulls.listFiles({...context})

  // lists all package files updated in this PR
  const packageFiles = files.filter(file =>
    file.filename.includes(PACKAGE_FILE_NAME)
  )

  // returns an array from the list of package files
  return packageFiles.map(file => file.filename)
}

export default getPackageFiles
