const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Expo SDK 52+ auto-detects monorepos, but Nx workspaces can be missed.
// Manually set watchFolders + nodeModulesPaths per official guidance:
// https://docs.expo.dev/guides/monorepos/#manual-configuration-before-sdk-52
config.watchFolders = [workspaceRoot];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

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

// ---------------------------------------------------------------------------
// Web shims
// ---------------------------------------------------------------------------
// Third-party packages that have no usable browser build, replaced on the `web`
// platform only. Native builds are untouched.
//
// These are alias-level replacements rather than `.web.tsx` siblings because the
// packages are imported by *package name* from many files across `libs/`, so a
// platform-suffixed file has nowhere to live. Anything that is a single-module
// concern is better handled as a `.web.tsx` sibling next to that module (see
// useRememberEmail, useNewRelic) — this map is for cross-cutting package
// substitutions only.
//
// See docs/outreach-web.md for the reasoning behind each entry.
const WEB_SHIMS = {
  // Native TurboModule views. Web needs nothing: browsers handle keyboard
  // insets/dismissal natively, so this degrades to plain ScrollView/passthrough.
  'react-native-keyboard-controller': path.resolve(
    projectRoot,
    'src/web-shims/react-native-keyboard-controller.tsx',
  ),
  // Backed by @teovilla/react-native-web-maps. The shim also restores the
  // PROVIDER_GOOGLE/PROVIDER_DEFAULT constants teovilla omits and injects the
  // browser Maps key, which teovilla requires as a prop.
  'react-native-maps': path.resolve(
    projectRoot,
    'src/web-shims/react-native-maps.tsx',
  ),
};

const previousResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web') {
    const shim = WEB_SHIMS[moduleName];
    if (shim) {
      return { type: 'sourceFile', filePath: shim };
    }
  }

  // Falls through to Expo's resolver chain (which handles platform extensions,
  // tsconfig paths, and its own native-module guards).
  return (previousResolveRequest ?? context.resolveRequest)(
    context,
    moduleName,
    platform,
  );
};

// ---------------------------------------------------------------------------
// Dev-only same-origin API proxy
// ---------------------------------------------------------------------------
// Lets the local web dev server talk to a deployed API that the browser would
// otherwise refuse (CORS + cross-domain CSRF cookie scoping). Enable with:
//
//   BA_DEV_PROXY_TARGET=https://api.dev.betterangels.la \
//   EXPO_PUBLIC_API_URL=http://localhost:8081/__api \
//   yarn nx serve betterangels
//
// Expo wraps this in its own middleware stack (see `instantiateMetro`), and it
// is inert unless a path under /__api is actually requested — or the target is
// unset, in which case only /__api is claimed with a 502 hint. See
// dev-api-proxy.js.
//
// Shipped native builds never mount it, but the *native dev server* does:
// @expo/cli installs `enhanceMiddleware` whenever it is not exporting. So a
// shell with BA_DEV_PROXY_TARGET exported would claim /__api and /admin/login on
// the native dev server too — harmless (nothing native requests them), but worth
// knowing when debugging either server.
const { createDevApiProxy } = require('./dev-api-proxy');

// Chain rather than replace: `enhanceMiddleware` is a general Metro extension
// point, so anything already composed into it must keep running. Replacing it
// would drop that behaviour in a way that looks unrelated to this project.
const previousEnhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware, server) =>
  createDevApiProxy()(
    previousEnhanceMiddleware
      ? previousEnhanceMiddleware(middleware, server)
      : middleware,
  );

module.exports = config;
