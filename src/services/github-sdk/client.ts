/* eslint-disable @typescript-eslint/camelcase, @typescript-eslint/explicit-member-accessibility */
import {getInput} from '@actions/core'
import {GitHub, context} from '@actions/github'
import _ from 'underscore'
import {Package} from '../../types/package'
import {COMMENT_IDENTIFIER} from '../../config/comment'

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
  /** Hydrated id of the message created by this action */
  private messageId?: number | false
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
   * Create the message created by this action with the provided content
   *
   * @param content Content of the updated message
   */
  public async createMessage(content: string): Promise<void> {
    if (this.messageId) return this.updateMessage(content)

    await this.octokit.issues.createComment({
      owner: this.owner,
      repo: this.repo,
      issue_number: this.prNumber,
      body: content
    })
  }

  /**
   * Delete the message created by this action
   */
  public async deleteMessage(): Promise<void> {
    if (!this.messageId) return

    await this.octokit.issues.deleteComment({
      owner: this.owner,
      repo: this.repo,
      comment_id: this.messageId
    })

    this.messageId = false
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
      Buffer.from(fileInfo.content, fileInfo.encoding as 'base64').toString()
    )
  }

  /**
   * Fetch the id of an existing message made by this action
   */
  public async fetchMessage(): Promise<number | undefined> {
    if (this.messageId === undefined) {
      const {data} = await this.octokit.issues.listComments({
        owner: this.owner,
        repo: this.repo,
        issue_number: this.prNumber
      })

      const actionMessages = data.filter(message =>
        message.body.includes(COMMENT_IDENTIFIER)
      )

      this.messageId = actionMessages.length ? actionMessages[0].id : false
    }

    return this.messageId || undefined
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
   * Set the message created by this action with the provided content by
   * creating a new comment or updating the existing one depending on the
   * current situation
   *
   * @param content Content of the updated message
   */
  public async setMessage(content: string): Promise<void> {
    // look for an existing message if not already done
    if (this.messageId === undefined) await this.fetchMessage()

    // updates the existing message if existing
    if (this.messageId) return this.updateMessage(content)

    // creates a new message if not already existing
    await this.createMessage(content)
  }

  /**
   * Update the message created by this action with the provided content
   *
   * @param content Content of the updated message
   */
  public async updateMessage(content: string): Promise<void> {
    if (!this.messageId) return this.createMessage(content)

    await this.octokit.issues.updateComment({
      owner: this.owner,
      repo: this.repo,
      comment_id: this.messageId,
      body: content
    })
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
