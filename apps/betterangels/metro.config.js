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
