import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import type { StorybookConfig } from '@storybook/react-native-web-vite';
import tailwindcss from '@tailwindcss/postcss';
import 'dotenv/config';
import { resolve } from 'path';
import { mergeConfig, searchForWorkspaceRoot } from 'vite';
import svgr from 'vite-plugin-svgr';
import {
  PLATFORM_STORIES,
  REACT_APP_LIB_STORIES,
  REACT_SHARED_LIB_STORIES,
  RN_SHARED_LIB_STORIES,
} from '../config/index.ts';
import { appendReactQueryForRnSvg } from './plugins/appendReactQueryForRnSvg.ts';
import { rawSvgPlugin } from './plugins/rawSvgPlugin.ts';

function getBasePath(): string {
  const isDev = process.env.NODE_ENV === 'development';
  return isDev ? '/' : process.env.VITE_APP_BASE_PATH || '/';
}

function getBaseHref(): string {
  const p = getBasePath();
  return p.endsWith('/') ? p : p + '/';
}

const config: StorybookConfig = {
  stories: [
    ...PLATFORM_STORIES,
    ...REACT_SHARED_LIB_STORIES,
    ...RN_SHARED_LIB_STORIES,
    ...REACT_APP_LIB_STORIES,
  ],
  addons: [],
  managerHead: (head) => `${head}<base href="${getBaseHref()}" />`,
  previewHead: (head) => `${head}<base href="${getBaseHref()}" />`,
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
    const basePath = getBasePath();
    const workspaceRoot = searchForWorkspaceRoot(process.cwd());
    const isDev = process.env.NODE_ENV === 'development';

    return mergeConfig(base, {
      base: basePath,
      define: {
        'import.meta.env.VITE_APP_BASE_PATH': JSON.stringify(basePath),
      },
      css: {
        postcss: {
          plugins: [
            tailwindcss({
              base: workspaceRoot,
              optimize: isDev ? { minify: false } : undefined,
            }),
          ],
        },
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
