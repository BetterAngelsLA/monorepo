import { initBrowserMonitoring } from '@monorepo/monitoring';
import { browserPrivacyRules } from './privacy';

const licenseKey = import.meta.env.VITE_SHELTER_WEB_NEW_RELIC_LICENSE_KEY;
const environment = import.meta.env.VITE_APP_ENV;
const appVersion = import.meta.env.VITE_APP_VERSION || 'local';

if (licenseKey && environment) {
  initBrowserMonitoring({
    // Public Browser application identity from New Relic's generated NPM snippet.
    applicationID: '601689920',
    accountID: '4017518',
    trustKey: '4017518',
    licenseKey,
    environment,
    appVersion,
    commit: appVersion,
    privacyRules: browserPrivacyRules(environment, appVersion),
  });
}
