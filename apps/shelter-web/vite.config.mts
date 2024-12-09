/// <reference types='vitest' />
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  root: __dirname,
  cacheDir: '../../node_modules/.vite/apps/shelter-web',

  server: {
    port: 8083,
    host: 'localhost',
  },

  preview: {
    port: 8183,
    host: 'localhost',
  },

  plugins: [
    react(),
    svgr({
      include: '**/*.svg?react',
    }),
    nxViteTsPaths(),
  ],

  build: {
    outDir: '../../dist/apps/shelter-web',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
});
