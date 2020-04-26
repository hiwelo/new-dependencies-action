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
  const fileContent = await readFileAsync(file, {
    encoding: 'utf8'
  })

  return JSON.parse(fileContent)
}

export default getLocalPackageInfo
