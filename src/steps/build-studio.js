import {getInput, info, warning} from '../lib/core.js'
import {execLive} from '../lib/exec.js'
import {getDirectorySize} from '../lib/fs.js'

export async function buildStudio(bin) {
  const enabled = getInput('build') === 'true'
  const distPath = getInput('dist_path')
  const doSourceMaps = getInput('studio_source_maps') === 'true'
  const noMinify = getInput('studio_no_minify') === 'true'

  if (!enabled) {
    info('Skipping Studio build')
    return {}
  }

  try {
    const args = ['build']

    // Add build options
    if (distPath !== '') {
      args.push(distPath)
    }
    if (doSourceMaps) {
      args.push('--source-maps')
    }
    if (noMinify) {
      args.push('--no-minify')
    }

    args.push('--yes')
    await execLive(bin, args)

    const dist = distPath === '' ? './dist' : distPath
    let distSize

    try {
      distSize = await getDirectorySize(dist)
    } catch (err) {
      warning(`Dist size failed: ${err.message}`)
    }

    info('✅ Studio build complete')
    return {
      dist,
      distSize,
    }
  } catch (err) {
    throw new Error(`Failed to build Studio`, {cause: err})
  }
}
