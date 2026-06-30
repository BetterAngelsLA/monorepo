/* eslint-disable */
export default {
  displayName: 'ba-platform',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/ba-platform',
};
