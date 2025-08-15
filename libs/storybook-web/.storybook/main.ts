import type { StorybookConfig } from '@storybook/react-vite';
import { createRequire } from 'node:module';

import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vite';

const require = createRequire(import.meta.url);

const config: StorybookConfig = {
  stories: [
    '../../react/components/src/lib/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
    '../../react/icons/src/lib/components/**/*.@(mdx|stories.@(js|jsx|ts|tsx))',
  ],
  addons: [],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  // NOTE: still not sure why, but breaks without it
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      savePropValueAsString: true,
    },
  },

  viteFinal: async (config) =>
    mergeConfig(config, {
      plugins: [react(), nxViteTsPaths()],
    }),
};

export default config;
