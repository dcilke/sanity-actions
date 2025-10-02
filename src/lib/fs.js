import {existsSync, readdirSync, readFileSync, writeFileSync} from 'fs'
import {readdir, stat} from 'fs/promises'
import {glob} from 'glob'
import path from 'path'

/**
 * Check if file exists
 */
export function fileExists(filePath) {
  try {
    return existsSync(filePath)
  } catch (err) {
    console.log(err)
    return false
  }
}

/**
 * Read file content
 */
export function readFile(filePath) {
  return readFileSync(filePath, 'utf8')
}

/**
 * Write file content
 */
export function writeFile(filePath, content) {
  writeFileSync(filePath, content, 'utf8')
}

/**
 * Find files matching pattern
 */
export async function findFiles(pattern, options = {}) {
  return glob(pattern, options)
}

/**
 * Get directory files
 */
export function getDirectoryFiles(dirPath) {
  if (!existsSync(dirPath)) {
    return []
  }
  return readdirSync(dirPath)
}

export async function getDirectorySize(buildPath) {
  try {
    const bytes = await calculateDirectorySize(buildPath)
    return formatBytes(bytes)
  } catch {
    return 'unknown'
  }
}

async function calculateDirectorySize(dirPath) {
  let total = 0
  const entries = await readdir(dirPath, {withFileTypes: true})

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)

    if (entry.isDirectory()) {
      total += await calculateDirectorySize(fullPath)
    } else if (entry.isFile()) {
      const stats = await stat(fullPath)
      total += stats.size
    }
  }

  return total
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, index)
  return `${value.toFixed(value >= 10 || value === Math.floor(value) ? 0 : 1)} ${units[index]}`
}

/**
 * Find Sanity cli config file
 */
const TARGET_CLI_CONFIGS = ['sanity.cli.ts', 'sanity.cli.js', 'sanity.cli.mjs', 'sanity.json']

export function findCLIConfig(filePath) {
  for (const file of TARGET_CLI_CONFIGS) {
    const target = path.join(filePath, file)
    if (fileExists(target)) {
      return target
    }
  }

  return null
}
