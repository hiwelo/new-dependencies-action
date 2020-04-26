/* eslint-disable @typescript-eslint/camelcase, @typescript-eslint/explicit-member-accessibility */
import {getInput} from '@actions/core'
import {GitHub, context} from '@actions/github'

class GitHubClient {
  /** Owner of the repository targetted by this API */
  public readonly owner: string
  /** Number of the current pull request */
  public readonly prNumber: number
  /** Repository to target when using this API */
  public readonly repo: string
  /** Hydrated Octokit client */
  private octokit: GitHub
  /** Hydrated instance of this client */
  private static hydratedInstance?: GitHubClient = undefined

  constructor() {
    /** Hydrates the Octokit client with the provided token */
    this.octokit = new GitHub(getInput('token'))

    /** Initializes the context information */
    const {number} = context.issue
    const {owner, repo} = context.repo

    this.owner = owner
    this.prNumber = number
    this.repo = repo
  }

  /**
   * Returns the ref of the base branch for the current pull request
   */
  public async getBaseBranch(): Promise<string> {
    const {data} = await this.octokit.pulls.get({
      pull_number: this.prNumber,
      owner: this.owner,
      repo: this.repo
    })

    return data.base.ref
  }

  /**
   * List files in the current pull request
   */
  public async listFiles(): Promise<string[]> {
    const {data} = await this.octokit.pulls.listFiles({
      owner: this.owner,
      repo: this.repo,
      pull_number: this.prNumber
    })

    return data.map(file => file.filename)
  }

  /**
   * Returns an hydrated instance of the GitHubClient, and creates it if not existing
   */
  public static getClient(): GitHubClient {
    if (!this.hydratedInstance) this.hydratedInstance = new GitHubClient()

    return this.hydratedInstance
  }
}

export default GitHubClient
