import {getInput, info} from '../lib/core.js'
import {execLive} from '../lib/exec.js'
import {parseGraphQLDeploymentOutput} from '../lib/utils.js'
import {createGithubDeployment} from './create-github-deployment.js'

export async function deployGraphQL(bin, cfg = {}) {
  const enabled = getInput('graphql_deploy') === 'true'
  const overrideTag = getInput('graphql_override_tag')
  const overrideDataset = getInput('graphql_override_dataset')
  const overridePlayground = getInput('graphql_override_playground')
  const overrideGeneration = getInput('graphql_override_generation')
  const overrideWithUnionCache = getInput('graphql_override_with_union_cache')
  const overrideNonNullDocumentFields = getInput('graphql_override_non_null_document_fields')

  const {isPR, deploymentId} = cfg

  if (!enabled) {
    info('Skipping GraphQL deploy')
    return {}
  }

  try {
    const args = ['graphql', 'deploy', '--yes']

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

    if (overridePlayground === 'true') {
      args.push('--playground')
    } else if (overridePlayground === 'false') {
      args.push('--no-playground')
    }

    if (overrideGeneration) {
      args.push('--generation', overrideGeneration)
    }

    if (overrideNonNullDocumentFields) {
      args.push('--non-null-document-fields')
    }

    if (overrideWithUnionCache) {
      args.push('--with-union-cache')
    }

    const execOutput = await execLive(bin, args)
    const parsed = parseGraphQLDeploymentOutput(execOutput)
    const urls = parsed.map((p) => p.url).join(',')

    await createGithubDeployment('graphql', cfg, urls)

    info('✅ GraphQL deployed')
    return {
      urls,
    }
  } catch (err) {
    throw new Error(`Failed to deploy GraphQL`, {cause: err})
  }
}
