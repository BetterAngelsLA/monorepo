const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Load-bearing — do not delete. Expo's monorepo detection needs a
// `pnpm-workspace.yaml` or a root `workspaces` field; this repo has neither, so
// Expo resolves the app root and its own defaults come out empty
// (`watchFolders = []`, `nodeModulesPaths = []`): no sibling `libs/` package
// resolves and no library edit is watched.
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
// Package-name substitutions for the `web` platform only. Native is untouched.
//
// Last resort: an import-time fatal (a module-scope TurboModule lookup, a resolver
// rejection) cannot be guarded with `Platform.OS`, because imports are hoisted —
// that needs a `.web` sibling, or an entry here if you do not own the import site.
// `react-native-maps` needs one: its bundled imports span two libraries, so there
// is no single module to hang a `.web` sibling off.
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
// @expo/cli installs `enhanceMiddleware` whenever it is not exporting, so a shell
// with BA_DEV_PROXY_TARGET exported claims /__api and /admin/login there too.
// Harmless — nothing native requests them — but worth knowing.
const { createDevApiProxy } = require('./dev-api-proxy');

// Chain rather than replace: `enhanceMiddleware` is a shared extension point, so
// anything already composed into it has to keep running.
const previousEnhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware, server) =>
  createDevApiProxy()(
    previousEnhanceMiddleware
      ? previousEnhanceMiddleware(middleware, server)
      : middleware,
  );

module.exports = config;
