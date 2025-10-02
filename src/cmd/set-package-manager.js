#!/usr/bin/env node

import {existsSync} from 'fs'
import {homedir} from 'os'
import path from 'path'

import {debug, info, setFailed, setOutput, setPackageManager} from '../lib/core.js'
import {execOutput} from '../lib/exec.js'

const LOCKFILE_PRIORITY = [
  {filename: 'pnpm-lock.yaml', manager: 'pnpm'},
  {filename: 'yarn.lock', manager: 'yarn'},
  {filename: 'package-lock.json', manager: 'npm'},
]

async function whichPackageManager(options = {}) {
  try {
    const filePath = options.path || process.cwd()

    let manager = 'npm'
    for (const entry of LOCKFILE_PRIORITY) {
      const fullPath = path.join(filePath, entry.filename)
      if (existsSync(fullPath)) {
        manager = entry.manager
      }
    }

    let cacheDir
    switch (manager) {
      case 'pnpm':
        cacheDir = await execOutput('pnpm', ['store', 'path'])
        break
      case 'yarn':
        cacheDir = await execOutput('yarn', ['cache', 'dir'])
        break
      case 'npm':
        cacheDir = path.join(homedir(), '.npm')
        break
      default:
      // do nothing
    }

    info(`📦 Using ${manager}`)
    debug(`📁 Cache directory: ${cacheDir}`)
    setOutput('manager', manager)
    setOutput('cache-dir', cacheDir)
    setPackageManager(manager)
  } catch (err) {
    throw setFailed('Failed to detect package manager', err)
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  whichPackageManager()
}
