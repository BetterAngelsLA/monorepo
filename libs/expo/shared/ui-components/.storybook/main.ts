import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx|mdx)'],
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
