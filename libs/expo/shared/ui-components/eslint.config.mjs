import storybookPlugin from 'eslint-plugin-storybook';
import rootConfig from '../../../../eslint.config.mjs';

export default [
  ...rootConfig,
  ...storybookPlugin.configs['flat/recommended'],
  {
    ignores: ['web-build', 'cache'],
  },
];
