import NewRelic from 'newrelic-react-native-agent';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export default function useNewRelic(version?: string, runtimeVersion?: string) {
  useEffect(() => {
    if (!version || !runtimeVersion) {
      return;
    }
    const appToken = process.env['EXPO_PUBLIC_NEW_RELIC_MOBILE_LICENSE_KEY'];

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
      logLevel: NewRelic.LogLevel.INFO,
      customAttributes: {
        env: process.env['EXPO_PUBLIC_APP_ENV'],
        version,
        runtimeVersion,
        platform: Platform.OS,
      },
    });

    NewRelic.setJSAppVersion(version);
  }, [version, runtimeVersion]);
}
