import * as Updates from 'expo-updates';
import NewRelic from 'newrelic-react-native-agent';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import useAppVersion from '../expoUpdates/useAppVersion';

const logLevelMap = {
  ERROR: NewRelic.LogLevel.ERROR,
  WARN: NewRelic.LogLevel.WARN,
  INFO: NewRelic.LogLevel.INFO,
  DEBUG: NewRelic.LogLevel.DEBUG,
};

export default function useNewRelic() {
  const { version, runtimeVersion, otaUpdateId, otaUpdateIdShort } =
    useAppVersion();

  useEffect(() => {
    if (!version || !runtimeVersion) return;

    const appToken =
      Platform.OS === 'ios'
        ? process.env['EXPO_PUBLIC_NEW_RELIC_MOBILE_LICENSE_KEY_IOS']
        : process.env['EXPO_PUBLIC_NEW_RELIC_MOBILE_LICENSE_KEY_ANDROID'];

    if (!appToken) {
      console.warn('New Relic not initialized: missing mobile license key');
      return;
    }

    const envLogLevel = process.env[
      'EXPO_PUBLIC_NEW_RELIC_LOG_LEVEL'
    ] as keyof typeof logLevelMap;
    const logLevel = logLevelMap[envLogLevel] ?? NewRelic.LogLevel.DEBUG;

    const combinedVersion = `${version}-${otaUpdateIdShort}`;

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
        ...(otaUpdateId && { otaUpdateId }),
        ...(Updates.channel && { channel: Updates.channel }),
      },
    });

    NewRelic.setJSAppVersion(combinedVersion);
  }, [version, runtimeVersion, otaUpdateId, otaUpdateIdShort]);
}
