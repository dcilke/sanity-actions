import {error} from '../lib/core.js'
import {getOctokitClient, getRepoDetails} from '../lib/github.js'

export async function createGithubDeployment(type, cfg, url) {
  const {isPR} = cfg
  try {
    const details = getRepoDetails()
    const octokit = getOctokitClient()

    const environment = isPR ? `preview-${type}` : type

    /* eslint-disable camelcase */
    const deploymentResponse = await octokit.rest.repos.createDeployment({
      ...details,
      environment,
      auto_merge: false,
      required_contexts: [],
      transient_environment: isPR,
      production_environment: !isPR,
    })
    /* eslint-enable camelcase */

    const deployment = deploymentResponse.data

    const urls = Array.isArray(url) ? url : [url]
    for (const u of urls) {
      /* eslint-disable camelcase */
      await octokit.rest.repos.createDeploymentStatus({
        ...details,
        deployment_id: deployment.id,
        state: 'success',
        environment_url: u,
        description: `${type} deployed`,
      })
      /* eslint-enable camelcase */
    }
  } catch (err) {
    error(`Failed to create deployment: ${err.message}`)
  }
}
