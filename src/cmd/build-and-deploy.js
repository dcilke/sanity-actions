#!/usr/bin/env node

import {setFailed, setOutput} from '../lib/core.js'
import {buildSchema} from '../steps/build-schema.js'
import {buildStudio} from '../steps/build-studio.js'
import {commentOnPR} from '../steps/comment-on-pr.js'
import {deployGraphQL} from '../steps/deploy-graphql.js'
import {deployStudio} from '../steps/deploy-studio.js'
import {getDeploymentConfig} from '../steps/get-deployment-config.js'
import {installRepo} from '../steps/install-repo.js'
import {installSanityCLI} from '../steps/install-sanity-cli.js'
import {setEnvVars} from '../steps/set-env-vars.js'
import {setPRStatus} from '../steps/set-pr-status.js'

export async function buildAndDeploy() {
  // Setup
  await setPRStatus('pending', 'Sanity build and deploy in progress...')
  setEnvVars() // including auth token
  await installRepo()
  const bin = await installSanityCLI()

  // Build
  const studioBuild = await buildStudio(bin)
  await buildSchema(bin)

  // Deploy
  const config = getDeploymentConfig()
  const studioDeploy = await deployStudio(bin, config)
  const graphqlDeploy = await deployGraphQL(bin, config)

  // Finalize
  await commentOnPR({
    isPR: config.isPR,
    deploymentId: config.deploymentId,
    studioUrl: studioDeploy.url,
    studioDist: studioBuild.dist,
    studioDistSize: studioBuild.studioDistSize,
    graphqlUrls: graphqlDeploy.urls,
  })
  await setPRStatus('success', 'Sanity build and deploy successful!')

  setOutput('build-path', studioBuild.dist)
  setOutput('studio-url', studioDeploy.url)
  setOutput('graphql-urls', graphqlDeploy.urls)
  setOutput('deployment-id', config.deploymentId)
  setOutput('is-pr', config.isPR)
}

// CLI entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  buildAndDeploy().catch((err) => {
    throw setFailed('Sanity build and deploy failed.', err)
  })
}
