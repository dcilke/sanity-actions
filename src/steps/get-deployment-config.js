import {isPullRequest} from '../lib/github.js'
import {generateDeploymentId} from '../lib/utils.js'

export function getDeploymentConfig() {
  if (isPullRequest()) {
    return {
      isPR: true,
      deploymentId: generateDeploymentId(),
    }
  }

  return {
    isPR: false,
    deploymentId: undefined,
  }
}
