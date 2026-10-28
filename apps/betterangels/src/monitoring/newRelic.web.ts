import { BrowserAgent } from '@newrelic/browser-agent/loaders/browser-agent';
import Constants from 'expo-constants';
import { browserPrivacyRules } from './privacy';

const licenseKey = process.env.EXPO_PUBLIC_NEW_RELIC_WEB_LICENSE_KEY;
const environment = process.env.EXPO_PUBLIC_APP_ENV;
const appVersion = Constants.expoConfig?.version ?? 'unknown';
const monitoringGlobal = globalThis as typeof globalThis & {
  outreachBrowserAgent?: BrowserAgent;
};

// Static exports run in Node. Missing configuration leaves monitoring disabled.
// Retain the instance across Fast Refresh to avoid duplicate instrumentation.
if (
  typeof window !== 'undefined' &&
  licenseKey &&
  environment &&
  !monitoringGlobal.outreachBrowserAgent
) {
  monitoringGlobal.outreachBrowserAgent = new BrowserAgent({
    info: {
      applicationID: '601687499',
      beacon: 'bam.nr-data.net',
      errorBeacon: 'bam.nr-data.net',
      licenseKey,
      sa: 1,
      jsAttributes: {
        environment,
        appVersion,
        platform: 'web',
      },
    },
    loader_config: {
      accountID: '4017518',
      agentID: '601687499',
      applicationID: '601687499',
      licenseKey,
      trustKey: '4017518',
    },
    init: {
      ajax: { deny_list: ['bam.nr-data.net'], capture_payloads: 'none' },
      browser_consent_mode: { enabled: false },
      distributed_tracing: { enabled: true },
      performance: {
        capture_detail: false,
        capture_marks: false,
        capture_measures: false,
      },
      privacy: { cookies_enabled: true },
      session_replay: { enabled: false },
      session_trace: { enabled: false },
      logging: { enabled: false },
      user_actions: { enabled: false },
      obfuscate: browserPrivacyRules(environment, appVersion),
    },
  });
}
