const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

// Remove console.logs in production
config.transformer.minifierConfig.compress.drop_console = true;

// Expo SDK 52+ auto-configures watchFolders, nodeModulesPaths, and
// module resolution for monorepos when workspaces are defined in
// the root package.json.
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
