/* eslint-disable */
export default {
  displayName: 'expo-shared-utils',
  resolver: '@nx/jest/plugins/resolver',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleFileExtensions: ['ts', 'js', 'html', 'tsx', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
  moduleNameMapper: {
    '.svg': '@nx/expo/plugins/jest/svg-mock',
  },
  preset: 'jest-expo',
  coverageDirectory: '../../../../coverage/libs/expo/shared/utils',
};
