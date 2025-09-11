import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import type { StorybookConfig } from '@storybook/react-native-web-vite';
import 'dotenv/config';
import { resolve } from 'path';
import { mergeConfig, searchForWorkspaceRoot } from 'vite';
import svgr from 'vite-plugin-svgr';
import { ALL_LIB_STORY_GLOBS } from '../config';
import { appendReactQueryForRnSvg } from './plugins/appendReactQueryForRnSvg';
import { rawSvgPlugin } from './plugins/rawSvgPlugin';

const config: StorybookConfig = {
  stories: ALL_LIB_STORY_GLOBS,
  addons: [],
  framework: {
    name: '@storybook/react-native-web-vite',
    options: {},
  },

  // avoids react-docgen breakage in some setups
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      savePropValueAsString: true,
    },
  },

  viteFinal: async (base) => {
    const isDev = process.env.NODE_ENV === 'development';
    const basePath = isDev ? '/' : process.env.VITE_APP_BASE_PATH || '/';
    const workspaceRoot = searchForWorkspaceRoot(process.cwd());

    return mergeConfig(base, {
      base: basePath,
      define: {
        'import.meta.env.VITE_APP_BASE_PATH': JSON.stringify(basePath),
      },
      plugins: [
        // we handle SVGs differently across libs, hence the separate plugins
        appendReactQueryForRnSvg(
          resolve(workspaceRoot, 'libs/expo') // adjust per RN libs root
        ),
        // handles SVGs with ?react appended by appendReactQueryForRnSvg
        svgr({
          include: '**/*.svg?react',
          svgrOptions: {
            exportType: 'default',
            ref: true,
          },
        }),
        rawSvgPlugin(), // TODO: switch to SVGR globally for react libs
        nxViteTsPaths(),
      ],
      server: { fs: { allow: [searchForWorkspaceRoot(process.cwd())] } },
    });
  },
};

export default config;
