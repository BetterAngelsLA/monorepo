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
// Package-name substitutions for the `web` platform only. Native builds are
// untouched.
//
// This is the last resort, not the default. Prefer a `.web.tsx` sibling, or a
// small re-export seam with a `.web` twin — `react-native-keyboard-controller`
// used to be an entry here and is now
// `libs/expo/shared/ui-components/src/lib/Keyboard`, which is visible at the
// import site and needs no bundler hook.
//
// An entry is warranted only when the *module itself* has to be intercepted and
// there is no repo module to hang a web variant off. `react-native-maps`
// qualifies on both counts:
//
//   1. It is imported by package name from ~20 files across `libs/`, and the
//      replacement needs the app's resolved browser key, so it cannot live in a
//      library as a `.web` sibling; and
//   2. the replacement implements behaviour teovilla omits (region deltas →
//      zoom, provider forcing, key injection) rather than degrading to nothing
//      the way the keyboard-controller shim did.
//
// See docs/outreach-web.md for the reasoning behind the entry.
const WEB_SHIMS = {
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
