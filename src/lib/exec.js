import {execa} from 'execa'
import fs from 'fs'
import path from 'path'

import * as core from './core.js'

/**
 * Execute command with options
 */
export async function exec(command, args = [], options = {}) {
  try {
    core.debug(`Executing: ${command} ${args.join(' ')}`)
    const result = await execa(command, args, {
      stdio: 'pipe',
      ...options,
    })
    return result
  } catch (error) {
    core.error(`Command failed: ${command} ${args.join(' ')}`)
    core.error(error.message)
    if (error.stderr) {
      core.error(`stderr: ${error.stderr}`)
    }
    throw error
  }
}

/**
 * Execute command with live output AND capture stdout/stderr
 */
export async function execLive(command, args = [], options = {}) {
  core.debug(`Executing (live+capture): ${command} ${args.join(' ')}`)
  const result = await execa(command, args, {
    all: true, // Combine stdout and stderr into 'all' property
    ...options,
  })

  return result
}

/**
 * Check if command exists
 */
export async function commandExists(command) {
  const searchPaths = (process.env.PATH || '').split(path.delimiter)
  const extensions =
    process.platform === 'win32'
      ? (process.env.PATHEXT || '.COM;.EXE;.BAT;.CMD')
          .split(';')
          .map((ext) => (ext.startsWith('.') ? ext : `.${ext}`))
      : ['']

  for (const searchPath of searchPaths) {
    if (!searchPath) continue

    for (const extension of extensions) {
      const candidate = path.join(
        searchPath,
        process.platform === 'win32' ? `${command}${extension}` : command,
      )

      try {
        fs.accessSync(candidate, fs.constants.F_OK)
        return true
      } catch {
        // Continue searching
      }
    }
  }

  return false
}
