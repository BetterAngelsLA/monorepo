import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import type { StorybookConfig } from '@storybook/react-vite';
import react from '@vitejs/plugin-react';
import { createRequire } from 'node:module';
import { mergeConfig, searchForWorkspaceRoot } from 'vite';
import { rawSvgPlugin } from './plugins/rawSvgPlugin';

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
      plugins: [
        rawSvgPlugin(), // Consider switching to SVGR globally for react icons
        react(),
        nxViteTsPaths(),
      ],
      server: { fs: { allow: [searchForWorkspaceRoot(process.cwd())] } },
    }),
};

export default config;
