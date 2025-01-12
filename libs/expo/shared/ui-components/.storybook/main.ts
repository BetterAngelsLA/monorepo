import type { StorybookConfig } from '@storybook/react-webpack5';

// import asdf from 'libs/expo/shared/ui-components/.storybook'
const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],

  // staticDirs: [path.join(__dirname, './assets')],

  addons: [
    '@storybook/addon-essentials',
    '@nx/react/plugins/storybook',
    '@storybook/addon-react-native-web',
  ],
  framework: {
    name: '@storybook/react-webpack5',
    options: {},
  },
  webpackFinal: async (config) => {
    // Add polyfill for Node.js modules like crypto
    config.resolve = {
      ...config.resolve,
      // alias: {
      //   'react-native$': 'react-native-web',
      // },
      fallback: {
        vm: require.resolve('vm-browserify'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        os: require.resolve('os-browserify'),
        path: require.resolve('path-browserify'),
      },
    };
    // config.module?.rules?.push({
    //   test: /\.css$/,
    //   use: ['style-loader', 'css-loader', 'postcss-loader'],
    // });
    // src: url('libs/assets/src/fonts')
    // config.module?.rules?.push({
    //   test: /\.(woff|woff2|eot|ttf|otf)$/,
    //   use: [
    //     {
    //       loader: 'file-loader',
    //       options: {
    //         name: '[name].[ext]',
    //         outputPath: 'assets/fonts/',
    //         publicPath: '/assets/fonts/',
    //       },
    //     },
    //   ],
    // });
    // Ensure the Babel configuration file is used by Storybook
    // config.module?.rules?.push({
    //   test: /\.(js|jsx|ts|tsx)$/,
    //   loader: require.resolve('babel-loader'),
    //   options: {
    //     configFile: path.resolve(__dirname, '../babel.config.json'),
    //   },
    // });
    /**
     * There are two loaders attached to SVGs - svgr and file-loader
     * The current configuration defaults to file-loader. The code below
     * deletes file loader for svgs configurations
     */
    const imageRule = config.module?.rules?.find((rule) => {
      const test = (rule as { test: RegExp }).test;

      if (!test) {
        return false;
      }

      return test.test('.svg');
    }) as any;

    const fileLoaderRuleIndex = config?.module?.rules?.findIndex((rule) =>
      (rule as { test: RegExp }).test.test('.svg')
    ) as number;

    imageRule.use = imageRule.use.filter(
      (use: { loader: string; options: any }) => use.loader.match('@svgr')
    );

    (config?.module?.rules as any[])[fileLoaderRuleIndex] = imageRule;

    return config;
  },
};

export default config;

// To customize your webpack configuration you can use the webpackFinal field.
// Check https://storybook.js.org/docs/react/builders/webpack#extending-storybooks-webpack-config
// and https://nx.dev/packages/storybook/documents/custom-builder-configs
