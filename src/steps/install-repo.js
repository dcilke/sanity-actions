import {info} from '../lib/core.js'
import {execLive} from '../lib/exec.js'

export async function installRepo() {
  try {
    await execLive('npm', ['install'])

    info(`📦 Installed dependencies with ${manager}...`)
  } catch (err) {
    throw new Error(`Failed run ${manager} install`, {cause: err})
  }
}
