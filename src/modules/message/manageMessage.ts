import {DependenciesList} from '../../types/package'
import GitHubClient from '../../services/github-sdk'
import draftMessage from './draftMessage'

async function manageMessage(
  newDependencies?: DependenciesList
): Promise<void> {
  const ghClient = GitHubClient.getClient()
  const actionMessageId = await ghClient.fetchMessage()
  const hasNewDependencies =
    newDependencies?.dependencies.length ||
    newDependencies?.devDependencies.length

  // early-termination if there is no new dependencies and no existing message
  if (!actionMessageId && !hasNewDependencies) return

  // termination with message deletion if existing message & no new dependencies
  if (actionMessageId && !hasNewDependencies) return ghClient.deleteMessage()

  if (!newDependencies) {
    throw new Error(
      'No new dependencies should have been solved by the previous conditions'
    )
  }

  // generate the new content for the message
  const message = await draftMessage(newDependencies)

  // publish the new content for the action
  await ghClient.setMessage(message)
}

export default manageMessage
