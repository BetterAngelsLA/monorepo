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
// Dev-only same-origin API proxy
// ---------------------------------------------------------------------------
// Lets the local web dev server talk to a deployed API that the browser would
// otherwise refuse (CORS + cross-domain CSRF cookie scoping). Nothing to
// configure — the targets are derived from the app's own API URLs, which are
// loaded from `.env*` before this file is evaluated:
//
//   EXPO_PUBLIC_API_URL=https://api.betterangels.la          -> /__api/production
//   EXPO_PUBLIC_DEMO_API_URL=https://api.dev.betterangels.la -> /__api/demo
//   EXPO_PUBLIC_LOCAL_API_URL=http://localhost:8000           -> /__api/local
//
// A web dev build asks for those prefixed URLs itself; native never does. Set
// BA_DEV_PROXY_TARGETS=name=url,... to add or override a target.
//
// Expo wraps this in its own middleware stack (see `instantiateMetro`), and it
// is inert unless a path under /__api is actually requested — or nothing is
// configured, in which case only /__api is claimed with a 502 hint. See
// dev-api-proxy.js, which delegates the forwarding itself to
// http-proxy-middleware and keeps only the target derivation and the per-target
// cookie rewriting.
//
// Shipped native builds never mount it, but the *native dev server* does:
// @expo/cli installs `enhanceMiddleware` whenever it is not exporting, so a
// dev server claims /__api there too. Harmless — nothing native requests it —
// but worth knowing.
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
