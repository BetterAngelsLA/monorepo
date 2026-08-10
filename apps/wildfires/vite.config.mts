/// <reference types='vitest' />
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { monorepoTsconfigAliases, svgTestResolver } from '../../libs/vite-utils/src/index';
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
  },

  preview: {
    port: SERVER_PORT_PREVIEW,
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
    alias: monorepoTsconfigAliases(path.resolve(__dirname, '../..')),
  },

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

  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
};
});
