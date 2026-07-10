const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Expo SDK 52+ auto-configures monorepos, but tsconfig extends that cross
// project boundaries need explicit watchFolders for EAS build environments.
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(__dirname, {
  watchFolders: [workspaceRoot],
});

// Remove console.logs in production
config.transformer.minifierConfig.compress.drop_console = true;

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
