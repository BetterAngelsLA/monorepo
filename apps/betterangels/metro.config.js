const { withNxMetro } = require('@nx/expo');
const { getDefaultConfig } = require('expo/metro-config');
const { mergeConfig } = require('metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// --- Transformer tweaks ---
// Tell Metro’s minifier (Terser) to remove all console.* calls from production bundles
defaultConfig.transformer.minifierConfig.compress.drop_console = true;

// --- Resolver tweaks ---
// Add additional file extensions that Metro should recognize when resolving imports
defaultConfig.resolver.sourceExts = [
  ...defaultConfig.resolver.sourceExts,
  'mjs', // for modern JS modules (rare but safe to include)
  'cjs', // for CommonJS modules used by some Node-style packages
];

const { assetExts, sourceExts } = defaultConfig.resolver;

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */
const customConfig = {
  transformer: {
    // 👇 Replace Metro’s default transformer with one that knows how to handle SVGs.
    //    react-native-svg-transformer converts SVG files into React components.
    babelTransformerPath: require.resolve('react-native-svg-transformer'),
  },
  resolver: {
    // 👇 Remove 'svg' from the asset extensions so Metro doesn’t treat it as a static image.
    assetExts: assetExts.filter((ext) => ext !== 'svg'),

    // 👇 Add 'svg' to source extensions so that JS/TS code can `import MyIcon from './icon.svg'`
    sourceExts: [...sourceExts, 'svg'],
  },
};

// Merge your custom tweaks with Expo’s defaults
// and let Nx patch the final config for monorepo resolution
module.exports = withNxMetro(mergeConfig(defaultConfig, customConfig), {
  // Enable this for verbose Metro debug output if you’re troubleshooting resolution issues
  debug: false,

  // Add any nonstandard file extensions used in your monorepo (optional)
  extensions: [],

  // Watch additional folders beyond Nx defaults (optional, e.g. for linked local packages)
  watchFolders: [],
});
