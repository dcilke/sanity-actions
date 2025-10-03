import {execa} from 'execa'
import fs from 'fs'
import path from 'path'

import {debug, endGroup, startGroup} from './core.js'

/**
 * Execute command with options
 */
export async function exec(command, args = [], options = {}) {
  debug(`Executing: ${command} ${args.join(' ')}`)
  const result = await execa(command, args, {
    stdio: 'pipe',
    ...options,
  })
  return result
}

/**
 * Execute command with live output AND capture stdout/stderr
 */
export async function execLive(command, args = [], options = {}) {
  const cmdArgs = `${command} ${args.join(' ')}`
  debug(`Executing (live+capture): ${cmdArgs}`)

  startGroup(cmdArgs)

  const subprocess = execa(command, args, {
    ...options,
  })

  // Stream stdout in gray color
  subprocess.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n')
    for (const line of lines) {
      if (line.trim()) {
        console.log(`\x1b[90m${line}\x1b[0m`)
      }
    }
  })

  // Stream stderr in red color
  subprocess.stderr?.on('data', (data) => {
    const lines = data.toString().split('\n')
    for (const line of lines) {
      if (line.trim()) {
        // \x1b[91m is bright red color, \x1b[0m resets
        console.error(`\x1b[91m${line}\x1b[0m`)
      }
    }
  })

  endGroup(cmdArgs)

  const result = await subprocess
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
