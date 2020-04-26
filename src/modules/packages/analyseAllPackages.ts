import {DependenciesList} from '../../types/package'
import analysePackage from './analysePackage'

/**
 * Returns the list of all new dependencies not existing in the base branch
 * for all the packages provided as a parameter
 *
 * @param files List of packages to analyse with the base branch
 */
async function analyseAllPackages(files: string[]): Promise<DependenciesList> {
  const dependencies: DependenciesList = {
    dependencies: [],
    devDependencies: []
  }

  for (const file of files) {
    const result = await analysePackage(file)

    dependencies.dependencies = [
      ...dependencies.dependencies,
      ...result.dependencies
    ]

    dependencies.devDependencies = [
      ...dependencies.devDependencies,
      ...result.devDependencies
    ]
  }

  return dependencies
}

export default analyseAllPackages
