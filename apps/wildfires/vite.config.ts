/// <reference types='vitest' />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import path from 'path';
import { rawSvgPlugin } from './vite/plugins/rawSvgPlugin';

const SERVER_PORT = 8200;
const SERVER_PORT_PREVIEW = 8201;

export default defineConfig({
  base: process.env.APP_BASE_PATH || '/',
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/wildfires',

  define: {
    'import.meta.env.VITE_APP_BASE_PATH': JSON.stringify(
      process.env.APP_BASE_PATH || '/'
    ),
  },

  server: {
    port: SERVER_PORT,
    host: 'localhost',
    fs: {
      allow: [
        // TODO: confirm if this configuration is needed.
        // Did not need this with shelter-web
        path.resolve(__dirname, '../../libs/assets/src'), // Allow assets from libs
        path.resolve(__dirname, 'src'), // Allow app source directory (relative to the app folder)
        path.resolve(__dirname, '../../apps/wildfires/src'), // Ensure this allows
      ],
    },
  },

  preview: {
    port: SERVER_PORT_PREVIEW,
    host: 'localhost',
  },

  plugins: [react(), rawSvgPlugin(), nxViteTsPaths()],

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [ nxViteTsPaths() ],
  // },

  build: {
    outDir: '../../dist/apps/wildfires',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
