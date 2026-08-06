import storybookPlugin from 'eslint-plugin-storybook';
import rootConfig from '../../../eslint.config.mjs';

export default [
  ...rootConfig,
  ...storybookPlugin.configs['flat/recommended'],
  // NOTE: contradictory — storybook rules + stories ignore copied from old .eslintrc.json
  {
    ignores: ['**/*.stories.tsx'],
  },
];
