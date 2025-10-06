import {getInput, info} from '../lib/core.js'
import {execLive} from '../lib/exec.js'
import {overrideStudioHost} from '../lib/utils.js'

export async function cleanStudio(bin, cfg = {}) {
  const enabled = getInput('studio_cleanup') === 'true'
  const {isPR, deploymentId} = cfg

  if (!enabled) {
    info('Skipping Studio cleanup')
    return
  }

  try {
    if (isPR && deploymentId) {
      overrideStudioHost('.', deploymentId)
    }

    await execLive(bin, ['undeploy', '--yes'])

    info('✅ Studio cleanup')
  } catch (err) {
    throw new Error(`Failed Studio cleanup`, {cause: err})
  }
}
