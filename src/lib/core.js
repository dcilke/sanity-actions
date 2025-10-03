import * as core from '@actions/core'

/**
 * Set environment variable
 */
export function setEnv(name, options) {
  return core.exportVariable(name, options)
}

export function getEnv(name) {
  return process.env[name] || ''
}

/**
 * Set input value
 */
export function setOutput(name, options) {
  return core.setOutput(name, options)
}

/**
 * Get input value
 */
export function getInput(name, options) {
  return core.getInput(name, options)
}

export function setPackageManager(manager) {
  return setEnv('SANITY_BAD_PACKAGE_MANAGER', manager)
}

export function getPackageManager() {
  return getEnv('SANITY_BAD_PACKAGE_MANAGER') || 'npm'
}

/**
 * Log info message
 */
export function info(message) {
  core.info(message)
}

/**
 * Log error message
 */
export function error(message) {
  core.error(message)
}

/**
 * Log warning message
 */
export function warning(message) {
  core.warning(message)
}

/**
 * Log debug message
 */
export function debug(message) {
  core.debug(message)
}

/**
 * Exit with error
 */
export function setFailed(message, err) {
  core.setFailed(`❌ ${message}: ${err.message}`)
  return new Error(message, {cause: err})
}
