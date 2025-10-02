import {readFileSync, writeFileSync} from 'fs'

import {exec} from './exec.js'
import {findCLIConfig} from './fs.js'
import {getCurrentBranch} from './github.js'

const MAX_URL_PART_LENGTH = 63
const MIN_BRANCH_URL_PART = 8
const NON_PR_BRANCHES = new Set(['main', 'master'])

function readConfigContent(configPath) {
  try {
    return readFileSync(configPath, 'utf8')
  } catch (error) {
    throw new Error(`Failed to read Sanity config at ${configPath}: ${error.message}`)
  }
}

function extractValueFromJsLike(content, key) {
  const patterns = [
    new RegExp(`${key}\\s*:\\s*['"\`]([^'"\`]+)['"\`]`),
    new RegExp(`['"\`]${key}['"\`]\\s*:\\s*['"\`]([^'"\`]+)['"\`]`),
  ]

  for (const pattern of patterns) {
    const match = content.match(pattern)
    if (match && match[1]) {
      return match[1]
    }
  }

  return null
}

function extractStudioHostFromConfig(configPath) {
  const content = readConfigContent(configPath)

  if (configPath.endsWith('.json')) {
    try {
      const config = JSON.parse(content)
      return config.studioHost
    } catch (error) {
      throw new Error(`Invalid JSON in ${configPath}: ${error.message}`)
    }
  }

  return extractValueFromJsLike(content, 'studioHost')
}

function extractDatasetFromConfig(configPath) {
  const content = readConfigContent(configPath)

  if (configPath.endsWith('.json')) {
    try {
      const config = JSON.parse(content)
      return config.api?.dataset
    } catch (error) {
      throw new Error(`Invalid JSON in ${configPath}: ${error.message}`)
    }
  }

  return extractValueFromJsLike(content, 'dataset')
}

/**
 * Reads Sanity configuration to get studio host
 */
export function getStudioHost(path = '.') {
  const configPath = findCLIConfig(path)

  if (configPath) {
    const host = extractStudioHostFromConfig(configPath)
    if (host) {
      return host
    }
  }

  throw new Error(
    'Could not find studio host in Sanity configuration. Please ensure studioHost is defined in your Sanity cli config.',
  )
}

export function getDataset(path = '.') {
  const configPath = findCLIConfig(path)

  if (configPath) {
    const host = extractDatasetFromConfig(configPath)
    if (host) {
      return host
    }
  }

  throw new Error(
    'Could not find dataset in Sanity configuration. Please ensure dataset is defined in your Sanity cli config.',
  )
}

/**
 * Overrides the studioHost in the cli config and unsets the appId to enable branch deployments
 */
export function overrideStudioHost(path = '.', newHost) {
  const configFile = findCLIConfig(path)
  if (!configFile) {
    throw new Error('Could not locate Sanity CLI config to override studioHost')
  }

  if (!newHost) {
    throw new Error('A new studio host value is required to override studioHost')
  }

  const timestamp = Math.floor(Date.now() / 1000)
  const backupFile = `${configFile}.${timestamp}.bak`
  const originalContent = readFileSync(configFile, 'utf8')
  const fileHasTrailingNewline = originalContent.endsWith('\n')
  const extension = configFile.split('.').pop()

  // Backup original file
  writeFileSync(backupFile, originalContent, 'utf8')

  if (extension === 'json') {
    let parsed
    try {
      parsed = JSON.parse(originalContent)
    } catch (error) {
      throw new Error(`Invalid JSON in ${configFile}: ${error.message}`)
    }

    const updatedConfig = structuredClone(parsed)

    updatedConfig.studioHost = newHost

    if (
      updatedConfig.deployment &&
      Object.prototype.hasOwnProperty.call(updatedConfig.deployment, 'appId')
    ) {
      delete updatedConfig.deployment.appId
    }

    if (
      updatedConfig.project?.deployment &&
      Object.prototype.hasOwnProperty.call(updatedConfig.project.deployment, 'appId')
    ) {
      delete updatedConfig.project.deployment.appId
    }

    const serialized = JSON.stringify(updatedConfig, null, 2)
    const contentToWrite = fileHasTrailingNewline ? `${serialized}\n` : serialized
    writeFileSync(configFile, contentToWrite, 'utf8')
    return
  }

  const hostPattern = /(studioHost\s*:\s*)(['"`])([^'"`]+)(['"`])/
  const hostMatch = hostPattern.exec(originalContent)

  if (!hostMatch) {
    throw new Error('Could not find studioHost in Sanity CLI config')
  }

  const replaceHost = (match, prefix, openingQuote, currentValue, closingQuote) =>
    `${prefix}${openingQuote}${newHost}${closingQuote}`
  const hostUpdatedContent = originalContent.replace(hostPattern, replaceHost)

  const cleanedContent = removeDeploymentAppId(hostUpdatedContent)
  const contentToWrite =
    fileHasTrailingNewline && !cleanedContent.endsWith('\n')
      ? `${cleanedContent}\n`
      : cleanedContent
  writeFileSync(configFile, contentToWrite, 'utf8')
}

function removeDeploymentAppId(content) {
  let updated = content

  updated = updated.replace(
    /(^|\s)deployment\s*:\s*{\s*appId\s*:\s*(['"`])[^'"`]*\2\s*}/g,
    (match, prefix) => `${prefix}deployment: { }`,
  )

  updated = updated.replace(
    /(^|\n)[ \t]*appId\s*:\s*(['"`])[^'"`]*\2\s*,?[ \t]*\r?\n/gm,
    (match, leadingNewline) => (leadingNewline ? leadingNewline : ''),
  )

  updated = updated.replace(/({\s*)appId\s*:\s*(['"`])[^'"`]*\2\s*,\s*/g, '$1')
  updated = updated.replace(/,\s*appId\s*:\s*(['"`])[^'"`]*\1/g, '')

  return updated
}

/**
 * Generates deployment ID for PR deployments by inspecting the environment and config
 */
export function generateDeploymentId(path = '.') {
  const branch = getCurrentBranch()
  if (!branch) {
    throw new Error('Could not determine current branch')
  }

  if (NON_PR_BRANCHES.has(branch)) {
    throw new Error('PR deployments should not run on main/master branch')
  }

  const studioHost = getStudioHost(path)
  return buildDeploymentId(studioHost, branch)
}

/**
 * Sanitizes branch name for use in deployment ID
 * Ensures result is max length and stripped of invalid characters
 */
export function sanitizeBranchName(branch, maxLength) {
  if (!branch) {
    return ''
  }

  let name = branch
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (name.length > maxLength) {
    name = name.substring(0, maxLength)
  }

  return name
}

/**
 * Generate deployment ID for PR deployments from branch and studioHost
 */
export function buildDeploymentId(host, branch) {
  if (!host) {
    throw new Error('Host is required to build deployment ID')
  }
  if (!branch) {
    throw new Error('Branch name is required to build deployment ID')
  }

  const branchLength = MAX_URL_PART_LENGTH - 2 - host.length
  if (branchLength <= MIN_BRANCH_URL_PART) {
    throw new Error(`Host "${host}" is too long to create valid branch deployment ID`)
  }

  const sanitizedBranch = sanitizeBranchName(branch, branchLength)
  const deploymentId = `${host}--${sanitizedBranch}`

  if (deploymentId.length > MAX_URL_PART_LENGTH) {
    throw new Error(`Host "${host}" is too long to create valid deployment ID`)
  }

  return deploymentId
}

/**
 * Build deployment URLs for studio and GraphQL
 */
export function buildDeploymentUrls(deploymentId, projectId, dataset) {
  return {
    studio: `https://${deploymentId}.sanity.studio`,
    graphql: `https://${projectId}.api.sanity.io/v1/graphql/${dataset}/${deploymentId}`,
    graphqlPlayground: `https://${projectId}.api.sanity.io/v1/graphql/${dataset}/${deploymentId}/playground`,
  }
}

export function parseGraphQLDeploymentOutput(output) {
  const deployments = []

  // Split the output into individual deployment blocks
  // Each deployment starts with "Project:" and ends before the next "Project:" or end of string
  const deploymentBlocks = output.split(/(?=Project:)/g).filter((block) => block.trim())

  for (const block of deploymentBlocks) {
    const deployment = {}

    // Extract project
    const projectMatch = block.match(/Project:\s*(.+)/)
    if (projectMatch) {
      deployment.project = projectMatch[1].trim()
    }

    // Extract dataset
    const datasetMatch = block.match(/Dataset:\s*(.+)/)
    if (datasetMatch) {
      deployment.dataset = datasetMatch[1].trim()
    }

    // Extract tag
    const tagMatch = block.match(/Tag:\s*(.+)/)
    if (tagMatch) {
      deployment.tag = tagMatch[1].trim()
    }

    // Extract URL
    const urlMatch = block.match(/URL:\s*(.+)/)
    if (urlMatch) {
      deployment.url = urlMatch[1].trim()
    }

    // Only add if we found at least one property
    if (Object.keys(deployment).length > 0) {
      deployments.push(deployment)
    }
  }

  return deployments
}

/**
 * Parse Sanity CLI output for deployment info
 */
export function parseStudioDeploymentOutput(output) {
  const result = {}
  const urlMatch = output.match(/Success! Studio deployed to (.+)/)
  if (urlMatch) {
    result.url = urlMatch[1].trim()
  }

  return result
}

/**
 * Install global npm package
 */
export async function runSanityCli(args = [], options = {}) {
  return exec('sanity', args, options)
}

/**
 * Check URL availability
 */
export async function checkUrl(url, maxAttempts = 3) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const headResponse = await fetch(url, {method: 'HEAD'})
      if (headResponse.ok) {
        return true
      }

      if (headResponse.status === 405 || headResponse.status === 501) {
        const getResponse = await fetch(url, {method: 'GET'})
        if (getResponse.ok) {
          return true
        }
      }
    } catch {
      // Ignore network errors and retry
    }

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000))
    }
  }

  return false
}
