import * as core from '@actions/core'

export function setEnv(name, options) {
  return core.exportVariable(name, options)
}

export function getEnv(name) {
  return process.env[name] || ''
}

export function setOutput(name, options) {
  return core.setOutput(name, options)
}

export function getInput(name, options) {
  return core.getInput(name, options)
}

export function setPackageManager(manager) {
  return setEnv('SANITY_BAD_PACKAGE_MANAGER', manager)
}

export function getPackageManager() {
  return getEnv('SANITY_BAD_PACKAGE_MANAGER') || 'npm'
}

export function setFailed(message, err) {
  core.setFailed(`❌ ${message}: ${err.message}`)
  return new Error(message, {cause: err})
}

//
// Log wrappers
//
export function startGroup(name) {
  core.startGroup(name)
}

export function endGroup(name) {
  core.endGroup(name)
}

export function info(message) {
  core.info(message)
}

export function error(message) {
  core.error(message)
}

export function warning(message) {
  core.warning(message)
}

export function debug(message) {
  core.debug(message)
}
