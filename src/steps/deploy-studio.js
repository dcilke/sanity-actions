import {getInput, info} from '../lib/core.js'
import {execLive} from '../lib/exec.js'
import {overrideStudioHost, parseStudioDeploymentOutput} from '../lib/utils.js'
import {createGithubDeployment} from './create-github-deployment.js'

export async function deployStudio(bin, cfg = {}) {
  const enabled = getInput('deploy-studio') === 'true'
  const outputPath = getInput('studio-output-path')
  const {isPR, deploymentId} = cfg

  if (!enabled) {
    info('Skipping Studio deploy')
    return {}
  }

  try {
    const args = ['deploy', '--yes', '--no-build']

    // Add build options
    if (outputPath !== '') {
      args.push(outputPath)
    }

    if (isPR && deploymentId) {
      overrideStudioHost('.', deploymentId)
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
