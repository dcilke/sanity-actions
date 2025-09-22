# Sanity GitHub Actions

Official GitHub Actions for building and deploying Sanity.io projects, applications, and studios.

## Available Actions

### build-and-deploy
Builds and deploys your Sanity Studio and/or GraphQL API to Sanity's hosted services.

#### Basic Examples

```yaml
# Build and deploy Studio (default behavior)
- uses: dcilke/sanity-actions/build-and-deploy@v1
  with:
    token: ${{ secrets.SANITY_DEPLOY_TOKEN }}

# Build and deploy both Studio and GraphQL API
- uses: dcilke/sanity-actions/build-and-deploy@v1
  with:
    token: ${{ secrets.SANITY_DEPLOY_TOKEN }}
    deploy-graphql: true

# Deploy without building (using pre-built files)
- uses: dcilke/sanity-actions/build-and-deploy@v1
  with:
    token: ${{ secrets.SANITY_DEPLOY_TOKEN }}
    build: false  # Skip build step

# Just build the Studio (no deployment)
- uses: dcilke/sanity-actions/build-and-deploy@v1
  with:
    deploy-studio: false
    deploy-graphql: false
```

#### Advanced Configuration

```yaml
# Full configuration example
- uses: dcilke/sanity-actions/build-and-deploy@v1
  with:
    # Required inputs
    token: ${{ secrets.SANITY_DEPLOY_TOKEN }}

    # Project configuration
    project-path: './studio'  # Path to Sanity project (default: '.')
    cli-version: '3.0.0'      # Specific Sanity CLI version

    # Build configuration
    build: true               # Build project before deploying (default: true)
    output-path: './dist'     # Build output directory (default: 'dist')
    source-maps: true         # Include source maps (default: false)
    no-minify: true          # Skip minification (default: false)
    schema-path: './schema.json'  # Custom schema file path
    schema-required: true     # Fail if schema is unserializable (default: true)

    # Deployment configuration
    deploy-studio: true       # Deploy Studio (default: true)
    deploy-graphql: true      # Deploy GraphQL API (default: false)
    wait-for-deployment: true # Wait for deployment to be ready (default: true)
    deployment-timeout: 60    # Timeout in seconds (default: 30)

    # GraphQL-specific configuration
    graphql-override-tag: 'v1'
    graphql-override-dataset: 'staging'
    graphql-override-playground: true
    graphql-override-generation: 'gen3'
    graphql-override-non-null-document-fields: true
    graphql-override-with-union-cache: true  # Experimental

    # CI/CD features
    cache-dependencies: true  # Cache npm/yarn/pnpm dependencies (default: true)
    upload-artifacts: true    # Upload build artifacts (default: false)
    artifact-name: 'studio-build'  # Artifact name (default: 'sanity-build')
    comment-on-pr: true      # Comment on PR with deployment info (default: true)
```

#### Outputs

The action provides the following outputs that can be used in subsequent steps:

```yaml
- uses: dcilke/sanity-actions/build-and-deploy@v1
  id: deploy
  with:
    token: ${{ secrets.SANITY_DEPLOY_TOKEN }}

- name: Use deployment outputs
  run: |
    echo "Studio URL: ${{ steps.deploy.outputs.studio-url }}"
    echo "Build path: ${{ steps.deploy.outputs.build-path }}"
    echo "Build size: ${{ steps.deploy.outputs.build-size }}"
    echo "Deployment ID: ${{ steps.deploy.outputs.deployment-id }}"
    echo "GraphQL URL: ${{ steps.deploy.outputs.graphql-url }}"
    echo "GraphQL Playground: ${{ steps.deploy.outputs.graphql-playground-url }}"
```


## Examples

See the [examples](./examples) directory for complete workflow examples.

## Requirements

- GitHub Actions runner (ubuntu-latest, macos-latest, or windows-latest)
- Node.js 18+ (automatically set up by actions)
- Sanity project with appropriate tokens

## Security

- Always use GitHub Secrets for sensitive values
- Use least-privilege tokens
- Consider using environment-specific tokens

## License

MIT
