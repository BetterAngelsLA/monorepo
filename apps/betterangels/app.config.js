// ⚠️ WARNING: DIRTY HACK IN PLACE ⚠️
// This hack circumvents the CI breaking change where runtime versions don't match.
// We're using dotenv to load environment variables, effectively bypassing the runtime version mismatch issue.
// NOTE: We are trusting the continuous deploy fingerprint for now, which is "probably good enough" in this context.
// This should be revisited in the future to implement a proper solution to handle runtime version mismatches.
const dotenv = require('dotenv');
dotenv.config();

const IS_PRODUCTION = process.env.APP_VARIANT === 'production';

const HOSTNAME = IS_PRODUCTION
  ? 'api.prod.betterangels.la' // TODO: We should adjust this to be app.betterangels.la
  : 'api.dev.betterangels.la'; // TODO: We should adjust this to be app.dev.betterangels.la

const BUNDLE_IDENTIFIER = IS_PRODUCTION
  ? 'la.betterangels.app'
  : 'la.betterangels.dev.app';

export default {
  expo: {
    name: IS_PRODUCTION ? 'BetterAngels' : 'BetterAngels (Dev)',
    slug: 'betterangels',
    scheme: IS_PRODUCTION ? 'betterangels' : 'betterangels-dev',
    version: '1.0.48',
    orientation: 'portrait',
    icon: IS_PRODUCTION
      ? './src/app/assets/images/icon.png'
      : './src/app/assets/images/preview-icon.png',
    updates: {
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/53171ba4-60ca-40cb-b3e6-b0c2393677b8',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: BUNDLE_IDENTIFIER,
      buildNumber: '1.0.59',
      associatedDomains: [`applinks:${HOSTNAME}`],
      config: {
        googleMapsApiKey: process.env.EXPO_PUBLIC_IOS_GOOGLEMAPS_APIKEY,
        usesNonExemptEncryption: false,
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: IS_PRODUCTION
          ? './src/app/assets/images/adaptive-icon.png'
          : './src/app/assets/images/preview-adaptive-icon.png',
        backgroundColor: '#1E3342',
      },
      blockedPermissions: [
        'android.permission.READ_MEDIA_IMAGES',
        'android.permission.READ_MEDIA_VIDEO',
      ], // https://github.com/expo/expo/issues/25361#issuecomment-2363699975
      softwareKeyboardLayoutMode: 'pan',
      package: BUNDLE_IDENTIFIER,
      intentFilters: [
        {
          action: 'VIEW',
          data: [
            {
              scheme: 'https',
              host: HOSTNAME,
              pathPrefix: '/',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_ANDROID_GOOGLEMAPS_APIKEY,
        },
      },
      versionCode: 58,
    },
    web: {
      favicon: './src/app/assets/images/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      'newrelic-react-native-agent',
      '@config-plugins/react-native-blob-util',
      '@config-plugins/react-native-pdf',
      'expo-build-properties',
      [
        'expo-dev-client',
        {
          launchMode: 'launcher',
        },
      ],
      [
        'expo-font',
        {
          fonts: [
            './src/app/assets/fonts/Poppins-Medium.ttf',
            './src/app/assets/fonts/Poppins-Regular.ttf',
            './src/app/assets/fonts/Poppins-SemiBold.ttf',
          ],
        },
      ],
      'expo-router',
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow $(PRODUCT_NAME) to access your photos to upload images for documenting client interactions.',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission:
            'Allow $(PRODUCT_NAME) to use your camera to take photos for documenting client interactions.',
        },
      ],
      [
        'expo-location',
        {
          locationWhenInUsePermission:
            'Allow $(PRODUCT_NAME) to use your location to log where client interactions take place.',
        },
      ],
      [
        'expo-splash-screen',
        {
          backgroundColor: '#216AF8',
          image: './src/app/assets/images/splash.png',
          imageWidth: 750,
        },
      ],
      [
        'expo-document-picker',
        {
          iCloudContainerEnvironment: 'Production',
        },
      ],
    ],
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: '53171ba4-60ca-40cb-b3e6-b0c2393677b8',
      },
    },
    newArchEnabled: false,
    owner: 'better-angels',
    runtimeVersion: process.env.RUNTIME_VERSION,
  },
};
