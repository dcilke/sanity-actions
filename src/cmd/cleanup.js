#!/usr/bin/env node

import {setFailed} from '../lib/core.js'
import {cleanGraphQL} from '../steps/clean-graphql.js'
import {cleanStudio} from '../steps/clean-studio.js'
import {getWorkflowConfig} from '../steps/get-workflow-config.js'
import {installSanityCLI} from '../steps/install-sanity-cli.js'
import {setEnvVars} from '../steps/set-env-vars.js'
import {setPRStatus} from '../steps/set-pr-status.js'

export async function cleanup() {
  // Setup
  await setPRStatus('pending', 'Sanity cleanup in progress...')
  setEnvVars() // including auth token
  const bin = await installSanityCLI()

  const config = getWorkflowConfig()
  await cleanStudio(bin, config)
  await cleanGraphQL(bin, config)

  await setPRStatus('success', 'Sanity cleanup successful!')
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  cleanup().catch((err) => {
    throw setFailed('Sanity cleanup failed.', err)
  })
}
