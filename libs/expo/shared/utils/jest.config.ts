/* eslint-disable */
export default {
  displayName: 'expo-shared-utils',
  resolver: '@nx/jest/plugins/resolver',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native/.*)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleFileExtensions: ['ts', 'js', 'html', 'tsx', 'jsx'],
  setupFilesAfterEnv: ['<rootDir>/test-setup.ts'],
  moduleNameMapper: {
    '\\.svg$': '<rootDir>/../../../../jest-svg-mock.js',
  },
  preset: 'jest-expo',
  coverageDirectory: '../../../../coverage/libs/expo/shared/utils',
};
