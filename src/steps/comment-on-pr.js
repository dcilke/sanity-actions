import {getInput, info, warning} from '../lib/core.js'
import {getOctokitClient, getPullRequestNumber, getRepoDetails} from '../lib/github.js'
import {getDataset} from '../lib/utils.js'

/* eslint-disable max-statements */
function buildDeploymentComment(cfg) {
  const didBuild = getInput('build') === 'true'
  const didStudioNoMinify = getInput('studio_no_minify') === 'true'
  const didStudioSourceMaps = getInput('studio_source_maps') === 'true'
  const didStudioDeploy = getInput('studio_deploy') === 'true'
  const schemaPath = getInput('schema_path')
  const schemaWorkspace = getInput('schema_workspace')
  const schemaEnforceRequiredFields = getInput('schema_enforce_required_fields')
  const schemaRequired = getInput('schema_required') === 'true'
  const didGraphQLDeploy = getInput('graphql_deploy') === 'true'

  const {isPR, deploymentId, studioUrl, studioDist, studioDistSize, graphqlUrls} = cfg
  const dataset = getDataset()

  const {GITHUB_HEAD_REF} = process.env

  let comment = '## 🚀 Sanity Deployment Complete!\n\n'

  if (isPR) {
    comment +=
      '![Preview Deployment](https://img.shields.io/badge/Preview-Ready-success?style=for-the-badge&logo=sanity)'
    comment += ` ![Branch](https://img.shields.io/badge/Branch-${encodeURIComponent(GITHUB_HEAD_REF)}-blue?style=for-the-badge)`
    comment += '\n\n'
  }

  if (studioUrl || graphqlUrls) {
    if (studioUrl) {
      comment += `<a href="${studioUrl}" target="_blank"><img src="https://img.shields.io/badge/Open_Studio-FF3E00?style=for-the-badge&logo=sanity&logoColor=white" alt="Open Studio" /></a> `
    }
    for (const url of graphqlUrls) {
      comment += `<a href="${url}/playground" target="_blank"><img src="https://img.shields.io/badge/GraphQL_Playground-E10098?style=for-the-badge&logo=graphql&logoColor=white" alt="GraphQL Playground" /></a>`
    }
    comment += '\n\n'
  }

  comment += `**Dataset:** \`${dataset}\`\n`

  if (isPR && deploymentId) {
    comment += `**Deployment ID:** \`${deploymentId}\`\n`
  }

  comment += '\n'

  if (didBuild) {
    comment += '### Build\n'
    comment += '#### Studio\n'
    comment += `📁 **Output:** \`${studioDist}\`\n`
    if (studioDistSize) {
      comment += `📏 **Size:** ${studioDistSize}\n`
    }
    if (didStudioSourceMaps) {
      comment += '🗺️ **Source Maps:** Included\n'
    }
    if (didStudioNoMinify) {
      comment += '📝 **Minification:** Disabled\n'
    }
    comment += '\n'
    comment += '#### Schema'
    if (schemaPath) {
      comment += `📝 **Schema Path:** \`${schemaPath}\`\n`
    }
    if (schemaWorkspace) {
      comment += `📝 **Schema Workspace:** \`${schemaWorkspace}\`\n`
    }
    if (schemaEnforceRequiredFields) {
      comment += `📝 **Schema Enforce Required Fields:** \`${schemaEnforceRequiredFields}\`\n`
    }
    if (schemaRequired) {
      comment += `📝 **Schema Build Required:** \`${schemaRequired}\`\n`
    }

    comment += '\n'
  }

  if (didStudioDeploy) {
    comment += '### Studio\n'
    comment += `🔗 **URL:** ${studioUrl}\n`
  }

  if (didGraphQLDeploy) {
    comment += '### GraphQL API\n'
    for (const url of graphqlUrls) {
      comment += `🔗 **Endpoint:** ${url}\n`
    }
    comment += '\n'
  }

  comment += '---\n'

  if (isPR) {
    comment += '<details>\n<summary>ℹ️ <strong>About PR Preview Deployments</strong></summary>\n\n'
    comment +=
      'This is an isolated preview deployment for your pull request. It will not affect your production deployment.\n\n'
    comment += '- **Auto-cleanup**: Runs when PR is closed\n'
    comment += '\n</details>\n\n'
  }

  comment += `<sub>🤖 Deployed by Sanity GitHub Actions at ${new Date().toLocaleString('en-US', {
    timeZone: 'UTC',
    dateStyle: 'short',
    timeStyle: 'medium',
  })} UTC</sub>`

  return comment
}
/* eslint-enable max-statements */

export async function commentOnPR(cfg) {
  try {
    const {isPR} = cfg
    const commentBody = buildDeploymentComment(cfg)

    if (isPR) {
      info(commentBody)
      return
    }

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

    const match = existingComments.find(
      (comment) =>
        comment.user?.login === 'github-actions[bot]' &&
        comment.body?.includes('Sanity Deployment Complete'),
    )

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
