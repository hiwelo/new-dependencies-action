import {debug} from '@actions/core'
import packageJson, {FullMetadata} from 'package-json'
import {COMMENT_IDENTIFIER} from '../../config/comment'
import {DependenciesList} from '../../types/package'

async function draftMessage(
  newDependencies: DependenciesList
): Promise<string> {
  // list all dependencies to render
  const listDependencies = [
    ...newDependencies.dependencies,
    ...newDependencies.devDependencies
  ]

  // // fetch information for all dependencies to render
  const info: Record<string, FullMetadata> = {}
  for (const dependency of listDependencies) {
    try {
      info[dependency] = await packageJson(dependency, {fullMetadata: true})
    } catch (error) {
      debug(`Package not found: ${dependency}`)
    }
  }

  const messageInfo = (dep: string): string =>
    `
### ${
      info[dep].homepage
        ? `[${info[dep].name}](${info[dep].homepage})`
        : info[dep].name
    }\n

<table>
  ${
    info[dep].description
      ? `<tr><td>Description</td><td>${info[dep].description}</td></tr>`
      : ``
  }
  ${
    info[dep].author?.name
      ? `<tr><td>Author</td><td>${info[dep].author?.name}</td></tr>`
      : ``
  }
  ${
    info[dep].license
      ? `<tr><td>License</td><td>${info[dep].license}</td></tr>`
      : ``
  }
  ${
    info[dep].versions
      ? `<tr><td>Versions</td><td>${info[dep].versions}</td></tr>`
      : ``
  }
  ${
    info[dep].users
      ? `<tr><td>Estimated number of users</td><td>${info[dep].users}</td></tr>`
      : ``
  }
  ${
    info[dep].contributors
      ? `<tr><td>Contributors</td><td>${info[dep].contributors}</td></tr>`
      : ``
  }
  ${
    info[dep].time?.created
      ? `<tr><td>Created on</td><td>${info[dep].time.created}</td></tr>`
      : ``
  }
  ${
    info[dep].time?.modified
      ? `<tr><td>Last modified</td><td>${info[dep].time.modified}</td></tr>`
      : ``
  }
</table>
${
  info[dep].readme
    ? `<details><summary>README.md</summary>${info[dep].readme}</details> `
    : ``
}
    `

  const message = `
${COMMENT_IDENTIFIER}
## Dependencies added
${newDependencies.dependencies.map(messageInfo).join(`\n`)}

## Development dependencies added
${newDependencies.devDependencies.map(messageInfo).join(`\n`)}
`

  return message.trim()
}

export default draftMessage
