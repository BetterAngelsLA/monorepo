import { initBrowserMonitoring } from '@monorepo/monitoring';
import Constants from 'expo-constants';
import { browserPrivacyRules } from './privacy';

export function initMonitoring(): void {
  const licenseKey = process.env.EXPO_PUBLIC_NEW_RELIC_WEB_LICENSE_KEY;
  const environment = process.env.EXPO_PUBLIC_APP_ENV;
  const appVersion = Constants.expoConfig?.version ?? 'unknown';

  if (!licenseKey || !environment) return;

  initBrowserMonitoring({
    applicationID: '601687499',
    accountID: '4017518',
    trustKey: '4017518',
    licenseKey,
    environment,
    appVersion,
    privacyRules: browserPrivacyRules(environment, appVersion),
  });
}
