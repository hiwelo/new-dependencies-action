/* eslint-disable @typescript-eslint/camelcase, @typescript-eslint/explicit-member-accessibility */
import {getInput} from '@actions/core'
import {GitHub, context} from '@actions/github'
import _ from 'underscore'
import {Package} from '../../types/package'

class GitHubClient {
  /** Owner of the repository targetted by this API */
  public readonly owner: string
  /** Number of the current pull request */
  public readonly prNumber: number
  /** Repository to target when using this API */
  public readonly repo: string
  /** Hydrated Octokit client */
  private octokit: GitHub
  /** Hydrated base branch */
  private baseBranch?: string
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
    if (!this.baseBranch) {
      const {data} = await this.octokit.pulls.get({
        pull_number: this.prNumber,
        owner: this.owner,
        repo: this.repo
      })

      this.baseBranch = data.base.ref
    }

    return this.baseBranch
  }

  /**
   * Returns the content of the requested file in the requested branch
   *
   * @param file Requested file
   * @param branch Requested branch, defaults to master
   */
  public async getPackage(
    file: string,
    baseBranch: string
  ): Promise<Package | undefined> {
    const {data: fileInfo} = await this.octokit.repos.getContents({
      owner: this.owner,
      path: file,
      ref: baseBranch,
      repo: this.repo
    })

    // returns undefined if there is no file existing yet
    if (_.isArray(fileInfo) || !fileInfo.content || !fileInfo.encoding) {
      return undefined
    }

    return JSON.parse(
      new Buffer(fileInfo.content, fileInfo.encoding as 'base64').toString()
    )
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
