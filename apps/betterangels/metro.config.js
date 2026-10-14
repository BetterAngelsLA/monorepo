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

// Dev-only same-origin API proxy for the web dev server. Nothing to configure:
// the targets are derived from the app's own `EXPO_PUBLIC_*_API_URL` values,
// which `.env*` has already loaded by the time this file is evaluated. See
// dev-api-proxy.js for the mechanism and `.env.local.sample` for the how-to.
//
// Shipped native builds never mount it, but the *native dev server* does:
// @expo/cli installs `enhanceMiddleware` whenever it is not exporting, so a dev
// server claims /__api there too. Harmless — nothing native requests it.
const { createDevApiProxy } = require('./dev-api-proxy');

// `enhanceMiddleware` is deprecated, and its successor is Metro's
// `server.unstable_extraMiddleware` — a Metro maintainer confirms that on
// react/metro#1678, Metro implements it, and React Native's CLI uses it.
//
// Expo's dev server does not wire it up yet, which is the only reason this file
// still uses the deprecated hook: `@expo/metro` declares the option in its types
// (`index.flow.d.ts`) but does not implement it, and `@expo/cli` builds its own
// `connect` stack (`dev-server/createMetroMiddleware.js`) that reads neither
// option — `instantiateMetro` wires only `enhanceMiddleware`, and calls it
// deprecated in the same breath as it relies on it.
//
// Measured rather than assumed: with `unstable_extraMiddleware` set,
// `/__api/nope/` answered 200 with the dev server's own HTML instead of this
// proxy's 502, so the handler was never mounted. Migrate when Expo's fork
// implements the option.
//
// Chain rather than replace: it is a shared extension point, so anything already
// composed into it has to keep running.
const previousEnhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware, server) =>
  createDevApiProxy()(
    previousEnhanceMiddleware
      ? previousEnhanceMiddleware(middleware, server)
      : middleware,
  );

module.exports = config;
