import {getInput, info} from '../lib/core.js'
import {execLive} from '../lib/exec.js'
import {overrideStudioHost, parseStudioDeploymentOutput} from '../lib/utils.js'
import {createGithubDeployment} from './create-github-deployment.js'

export async function deployStudio(bin, cfg = {}) {
  const enabled = getInput('studio_deploy') === 'true'
  const outputPath = getInput('studio_output_path')
  const schemaRequired = getInput('schema_required') === 'true'
  const buildEnabled = getInput('build') === 'true'
  const {isPR, deploymentId} = cfg

  info(`studio_deploy input value: "${getInput('studio_deploy')}" (enabled: ${enabled})`)

  if (!enabled) {
    info('Skipping Studio deploy')
    return {}
  }

  try {
    const args = ['deploy', '--yes']

    // Add build options
    if (outputPath !== '') {
      args.push(outputPath)
    }

    if (schemaRequired) {
      args.push('--schema-required')
    }

    if (!buildEnabled) {
      args.push('--no-build')
    }

    if (isPR && deploymentId) {
      overrideStudioHost(process.cwd(), deploymentId)
    }

    const execOutput = await execLive(bin, args)
    const {url} = parseStudioDeploymentOutput(execOutput)

    await createGithubDeployment('studio', cfg, url)

    info('✅ Studio deployed')
    return {url}
  } catch (err) {
    throw new Error(`Failed to deploy Studio`, {cause: err})
  }
}
