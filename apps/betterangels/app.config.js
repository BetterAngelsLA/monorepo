const IS_PRODUCTION = process.env.APP_VARIANT === 'production';

const HOSTNAME = IS_PRODUCTION
  ? 'app.betterangels.la'
  : 'app.dev.betterangels.la';
const BUNDLE_IDENTIFIER = HOSTNAME.split('.').reverse().join('.');

export default {
  expo: {
    name: IS_PRODUCTION ? 'BetterAngels' : 'BetterAngels (Dev)',
    slug: 'betterangels',
    scheme: IS_PRODUCTION ? 'betterangels' : 'betterangels-dev',
    version: '1.0.14',
    orientation: 'portrait',
    icon: './src/app/assets/images/icon.png',
    splash: {
      image: './src/app/assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#1E3342',
    },
    updates: {
      fallbackToCacheTimeout: 0,
      url: 'https://u.expo.dev/53171ba4-60ca-40cb-b3e6-b0c2393677b8',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier: BUNDLE_IDENTIFIER,
      associatedDomains: [`applinks:${HOSTNAME}`],
      usesAppleSignIn: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './src/app/assets/images/adaptive-icon.png',
        backgroundColor: '#1E3342',
      },
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
          apiKey: process.env.EXPO_PUBLIC_GOOGLEMAPS_APIKEY,
        },
      },
    },
    web: {
      favicon: './src/app/assets/images/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      [
        'expo-dev-launcher',
        {
          launchMode: 'launcher',
        },
      ],
      'expo-apple-authentication',
      [
        '@config-plugins/detox',
        {
          skipProguard: false,
          subdomains: ['10.0.2.2', 'localhost'],
        },
      ],
      'expo-router',
      [
        'expo-image-picker',
        {
          photosPermission:
            'Allow access to photos to upload photos from your library.',
        },
      ],
      [
        'expo-camera',
        {
          cameraPermission: 'Allow $(PRODUCT_NAME) to access your camera.',
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'Allow $(PRODUCT_NAME) to use your location.',
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
    owner: 'better-angels',
    runtimeVersion: {
      policy: 'fingerprint',
    },
  },
};
