// metro.config.js

const { withNxMetro } = require('@nx/expo');
const { getDefaultConfig } = require('expo/metro-config');

// Start from Expo's default Metro config
const config = getDefaultConfig(__dirname);

// ----- TRANSFORMER: preserve defaults, add svg + drop_console -----
config.transformer = {
  // Keep all the important Expo/Metro defaults:
  // - assetRegistryPath
  // - assetPlugins
  // - asyncRequire / hermes settings
  // - etc.
  ...config.transformer,

  // Keep existing minifier options and add drop_console safely
  minifierConfig: {
    ...(config.transformer.minifierConfig || {}),
    compress: {
      ...((config.transformer.minifierConfig || {}).compress || {}),
      drop_console: true,
    },
  },

  // Use react-native-svg-transformer for SVG imports
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

// ----- RESOLVER: preserve defaults, tweak svg/mjs/cjs -----
config.resolver = {
  // Keep all existing resolver settings (including default asset handling)
  ...config.resolver,

  // Ensure SVGs are treated as code, not static assets
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),

  // Add svg/mjs/cjs to source extensions without duplicating
  sourceExts: Array.from(
    new Set([...config.resolver.sourceExts, 'svg', 'mjs', 'cjs'])
  ),
};

// ----- Nx integration -----
// Nx adds monorepo-aware settings (workspace libs, node_modules, etc.)
module.exports = withNxMetro(config, {
  // Turn this on if you're debugging resolution issues
  debug: false,

  // Extra non-standard import extensions, if you use any (leave empty otherwise)
  extensions: [],

  // Extra folders to watch beyond Nx defaults
  watchFolders: [],
});
