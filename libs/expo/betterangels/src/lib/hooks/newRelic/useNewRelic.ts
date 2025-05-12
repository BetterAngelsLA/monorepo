import * as Updates from 'expo-updates';
import NewRelic from 'newrelic-react-native-agent';
import { useEffect } from 'react';
import { Platform } from 'react-native';

const logLevelMap = {
  ERROR: NewRelic.LogLevel.ERROR,
  WARN: NewRelic.LogLevel.WARN,
  INFO: NewRelic.LogLevel.INFO,
  DEBUG: NewRelic.LogLevel.DEBUG,
};

export default function useNewRelic(version?: string, runtimeVersion?: string) {
  useEffect(() => {
    if (!version || !runtimeVersion) return;

    const platformKey = `EXPO_PUBLIC_NEW_RELIC_MOBILE_LICENSE_KEY_${Platform.OS.toUpperCase()}`;
    const appToken = process.env[platformKey];

    if (!appToken) {
      console.warn('New Relic not initialized: missing mobile license key');
      return;
    }

    const envLogLevel = process.env[
      'EXPO_PUBLIC_NEW_RELIC_LOG_LEVEL'
    ] as keyof typeof logLevelMap;
    const logLevel = logLevelMap[envLogLevel] ?? NewRelic.LogLevel.DEBUG;

    const combinedVersion = Updates.updateId
      ? `${version}-${Updates.updateId}`
      : version;

    NewRelic.startAgent(appToken, {
      crashReportingEnabled: true,
      networkRequestEnabled: true,
      interactionTracingEnabled: true,
      analyticsEventEnabled: true,
      loggingEnabled: true,
      logLevel,
      customAttributes: {
        env: process.env['EXPO_PUBLIC_APP_ENV'],
        version,
        runtimeVersion,
        platform: Platform.OS,
        ...(Updates.updateId && { otaUpdateId: Updates.updateId }),
        ...(Updates.channel && { channel: Updates.channel }),
      },
    });

    NewRelic.setJSAppVersion(combinedVersion);
  }, [version, runtimeVersion]);
}
