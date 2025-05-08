import * as Updates from 'expo-updates';
import NewRelic from 'newrelic-react-native-agent';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function useNewRelic(version?: string, runtimeVersion?: string) {
  useEffect(() => {
    if (!version || !runtimeVersion) {
      return;
    }
    const appToken =
      Platform.OS === 'ios'
        ? process.env['EXPO_PUBLIC_NEW_RELIC_MOBILE_LICENSE_KEY_IOS']
        : process.env['EXPO_PUBLIC_NEW_RELIC_MOBILE_LICENSE_KEY_ANDROID'];

    if (!appToken) {
      console.warn('New Relic not initialized: missing mobile license key');
      return;
    }

    NewRelic.startAgent(appToken, {
      crashReportingEnabled: true,
      networkRequestEnabled: true,
      interactionTracingEnabled: true,
      analyticsEventEnabled: true,
      loggingEnabled: true,
      logLevel:
        process.env['EXPO_PUBLIC_APP_ENV'] === 'production'
          ? NewRelic.LogLevel.WARN
          : NewRelic.LogLevel.INFO,
      customAttributes: {
        env: process.env['EXPO_PUBLIC_APP_ENV'],
        version,
        runtimeVersion,
        platform: Platform.OS,
        otaUpdateId: Updates.updateId ?? 'none',
      },
    });

    NewRelic.setJSAppVersion(version);
  }, [version, runtimeVersion]);
}
