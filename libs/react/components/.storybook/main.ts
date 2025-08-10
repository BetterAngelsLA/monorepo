import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  stories: ['../src/lib/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (config) => {
    config.module?.rules?.push({
      test: /\.(ts|tsx)$/,
      include: /libs\/react\/components/, // limit to this lib
      use: [
        {
          loader: require.resolve('babel-loader'),
          options: {
            presets: [
              require.resolve('@babel/preset-env'),
              require.resolve('@babel/preset-typescript'),
              [
                require.resolve('@babel/preset-react'),
                { runtime: 'automatic' },
              ],
            ],
          },
        },
      ],
    });

    config.resolve?.extensions?.push('.ts', '.tsx');
    return config;
  },
};

export default config;
