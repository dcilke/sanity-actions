import {error, getInput, info} from '../lib/core.js'
import {execLive} from '../lib/exec.js'

export async function buildSchema(bin) {
  const enabled = getInput('build') === 'true'
  const distPath = getInput('dist_path')
  const required = getInput('schema_required') === 'true'

  if (!enabled) {
    info('Skipping schema build')
    return
  }

  try {
    const args = ['manifest', 'extract']

    // Add build options
    if (distPath !== '') {
      args.push('--path', distPath)
    }

    await execLive(bin, args)

    info('✅ Schema build complete')
  } catch (err) {
    if (required) {
      throw new Error(`Failed to build Studio`, {cause: err})
    }

    error(`⚠️ Schema extraction failed: ${err.message}`)
  }
}
