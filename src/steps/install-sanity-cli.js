import {mkdir, writeFile} from 'fs/promises'
import path from 'path'

import {getInput, info} from '../lib/core.js'
import {execLive} from '../lib/exec.js'

function normalizeVersion(version) {
  if (typeof version === 'string' && version.trim().length > 0) {
    return version.trim()
  }
  return 'latest'
}

function baseManifest() {
  return JSON.stringify({
    name: 'sanity-cli-cache',
    private: true,
    version: '0.0.0',
    description: 'Generated manifest for installing @sanity/cli inside GitHub Actions',
    license: 'UNLICENSED',
  })
}

export async function installSanityCLI() {
  const version = normalizeVersion(getInput('cli_version'))
  const workDir = path.resolve(process.cwd(), '.sanity-cli')

  try {
    await mkdir(workDir, {recursive: true})
    await writeFile(path.join(workDir, 'package.json'), baseManifest(), 'utf8')
    let spec = '@sanity/cli'
    if (version !== 'latest') {
      spec += `@${version}`
    }

    await execLive('npm', ['install', spec], {cwd: workDir})
    const bin = path.join(workDir, 'node_modules', '.bin', 'sanity')

    info(`📦 ${spec} installed at ${bin}`)

    return bin
  } catch (err) {
    throw new Error(`Failed to install @sanity/cli`, {cause: err})
  }
}
