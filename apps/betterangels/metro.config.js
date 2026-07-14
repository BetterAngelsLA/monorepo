const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;

// Expo SDK 52+ auto-configures Metro for monorepos (watchFolders, nodeModulesPaths, etc.)
// No need for withNxMetro or manual monorepo configuration.
const config = getDefaultConfig(projectRoot);

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
