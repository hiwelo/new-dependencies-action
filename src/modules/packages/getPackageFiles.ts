import {PACKAGE_FILE_NAME} from '../../config/package'
import GitHubClient from '../../services/github-sdk'

/**
 * Lists all updated package files in the current pull request
 *
 * @param context Context to use for the GitHub API call
 */
async function getPackageFiles(): Promise<string[]> {
  // lists all updated files in the current pull request
  const ghClient = GitHubClient.getClient()
  const files = await ghClient.listFiles()

  // returns the filtered list of package files
  return files.filter(file => file.includes(PACKAGE_FILE_NAME))
}

export default getPackageFiles
