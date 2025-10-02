import {getPackageManager, info} from '../lib/core.js'
import {execLive} from '../lib/exec.js'

export async function installRepo() {
  const manager = getPackageManager()
  try {
    await execLive(manager, ['install'])

    info(`📦 Installed dependencies with ${manager}...`)
  } catch (err) {
    throw new Error(`Failed run ${manager} install`, {cause: err})
  }
}
