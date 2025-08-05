import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  stories: ['../src/lib/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-essentials'],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (config) => {
    // Remove existing .css rule (usually already in config.module.rules)
    config.module!.rules = (config.module!.rules || []).filter(
      (rule): rule is { test: RegExp } => {
        return (
          typeof rule === 'object' &&
          rule !== null &&
          'test' in rule &&
          rule.test instanceof RegExp &&
          !rule.test.test('file.css')
        );
      }
    );

    // Add our TS/TSX rule
    config.module?.rules?.push({
      test: /\.(ts|tsx)$/,
      include: /libs\/react\/components/,
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

    // Add our clean Tailwind CSS rule
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
                  config: require.resolve('./tailwind.config.ts'), // or point to the app one
                }),
                require('autoprefixer'),
              ],
            },
          },
        },
      ],
      include: /libs\/react\/components/, // optional: limit scope
    });

    config.resolve?.extensions?.push('.ts', '.tsx');
    return config;
  },
};

export default config;
