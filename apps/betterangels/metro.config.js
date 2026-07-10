const { getDefaultConfig } = require('expo/metro-config');

// Expo SDK 52+ auto-configures monorepos — no need for manual watchFolders or withNxMetro
// See: https://docs.expo.dev/guides/monorepos/#automatic-configuration-migrating-to-sdk-52
const config = getDefaultConfig(__dirname);

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
