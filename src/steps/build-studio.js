import path from 'path'
import {debug} from 'util'

import {getInput, info} from '../lib/core.js'
import {execLive} from '../lib/exec.js'
import {getDirectorySize} from '../lib/fs.js'

export async function buildStudio(bin) {
  const enabled = getInput('build') === 'true'
  const outputPath = getInput('studio-output-path')
  const doSourceMaps = getInput('studio-source-maps') === 'true'
  const noMinify = getInput('studio-no-minify') === 'true'

  if (!enabled) {
    info('Skipping Studio build')
    return {}
  }

  try {
    const args = ['build']

    // Add build options
    if (outputPath !== '') {
      args.push(outputPath)
    }
    if (doSourceMaps) {
      args.push('--source-maps')
    }
    if (noMinify) {
      args.push('--no-minify')
    }

    args.push('--yes')
    await execLive(bin, args)

    let dist = path.join('.', 'dist')
    let distSize

    try {
      if (outputPath !== '') {
        dist = outputPath
      }
      distSize = await getDirectorySize(dist)
    } catch (err) {
      debug(`Dist size failed: ${err.message}`)
    }

    info('✅ Build complete')
    return {
      dist,
      distSize,
    }
  } catch (err) {
    throw new Error(`Failed to build Studio`, {cause: err})
  }
}
