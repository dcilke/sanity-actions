import {info} from '../lib/core.js'
import {getOctokitClient, getRepoDetails} from '../lib/github.js'

export async function setPRStatus(state, description) {
  try {
    if (!state || !description) {
      throw new Error('state and description are required')
    }

    const details = getRepoDetails()
    const octokit = getOctokitClient()

    await octokit.rest.repos.createCommitStatus({
      ...details,
      state,
      description,
      context: 'sanity/preview',
    })

    info(`✅ Set ${state} status: ${description}`)
  } catch (err) {
    if (err) {
      console.log(`PR status ${state}: ${description}`)
      return
    }

    throw new Error(`Failed to set PR status`, {cause: err})
  }
}
