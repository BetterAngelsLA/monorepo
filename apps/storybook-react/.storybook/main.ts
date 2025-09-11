import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import type { StorybookConfig } from '@storybook/react-native-web-vite';
import 'dotenv/config';
import { mergeConfig, searchForWorkspaceRoot } from 'vite';
import svgr from 'vite-plugin-svgr';
import { ALL_LIB_STORY_GLOBS } from '../config';

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

    return mergeConfig(base, {
      base: basePath,
      define: {
        'import.meta.env.VITE_APP_BASE_PATH': JSON.stringify(basePath),
      },
      plugins: [
        // svgr({}),
        // rawSvgPlugin(), // TODO: switch to SVGR globally for react libs

        // svgr with these options works with rn-native
        // but removing rawSvgPlugin() breaks the web version of svg icons
        svgr({
          include: '**/*.svg',
          svgrOptions: {
            exportType: 'default',
            ref: true,
          },
        }),
        // react(), --  not needed with rn-web?
        nxViteTsPaths(),
      ],
      server: { fs: { allow: [searchForWorkspaceRoot(process.cwd())] } },
    });
  },
};

export default config;
