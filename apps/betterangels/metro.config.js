const { getDefaultConfig } = require('expo/metro-config');
const { withNxMetro } = require('@nx/expo/plugins/with-nx-metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

let config = getDefaultConfig(projectRoot);

// Remove console.logs in production
config.transformer.minifierConfig.compress.drop_console = true;

config = withNxMetro(config, {
  watchFolders: [workspaceRoot],
});

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
