// Electron Builder configuration migrated from YAML with beforePack prune
// Ensures devDependencies are not included in the packaged asar

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'com.electron.app',
  productName: 'ChatMonkey',
  directories: {
    buildResources: 'build'
  },
  files: [
    '!**/.vscode/*',
    '!src/*',
    '!electron.vite.config.{js,ts,mjs,cjs}',
    '!.eslintignore',
    '!.eslintrc.cjs',
    '!.prettierignore',
    '!.prettierrc.yaml',
    '!dev-app-update.yml',
    '!CHANGELOG.md',
    '!README.md',
    '!.env',
    '!.env.*',
    '!.npmrc',
    '!pnpm-lock.yaml',
    '!tsconfig.json',
    '!tsconfig.node.json',
    '!tsconfig.web.json',
    '!**/*.map',
    '!**/*.log',
    '!**/__tests__/**',
    '!**/test/**',
    '!**/tests/**',
    '!**/drizzle/**',
    '!**/screenshot/**',
    '!**/build/icons/**',
    '!**/resources/**'
  ],
  asarUnpack: ['**/*.node'],
  win: {
    executableName: 'ChatMonkey',
    target: [{ target: 'nsis', arch: ['x64'] }],
    requestedExecutionLevel: 'asInvoker',
    signAndEditExecutable: false
  },
  nsis: {
    artifactName: '${name}_${version}_setup_${arch}.${ext}',
    shortcutName: '${productName}',
    uninstallDisplayName: '${productName}',
    createDesktopShortcut: 'always',
    oneClick: true,
    perMachine: false,
    allowToChangeInstallationDirectory: false,
    deleteAppDataOnUninstall: false
  },
  mac: {
    target: [{ target: 'dmg', arch: ['x64', 'arm64'] }],
    identity: null,
    hardenedRuntime: false,
    entitlements: null,
    entitlementsInherit: null,
    extendInfo: [
      { NSCameraUsageDescription: 'Application requests access to the device\'s camera.' },
      { NSMicrophoneUsageDescription: 'Application requests access to the device\'s microphone.' },
      { NSDocumentsFolderUsageDescription: "Application requests access to the user's Documents folder." },
      { NSDownloadsFolderUsageDescription: "Application requests access to the user's Downloads folder." }
    ],
    notarize: false
  },
  dmg: {
    artifactName: '${name}-${version}-${arch}.${ext}'
  },
  linux: {
    target: ['AppImage', 'deb'],
    maintainer: 'electronjs.org',
    category: 'Utility'
  },
  appImage: {
    artifactName: '${name}-${version}.${ext}'
  },
  npmRebuild: false,
  publish: {
    provider: 'generic',
    url: 'https://example.com/auto-updates'
  },
  asar: true,
  compression: 'maximum',
  removePackageScripts: true,
  electronLanguages: ['en-US', 'zh-CN'],
  extraResources: [
    {
      from: 'build/icons',
      to: 'resources/icons',
      filter: ['*.png']
    }
  ],
  // Prune devDependencies before packaging app contents
  beforePack: async (context) => {
    const { exec } = require('child_process')
    const util = require('util')
    const execAsync = util.promisify(exec)
    const appDir = context.appDir
    // Use npm prune --omit=dev to remove devDependencies if present
    await execAsync('npm prune --omit=dev', { cwd: appDir })
  }
}

