import {getInput, info, warning} from '../lib/core.js'
import {getOctokitClient, getPullRequestNumber, getRepoDetails} from '../lib/github.js'

function buildDeploymentComment(cfg) {
  const didBuild = getInput('build') === 'true'
  const didStudioNoMinify = getInput('studio_no_minify') === 'true'
  const didStudioSourceMaps = getInput('studio_source_maps') === 'true'
  const didStudioDeploy = getInput('studio_deploy') === 'true'
  const schemaPath = getInput('schema_path')
  const schemaWorkspace = getInput('schema_workspace')
  const schemaEnforceRequiredFields = getInput('schema_enforce_required_fields') === 'true'
  const schemaRequired = getInput('schema_required') === 'true'
  const didGraphQLDeploy = getInput('graphql_deploy') === 'true'

  const {deploymentId, studioUrl, studioDist, studioDistSize, graphqlUrls} = cfg

  let comment = '### Sanity Build and Deploy\n\n'

  if (didStudioDeploy) {
    comment += `**Studio URL:** ${studioUrl}\n`
  }

  if (didGraphQLDeploy) {
    for (const url of graphqlUrls) {
      comment += `**GraphQL URL:** ${url}\n`
    }
  }

  comment += '\n\n'

  comment += '**Details:**\n'
  if (didBuild) {
    comment += `**Studio output directory:** \`${studioDist}\`\n`
    if (studioDistSize) {
      comment += `**Studio output size:** ${studioDistSize}\n`
    }
    if (didStudioSourceMaps) {
      comment += '**Studio source maps:** Included\n'
    }
    if (didStudioNoMinify) {
      comment += '**Studio minification:** Disabled\n'
    }
    if (schemaPath) {
      comment += `**Schema path:** \`${schemaPath}\`\n`
    }
    if (schemaWorkspace) {
      comment += `**Schema workspace:** \`${schemaWorkspace}\`\n`
    }
    if (schemaEnforceRequiredFields) {
      comment += `**Schema enforce required fields:** \`${schemaEnforceRequiredFields}\`\n`
    }
    if (!schemaRequired) {
      comment += `**Schema build requried:** Disabled\n`
    }
  }

  comment += `**Deployment ID:** \`${deploymentId}\`\n`

  comment += '\n\n---\n\n'

  comment += `<sub>🤖 Deployed by Sanity GitHub Actions at ${new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
    dateStyle: 'short',
    timeStyle: 'medium',
  })} UTC</sub>`

  return comment
}

export async function commentOnPR(cfg) {
  try {
    const {isPR} = cfg
    if (!isPR) {
      return
    }

    const commentBody = buildDeploymentComment(cfg)
    const {owner, repo} = getRepoDetails()
    const prNumber = getPullRequestNumber()
    const octokit = getOctokitClient()

    /* eslint-disable camelcase */
    const existingComments = await octokit.paginate(octokit.rest.issues.listComments, {
      owner,
      repo,
      issue_number: prNumber,
      per_page: 100,
    })
    /* eslint-enable camelcase */

    info(`Found ${existingComments.length} existing comments`)

    const match = existingComments.find(
      (comment) => {
        const isBot = comment.user?.login === 'github-actions[bot]'
        const hasText = comment.body?.includes('Sanity Build and Deploy')
        info(`Comment by ${comment.user?.login}: isBot=${isBot}, hasText=${hasText}`)
        return isBot && hasText
      }
    )

    info(`Match found: ${!!match}`)

    if (match) {
      /* eslint-disable camelcase */
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: match.id,
        body: commentBody,
      })
      /* eslint-enable camelcase */
      info('✅ Updated existing PR comment')
    } else {
      /* eslint-disable camelcase */
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: commentBody,
      })
      /* eslint-enable camelcase */
      info('✅ Created new PR comment')
    }
  } catch (error) {
    warning(`⚠️ Failed to create PR comment: ${error.message}`)
  }
}
