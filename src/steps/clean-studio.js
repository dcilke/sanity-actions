import {getInput, info} from '../lib/core.js'
import {execLive} from '../lib/exec.js'
import {overrideStudioHost, parseStudioDeploymentOutput} from '../lib/utils.js'

export async function cleanStudio(bin, cfg = {}) {
  const enabled = getInput('studio_cleanup') === 'true'
  const {isPR, deploymentId} = cfg

  if (!enabled) {
    info('Skipping Studio cleanup')
    return {}
  }

  try {
    if (isPR && deploymentId) {
      overrideStudioHost('.', deploymentId)
    }

    const execOutput = await execLive(bin, ['undeploy', '--yes'])
    const {url} = parseStudioDeploymentOutput(execOutput)

    info('✅ Studio deployed')
    return {url}
  } catch (err) {
    throw new Error(`Failed Studio cleanup`, {cause: err})
  }
}
