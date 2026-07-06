/// <reference types='vitest' />
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { rawSvgPlugin } from './vite/plugins/rawSvgPlugin';
import { baseHrefPlugin, getBranchBasePath } from '../../tools/shared/get-base-path.mjs';

const SERVER_PORT = 8200;
const SERVER_PORT_PREVIEW = 8201;

export default defineConfig(({ mode }) => {
  const isDev = mode === 'development';
  const basePath = getBranchBasePath();
  return {
  base: basePath,
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/wildfires',

  define: {
    'import.meta.env.VITE_APP_BASE_PATH': JSON.stringify(basePath),
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

  plugins: [
    react(),
    rawSvgPlugin(),
    baseHrefPlugin(),
  ],

  resolve: { tsconfigPaths: true },

  css: {
    postcss: {
      plugins: [
        tailwindcss({
          base: path.resolve(__dirname, '../..'),
          optimize: mode === 'development' ? { minify: false } : undefined,
        }),
      ],
    },
  },

  // Uncomment this if you are using workers.
  // worker: {
  //  plugins: [],
  // },

  build: {
    outDir: '../../dist/apps/wildfires',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
};
});
