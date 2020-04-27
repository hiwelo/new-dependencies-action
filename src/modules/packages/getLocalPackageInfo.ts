import {readFile} from 'fs'
import {promisify} from 'util'
import {Package} from '../../types/package'

const readFileAsync = promisify(readFile)

/**
 * Fetches the content of the requested local `package.json` file
 *
 * @param file path to the requested local `package.json` file
 */
async function getLocalPackageInfo(file = 'package.json'): Promise<Package> {
  try {
    const fileContent = await readFileAsync(file, {
      encoding: 'utf8'
    })

    const content = JSON.parse(fileContent)

    return {
      dependencies: content?.dependencies || {},
      devDependencies: content?.devDependencies || {}
    }
  } catch (error) {
    return {
      dependencies: {},
      devDependencies: {}
    }
  }
}

export default getLocalPackageInfo
