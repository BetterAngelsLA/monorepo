const fs = require('fs');
const env = process.argv[2] || 'dev';

require('dotenv').config({ path: `${env}.env` });

const appConfig = {
  expo: {
    name: env === 'dev' ? 'BetterAngels-dev' : 'BetterAngels',
    slug: env === 'dev' ? 'betterangels-dev' : 'betterangels',
    scheme: env === 'dev' ? 'betterangels-dev' : 'betterangels',
    version: env === 'dev' ? '1.0.14' : '1.0.0',
    orientation: 'portrait',
    icon: './src/app/assets/images/icon.png',
    splash: {
      image: './src/app/assets/images/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#1E3342',
    },
    assetBundlePatterns: ['**/*'],
    ios: {
      supportsTablet: true,
      bundleIdentifier:
        env === 'dev' ? 'la.dev.betterangels.app' : 'la.betterangels.app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './src/app/assets/images/adaptive-icon.png',
        backgroundColor: '#1E3342',
      },
      package: env === 'dev' ? 'la.betterangels.app' : 'la.betterangels.app',
    },
    web: {
      favicon: './src/app/assets/images/favicon.png',
      bundler: 'metro',
    },
    plugins: [
      [
        '@config-plugins/detox',
        {
          skipProguard: false,
          subdomains: ['10.0.2.2', 'localhost'],
        },
      ],
      'expo-router',
    ],
    extra: {
      router: {
        origin: false,
      },
      eas: {
        projectId: env === 'dev' ? '53171ba4-60ca-40cb-b3e6-b0c2393677b8' : '',
      },
    },
    owner: 'better-angels',
    runtimeVersion: {
      policy: 'appVersion',
    },
  },
};

const easConfig = {
  build: {
    production: {
      android: {
        buildType: 'app-bundle',
      },
      env: {
        EXPO_PUBLIC_API_URL:
          env === 'dev'
            ? 'https://api.dev.betterangels.la'
            : 'https://api.betterangels.la',
        EXPO_PUBLIC_CLIENT_ID:
          env === 'dev'
            ? '1066399826613-bu41lbb5ha9fpgen895kic4bgebkn223.apps.googleusercontent.com'
            : '',
        EXPO_PUBLIC_REDIRECT_URL:
          env === 'dev'
            ? 'https://api.dev.betterangels.la/auth-redirect'
            : 'https://api.betterangels.la/auth-redirect',
      },
    },
  },
  submit: {
    production: {},
  },
  cli: {
    version: '~5.0.0',
  },
};

fs.writeFileSync('app.json', JSON.stringify(appConfig, null, 2));
fs.writeFileSync('eas.json', JSON.stringify(easConfig, null, 2));
