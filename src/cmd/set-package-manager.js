#!/usr/bin/env node

import {existsSync} from 'fs'
import path from 'path'

import {info, setFailed, setOutput, setPackageManager} from '../lib/core.js'

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
        break // Use the first match (highest priority)
      }
    }

    info(`📦 Using ${manager}`)
    setOutput('manager', manager)
    setPackageManager(manager)
  } catch (err) {
    throw setFailed('Failed to detect package manager', err)
  }
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  whichPackageManager()
}
