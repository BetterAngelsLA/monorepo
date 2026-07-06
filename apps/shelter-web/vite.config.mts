/// <reference types='vitest' />
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import path from 'path';
import { ProxyOptions, defineConfig } from 'vite';
import { rawSvgPlugin } from './vite/plugins/rawSvgPlugin';
import { monorepoTsconfigAliases } from '../../tools/vite/monorepo-aliases';
import { baseHrefPlugin, getBranchBasePath } from '../../tools/shared/get-base-path.mjs';

const SERVER_PORT = 8083;
const WORKSPACE_ROOT = path.resolve(__dirname, '../..');

const MEDIA_PATH = path.resolve(__dirname, '../betterangels-backend/media');
const devServerProxy: Record<string, string | ProxyOptions> = {
  // to import media from from betterangels-backend
  '/media': {
    target: `http://localhost:${SERVER_PORT}/@fs${MEDIA_PATH}`,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/media/, ''),
  },
};

export default defineConfig(({ mode }) => {
  const basePath = getBranchBasePath();
  return {
    base: basePath,
    root: __dirname,
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
      rawSvgPlugin(),
      baseHrefPlugin(),
    ],

    resolve: {
      alias: monorepoTsconfigAliases(WORKSPACE_ROOT),
    },

    css: {
      postcss: {
        plugins: [
          tailwindcss({
            base: path.resolve(__dirname, '../..'),
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
  };
});
