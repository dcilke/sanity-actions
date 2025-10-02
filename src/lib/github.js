import {getOctokit} from '@actions/github'
import {readFileSync} from 'fs'

let cachedClient
let cachedToken

export function getOctokitClient() {
  const {GITHUB_TOKEN} = process.env
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN is required to call GitHub APIs')
  }

  if (!cachedClient || cachedToken !== GITHUB_TOKEN) {
    cachedToken = GITHUB_TOKEN
    cachedClient = getOctokit(GITHUB_TOKEN)
  }

  return cachedClient
}

export function getRepoDetails() {
  const {GITHUB_REPOSITORY, GITHUB_REPOSITORY_OWNER, GITHUB_SHA} = process.env
  const [repoOwner, repo] = (GITHUB_REPOSITORY || '').split('/')
  const owner = GITHUB_REPOSITORY_OWNER || repoOwner
  const ref = GITHUB_SHA

  if (!repo) {
    throw new Error('Missing repository metadata. Ensure GITHUB_REPOSITORY is set')
  }

  if (!owner) {
    throw new Error('Missing repository metadata. Ensure GITHUB_REPOSITORY_OWNER is set')
  }

  if (!ref) {
    throw new Error('Missing repository metadata. Ensure GITHUB_SHA is set')
  }

  return {owner, repo, ref}
}

/**
 * Detects if we're running in a PR context
 */
export function isPullRequest() {
  const {GITHUB_EVENT_NAME} = process.env
  return GITHUB_EVENT_NAME === 'pull_request' || GITHUB_EVENT_NAME === 'pull_request_target'
}

/**
 * Gets the current branch name
 */
export function getCurrentBranch() {
  const {GITHUB_HEAD_REF, GITHUB_REF} = process.env
  if (isPullRequest() && GITHUB_HEAD_REF) {
    return GITHUB_HEAD_REF
  }

  const ref = GITHUB_REF || ''
  if (ref.startsWith('refs/heads/')) {
    return ref.replace('refs/heads/', '')
  }

  return null
}

export function getPullRequestNumber(env = process.env) {
  if (env.PR_NUMBER) {
    const parsed = Number.parseInt(env.PR_NUMBER, 10)
    if (!Number.isNaN(parsed)) {
      return parsed
    }
  }

  const eventName = env.GITHUB_EVENT_NAME
  if (eventName !== 'pull_request' && eventName !== 'pull_request_target') {
    throw new Error('This workflow did not run in a pull request context')
  }

  const eventPath = env.GITHUB_EVENT_PATH
  if (!eventPath) {
    throw new Error('GITHUB_EVENT_PATH is not defined')
  }

  try {
    const raw = readFileSync(eventPath, 'utf8')
    const payload = JSON.parse(raw)
    if (payload?.number) {
      return payload.number
    }
    if (payload?.pull_request?.number) {
      return payload.pull_request.number
    }
  } catch (error) {
    throw new Error(`Failed to read pull request payload: ${error.message}`)
  }

  throw new Error('Could not determine pull request number from event payload')
}

export default {
  getOctokitClient,
  getRepoDetails,
  isPullRequest,
  getPullRequestNumber,
  getCurrentBranch,
}
