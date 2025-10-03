import {getInput, info} from '../lib/core.js'
import {execLive} from '../lib/exec.js'

export async function cleanGraphQL(bin, cfg = {}) {
  const enabled = getInput('graphql_cleanup') === 'true'
  const overrideTag = getInput('graphql_override_tag')
  const overrideDataset = getInput('graphql_override_dataset')

  const {isPR, deploymentId} = cfg

  if (!enabled) {
    info('Skipping GraphQL cleanup')
    return
  }

  try {
    const args = ['graphql', 'undeploy', '--force']

    // Add PR deployment tag or override tag
    let tag
    if (overrideTag) {
      tag = overrideTag
    } else if (isPR && deploymentId) {
      tag = deploymentId
    }

    if (tag) {
      args.push('--tag', tag)
    }

    // Add optional parameters
    if (overrideDataset) {
      args.push('--dataset', overrideDataset)
    }

    await execLive(bin, args)

    info('✅ GraphQL undeployed')
  } catch (err) {
    throw new Error(`Failed GraphQL cleanup`, {cause: err})
  }
}
