import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import type { StorybookConfig } from '@storybook/react-vite';
import react from '@vitejs/plugin-react';
import { mergeConfig, searchForWorkspaceRoot } from 'vite';
import svgr from 'vite-plugin-svgr';
import { LIB_STORY_GLOBS } from '../config';
import { rawSvgPlugin } from './plugins/rawSvgPlugin';

const config: StorybookConfig = {
  stories: LIB_STORY_GLOBS,
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
        svgr({}),
        rawSvgPlugin(), // TODO: switch to SVGR globally for react libs
        react(),
        nxViteTsPaths(),
      ],
      server: { fs: { allow: [searchForWorkspaceRoot(process.cwd())] } },
    }),
};

export default config;
