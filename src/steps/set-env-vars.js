import {debug, getInput, info, setEnv} from '../lib/core.js'

export function setEnvVars() {
  try {
    const raw = getInput('environment_variables')
    const variables = raw.split('\n').filter((line) => line.trim())

    for (const v of variables) {
      const [key, value] = v.split('=', 1)
      if (key && value) {
        debug(`${key} set`)
        setEnv(key, value)
      }
    }

    const token = getInput('token')
    setEnv('SANITY_AUTH_TOKEN', token)

    const githubToken = getInput('github_token')
    if (githubToken) {
      setEnv('GITHUB_TOKEN', githubToken)
    }

    info('✅ Environment variables set')
  } catch (err) {
    throw new Error(`Failed to set environment variables`, {cause: err})
  }
}
