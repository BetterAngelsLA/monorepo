const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Load-bearing, not belt-and-braces: do not delete this block.
//
// Expo's monorepo detection keys off a `pnpm-workspace.yaml` or a `workspaces`
// array in package.json. This repo has neither at the root (Yarn 4 with an Nx
// project graph), so `getMetroServerRoot()` resolves to `apps/betterangels`
// itself and Expo's own defaults come out empty — `watchFolders = []` and
// `nodeModulesPaths = []` — which means no sibling `libs/` package resolves and
// no library edit is watched.
//
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
// Last resort, not the default. Choose by *when the failure happens*: an
// **import-time fatal** (a module-scope `TurboModuleRegistry.getEnforcing`, a
// resolver rejection) cannot be guarded with `Platform.OS`, because ES imports
// are hoisted and evaluated regardless of the branch — that needs a `.web`
// sibling, or an entry here when you do not own the import site. A **use-time**
// failure (an `undefined` component, wrong constants) is better served by one
// file plus one guard, so the contract stays in one place. Anything else prefers
// a small re-export seam, which is visible at the import site.
//
// `react-native-maps` needs an entry: its bundled imports come from two
// independent libraries, so there is no single module to hang a `.web` sibling
// off, the replacement needs the app's resolved browser key, and it implements
// behaviour teovilla omits (region deltas → zoom, provider forcing, key
// injection).
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
