import { defineConfig } from 'vite';

// export default defineConfig(() => ({
export default defineConfig(({ mode }) => {
  return {
    root: __dirname,
    cacheDir: '../../node_modules/.vite/apps/storybook-react',

    plugins: [],
    // Uncomment this if you are using workers.
    // worker: {
    //  plugins: [],
    // },
    resolve: { tsconfigPaths: true },
    test: {
      watch: false,
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
      reporters: ['default'],
      passWithNoTests: true,
      coverage: {
        include: ['src/**/*.{ts,tsx}'],
        reportsDirectory: '../../coverage/apps/storybook-react',
        provider: 'v8' as const,
      },
    },
  };
});
