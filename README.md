# Sanity GitHub Actions

GitHub Actions for building and deploying Sanity Studio and GraphQL API, with separate actions for deployment and cleanup.

## Features
- Deploy Sanity Studio and GraphQL from a single job
- Optional build step with source map and minification controls
- Pull request previews with branch-based deployment IDs
- PR comments and GitHub deployment records
- Dependency caching and build artifact uploads
- Per-run GraphQL overrides for dataset, tag, generation, and flags
- Dedicated cleanup action for GraphQL previews when PRs close

## Actions

This repository provides two actions:

- **`dcilke/sanity-actions/build-and-deploy`** – Build and deploy Sanity Studio and GraphQL API
- **`dcilke/sanity-actions/cleanup`** – Clean up GraphQL preview deployments when PRs close

## Quick Start

```yaml
name: Deploy Sanity

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Build and deploy Sanity
        uses: dcilke/sanity-actions/build-and-deploy@v1
        with:
          token: ${{ secrets.SANITY_DEPLOY_TOKEN }}
          deploy-graphql: true
```

## Configuration

### Required input
| Input | Description |
|-------|-------------|
| `token` | Sanity auth token with rights to build/deploy the target studio. |

### Project settings
| Input | Default | Description |
|-------|---------|-------------|
| `path` | `.` | Location of the Sanity studio inside the repository. |
| `cli-version` | `""` | Sanity CLI version to install (defaults to latest). |

### Build configuration
| Input | Default | Description |
|-------|---------|-------------|
| `build` | `"true"` | Run `sanity build` before deploying. |
| `studio-output-path` | `""` | Directory name for build output (defaults to Sanity's `dist`). |
| `studio-source-maps` | `"false"` | Include source maps when building. |
| `studio-no-minify` | `"false"` | Skip frontend minification. |

### Schema extraction
| Input | Default | Description |
|-------|---------|-------------|
| `schema-path` | `""` | Destination path for exported schema. |
| `schema-workspace` | `""` | Workspace to generate (leave blank for all). |
| `schema-enforce-required-fields` | `"false"` | Treat required schema fields as non-optional. |
| `schema-required` | `"true"` | Fail the run when schema extraction errors. |

### Deployment controls
| Input | Default | Description |
|-------|---------|-------------|
| `deploy-studio` | `"true"` | Run `sanity deploy`. |
| `deploy-graphql` | `"false"` | Run `sanity graphql deploy`. |
| `wait-for-deployment` | `"true"` | Poll the Studio URL until it responds. |
| `deployment-timeout` | `"30"` | Seconds to wait for Studio availability. |

### GraphQL overrides
| Input | Default | Description |
|-------|---------|-------------|
| `graphql-override-tag` | `""` | Explicit GraphQL tag (PR runs default to branch-based tag). |
| `graphql-override-dataset` | `""` | Dataset to deploy instead of the default. |
| `graphql-override-playground` | `""` | Force-enable (`true`) or disable (`false`) the GraphQL playground. |
| `graphql-override-generation` | `""` | GraphQL generation to target. |
| `graphql-override-non-null-document-fields` | `""` | Set to `true` to enable the flag. |
| `graphql-override-with-union-cache` | `""` | Set to `true` to enable the experimental union cache. |

### CI/CD helpers
| Input | Default | Description |
|-------|---------|-------------|
| `cache-dependencies` | `"true"` | Cache dependencies using the detected package manager. |
| `cache-sanity-cli` | `"false"` | Emit cache metadata so you can persist the `.sanity-cli` installation between jobs. |
| `upload-artifacts` | `"false"` | Upload the build output with `actions/upload-artifact`. |
| `artifact-name` | `"sanity-build"` | Artifact name when uploads are enabled. |
| `comment-on-pr` | `"true"` | Post (or update) a PR comment after deployment. |
| `create-github-deployment` | `"true"` | Create GitHub Deployment records for Studio/GraphQL URLs. |

### Advanced
| Input | Default | Description |
|-------|---------|-------------|
| `github-token` | `${{ github.token }}` | Token used for PR comments, statuses, and deployments. |
| `environment-variables` | `""` | Newline separated `KEY=value` pairs exported before the build. |

### Usage example

```yaml
- uses: dcilke/sanity-actions/build-and-deploy@v1
  with:
    token: ${{ secrets.SANITY_DEPLOY_TOKEN }}
    path: ./studio
    build: true
    studio-output-path: dist
    studio-source-maps: true
    studio-no-minify: false
    schema-path: ./schema.json
    schema-required: true
    deploy-graphql: true
    graphql-override-playground: true
    cache-dependencies: true
    upload-artifacts: true
    artifact-name: studio-build
    comment-on-pr: true
```

Boolean inputs expect the strings `"true"` or `"false"` to align with GitHub's composite action argument handling.

## Caching the Sanity CLI
Set `cache-sanity-cli: true` to reuse the `.sanity-cli` directory between runs. The action restores the cache before reinstalling the CLI so repeat jobs skip downloads that your package manager already has in its store.

```yaml
- uses: dcilke/sanity-actions/build-and-deploy@v1
  with:
    token: ${{ secrets.SANITY_DEPLOY_TOKEN }}
    cache-sanity-cli: true
```

If you pin `cli-version`, update the value (or purge the cache) whenever you bump to a new major to avoid stale binaries.

## Outputs
- `build-path` – Build directory reported by `sanity build`.
- `build-size` – Calculated size of the build output (if available).
- `studio-url` – URL returned by `sanity deploy`.
- `studio-deployment-id` – Deployment identifier returned by the CLI.
- `graphql-urls` – Comma-separated GraphQL endpoints reported by `sanity graphql deploy`.
- `deployment-id` – PR preview deployment ID (PR runs only).
- `is-pr-deployment` – `true` when the run is executing in a PR context.

## Pull Request Previews
When the action runs on `pull_request` events it:
1. Detects the PR context and derives a deployment ID from `studioHost` and the source branch.
2. Builds the studio (when `build: "true"`).
3. Overrides `studioHost` during deploy so the preview is isolated from production.
4. Deploys GraphQL with the same tag when `deploy-graphql: "true"`.
5. Optionally posts a PR comment and creates GitHub Deployment records.

### Requirements
- Define `studioHost` in your Sanity configuration (`sanity.cli.[jt]s`, `sanity.config.[jt]s`, or legacy `sanity.json`).
- Provide `SANITY_DEPLOY_TOKEN` with deploy rights to the project.
- Grant the workflow permissions for `deployments`, `pull-requests`, and `statuses` when you need those features.

### Example PR workflow
```yaml
name: Sanity PR Preview

on:
  pull_request:
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  preview:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      deployments: write
      pull-requests: write
      statuses: write

    steps:
      - uses: actions/checkout@v4

      - name: Deploy preview
        uses: dcilke/sanity-actions/build-and-deploy@v1
        with:
          token: ${{ secrets.SANITY_DEPLOY_TOKEN }}
          deploy-graphql: true
          comment-on-pr: true
```

Pair this job with the cleanup action on `pull_request` `closed` events to automatically remove the matching GraphQL preview tag. Studio deploys expire on their own, so no additional teardown is required.

## Cleanup Action

Trigger the companion cleanup action when a pull request closes:

```yaml
name: Sanity Preview Cleanup

on:
  pull_request:
    types: [closed]

jobs:
  cleanup:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write

    steps:
      - uses: actions/checkout@v4

      - name: Remove preview resources
        uses: dcilke/sanity-actions/cleanup@v1
        with:
          token: ${{ secrets.SANITY_DEPLOY_TOKEN }}
          comment-on-pr: true
```

## Requirements
- GitHub-hosted runner (`ubuntu-latest`, `macos-latest`, or `windows-latest`).
- Node.js 18+ (installed automatically via `actions/setup-node@v4`).
- Sanity project and token with the necessary permissions.

## Security Notes
- Store tokens such as `SANITY_DEPLOY_TOKEN` in GitHub Secrets.
- Use environment-specific tokens for production vs preview flows.
- Avoid logging deployment IDs, dataset names, or tokens in workflow output.

## License
MIT
