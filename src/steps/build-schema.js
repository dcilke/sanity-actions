import {error, getInput, info} from '../lib/core.js'
import {execLive} from '../lib/exec.js'

export async function buildSchema(bin) {
  const enabled = getInput('build') === 'true'
  const schemaPath = getInput('schema_path')
  const workspace = getInput('schema_workspace')
  const enforceRequiredFields = getInput('schema_enforce_required_fields') === 'true'
  const required = getInput('schema_required') === 'true'

  if (!enabled) {
    info('Skipping schema build')
    return
  }

  try {
    const args = ['schema', 'extract']

    // Add build options
    if (schemaPath !== '') {
      args.push('--path', schemaPath)
    }
    if (workspace !== '') {
      args.push('--workspace', workspace)
    }
    if (enforceRequiredFields) {
      args.push('--enforce-required-fields')
    }

    await execLive(bin, args)

    info('✅ Build complete')
  } catch (err) {
    if (required) {
      throw new Error(`Failed to build Studio`, {cause: err})
    }

    error(`⚠️ Schema extraction failed: ${err.message}`)
  }
}
