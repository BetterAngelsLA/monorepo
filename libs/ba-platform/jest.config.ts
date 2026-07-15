/* eslint-disable */
export default {
  displayName: 'ba-platform',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'html'],
  coverageDirectory: '../../coverage/libs/ba-platform',
  testPathIgnorePatterns: ['/web/', '/expo/'],
  setupFiles: ['./test-setup.ts'],
};
