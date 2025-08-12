const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
import type { StorybookConfig } from '@storybook/react-webpack5';
import * as path from 'path';

const config: StorybookConfig = {
  stories: ['../src/lib/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials', 'storybook-addon-pseudo-states'],

  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (config) => {
    // Remove existing .css rule to add Tailwind later
    config.module!.rules = (config.module!.rules || []).filter(
      (rule): rule is { test: RegExp } =>
        typeof rule === 'object' &&
        rule !== null &&
        'test' in rule &&
        rule.test instanceof RegExp &&
        !rule.test.test('file.css')
    );

    config.module?.rules?.push({
      test: /\.(ts|tsx)$/,
      exclude: /node_modules/,
      use: [
        {
          loader: require.resolve('ts-loader'),
          options: {
            configFile: require.resolve('../tsconfig.json'),
            transpileOnly: true,
          },
        },
      ],
    });

    config.module?.rules?.push({
      test: /\.css$/,
      use: [
        require.resolve('style-loader'),
        require.resolve('css-loader'),
        {
          loader: require.resolve('postcss-loader'),
          options: {
            postcssOptions: {
              plugins: [
                require('tailwindcss')({
                  config: path.resolve(__dirname, './tailwind.config.ts'),
                }),
                require('autoprefixer'),
              ],
            },
          },
        },
      ],
      // DO NOT restrict this to just `libs/react/components`
      // if tailwind.css is in `.storybook/`
      include: path.resolve(__dirname), // allow .storybook/tailwind.css to match
    });

    // Load SVGs as raw text for createSvgComponent
    config.module?.rules?.push({
      test: /\.svg$/,
      type: 'javascript/auto',
      use: 'raw-loader',
      exclude: /node_modules/,
    });

    // Resolve TS paths
    config.resolve ??= {};
    config.resolve.plugins ??= [];
    config.resolve.plugins.push(
      new TsconfigPathsPlugin({
        configFile: path.resolve(
          __dirname,
          '../../../../libs/react/components/tsconfig.json'
        ),
      }) as unknown as { apply: (resolver: any) => void }
    );

    config.resolve.extensions?.push('.ts', '.tsx');

    return config;
  },
};

export default config;
