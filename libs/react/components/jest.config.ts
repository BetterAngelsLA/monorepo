/* eslint-disable */
export default {
  displayName: 'react-components',
  preset: '../../../jest.preset.js',
  testEnvironment: 'jsdom',
  setupFiles: ['<rootDir>/test-setup.ts'],
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      { tsconfig: '<rootDir>/tsconfig.spec.json', diagnostics: false },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'html'],
  moduleNameMapper: {
    '.svg$': '@nx/expo/plugins/jest/svg-mock',
  },
  coverageDirectory: '../../../coverage/libs/react/components',
};
