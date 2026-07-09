const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Remove console.logs in production
config.transformer.minifierConfig.compress.drop_console = true;

// Expo SDK 52+ auto-detects monorepo watchFolders from workspaces,
// but crawling every app is too slow. Scope to only what we need:
// the app itself, shared libs, and root node_modules.
config.watchFolders = [
  projectRoot,
  path.join(workspaceRoot, 'libs'),
  path.join(workspaceRoot, 'node_modules'),
];

const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
};

module.exports = config;
