/// <reference types='vitest' />
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import path from 'path';
import { ProxyOptions, defineConfig, loadEnv } from 'vite';
import {
  monorepoTsconfigAliases,
  svgTestResolver,
} from '../../libs/vite-utils/src/index';
import {
  baseHrefPlugin,
  getBuildBasePath,
} from '../../tools/shared/get-base-path.mjs';
import { assertMonitoringEnv } from '../../tools/shared/assert-monitoring-env.mjs';

const SERVER_PORT = 8083;
const WORKSPACE_ROOT = path.resolve(import.meta.dirname, '../..');

const MEDIA_PATH = path.resolve(
  import.meta.dirname,
  '../betterangels-backend/media',
);
const devServerProxy: Record<string, string | ProxyOptions> = {
  // to import media from from betterangels-backend
  '/media': {
    target: `http://localhost:${SERVER_PORT}/@fs${MEDIA_PATH}`,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/media/, ''),
  },
};

export default defineConfig(({ command, mode }) => {
  const isDev = mode === 'development';
  const basePath = getBuildBasePath();

  if (command === 'build') {
    const env = loadEnv(mode, import.meta.dirname, 'VITE_');
    assertMonitoringEnv({
      label: 'shelter-web-monitoring',
      required: [
        'VITE_SHELTER_WEB_NEW_RELIC_LICENSE_KEY',
        'VITE_APP_ENV',
        'VITE_APP_VERSION',
      ],
      env,
      isCI: process.env.CI === 'true' || process.env.CI === '1',
    });
  }

  return {
    base: basePath,
    root: import.meta.dirname,
    cacheDir: '../../node_modules/.vite/apps/shelter-web',

    define: {
      'import.meta.env.VITE_APP_BASE_PATH': JSON.stringify(basePath),
    },

    ...(isDev && {
      server: {
        port: SERVER_PORT,
        host: true,
        proxy: devServerProxy,
        fs: { allow: [WORKSPACE_ROOT] },
      },
    }),

    preview: {
      port: 8183,
      host: 'localhost',
    },

    plugins: [
      react(),
      baseHrefPlugin(basePath),
      // Vite handles ?raw SVG imports natively.
      // Only stub SVGs during Vitest runs (avoids cross-package Denied ID).
      ...(process.env.VITEST ? [svgTestResolver()] : []),
    ],

    resolve: {
      alias: monorepoTsconfigAliases(WORKSPACE_ROOT),
    },

    css: {
      postcss: {
        plugins: [
          tailwindcss({
            base: path.resolve(import.meta.dirname, '../..'),
            optimize: isDev ? { minify: false } : undefined,
          }),
        ],
      },
    },

    build: {
      outDir: '../../dist/apps/shelter-web',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },

    test: {
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{ts,tsx}'],
    },
  };
});
