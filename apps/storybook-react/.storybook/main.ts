import type { StorybookConfig } from '@storybook/react-native-web-vite';
import tailwindcss from '@tailwindcss/postcss';
import { config as dotenvConfig } from 'dotenv';
import 'dotenv/config';
import { resolve } from 'path';

// Load project-level .env.local (set by Nx set-env target with VITE_APP_BASE_PATH).
// @nx/storybook:build runs in-process and doesn't inherit Nx's task-level env,
// so process.env.VITE_APP_BASE_PATH is not automatically available.
dotenvConfig({ path: resolve(__dirname, '../.env.local'), override: true });
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
  managerHead: (head) => `${head}
    <base href="${getBaseHref()}" />
    <script>
      // Patch for Storybook bug #35245 — iframe URL ignores <base href>
      // Watch for the preview iframe and resolve its src against document.baseURI
      new MutationObserver(() => {
        const iframe = document.querySelector('#storybook-preview-iframe');
        if (iframe && iframe.src) {
          const srcURL = new URL(iframe.src, location.href);
          if (srcURL.pathname.endsWith('/iframe.html')) {
            const fixed = new URL('iframe.html', document.baseURI);
            fixed.search = srcURL.search;
            if (iframe.src !== fixed.href) iframe.src = fixed.href;
          }
        }
      }).observe(document.body || document.documentElement, { childList: true, subtree: true });
    </script>`,
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
      ],
      resolve: { tsconfigPaths: true },
      server: { fs: { allow: [searchForWorkspaceRoot(process.cwd())] } },
    });
  },
};

export default config;
