import path from 'path'

export function getSanityCliInstallRoot(basePath = process.cwd()) {
  return path.resolve(basePath, '.sanity-cli')
}

export function getSanityCliBinPath(basePath = process.cwd()) {
  return path.join(getSanityCliInstallRoot(basePath), 'node_modules', '.bin')
}

export function getSanityCliPackageVersion(version) {
  if (version && version.trim().length > 0) {
    return version.trim()
  }
  return 'latest'
}

export function createSanityCliManifest(version) {
  return {
    name: 'sanity-cli-cache',
    private: true,
    version: '0.0.0',
    description: 'Generated manifest for installing @sanity/cli inside GitHub Actions',
    license: 'UNLICENSED',
    dependencies: {
      '@sanity/cli': getSanityCliPackageVersion(version),
    },
  }
}
