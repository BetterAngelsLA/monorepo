/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
import path from 'path';
import { ProxyOptions, defineConfig } from 'vite';
import { rawSvgPlugin } from './vite/plugins/rawSvgPlugin';

const SERVER_PORT = 8083;

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
    base: process.env.SHELTER_BASE_PATH || '/',
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/shelter-web',

    server: {
      port: SERVER_PORT,
      host: 'localhost',
      proxy: isDev ? devServerProxy : {},
    },

    preview: {
      port: 8183,
      host: 'localhost',
    },

    plugins: [react(), rawSvgPlugin(), nxViteTsPaths()],

    resolve: {},

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
