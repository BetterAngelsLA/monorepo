/// <reference types='vitest' />
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import path from 'path';
import { ProxyOptions, defineConfig } from 'vite';
import { rawSvgPlugin } from './vite/plugins/rawSvgPlugin';
import { monorepoTsconfigAliases } from '../../tools/vite/monorepo-aliases';
import { baseHrefPlugin } from '../../tools/vite/base-href-plugin';

const SERVER_PORT = 8084;
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
  const isDev = mode === 'development';
  return {
    base: isDev ? '/' : process.env.VITE_APP_BASE_PATH || '/',
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/betterangels-admin',

    define: {
      'import.meta.env.VITE_APP_BASE_PATH': JSON.stringify(
        process.env.VITE_APP_BASE_PATH || '/'
      ),
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
      port: 8184,
      host: 'localhost',
    },

    plugins: [
      react(),
      rawSvgPlugin(),
      baseHrefPlugin(),
    ],

    css: {
      postcss: {
        plugins: [
          tailwindcss({
            base: WORKSPACE_ROOT,
            optimize: isDev ? { minify: false } : undefined,
          }),
        ],
      },
    },

    resolve: { alias: monorepoTsconfigAliases(WORKSPACE_ROOT) },

    build: {
      outDir: '../../dist/apps/betterangels-admin',
      emptyOutDir: true,
      reportCompressedSize: true,
      commonjsOptions: {
        transformMixedEsModules: true,
      },
    },
  };
});
