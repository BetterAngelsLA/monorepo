import { BrowserAgent } from '@newrelic/browser-agent/loaders/browser-agent';
import { browserPrivacyRules } from './privacy';

const licenseKey = import.meta.env.VITE_SHELTER_WEB_NEW_RELIC_LICENSE_KEY;
const environment = import.meta.env.VITE_SHELTER_APP_ENV;
const appVersion = import.meta.env.VITE_SHELTER_APP_VERSION || 'local';
// Public Browser application identity from New Relic's generated NPM snippet.
const applicationID = '601689920';
const accountID = '4017518';
const trustKey = '4017518';
const monitoringGlobal = globalThis as typeof globalThis & {
  shelterBrowserAgent?: BrowserAgent;
};

// Tests may run in Node. Missing configuration leaves monitoring disabled.
// Retain the instance across Vite hot reload to avoid duplicate instrumentation.
if (
  typeof window !== 'undefined' &&
  licenseKey &&
  environment &&
  !monitoringGlobal.shelterBrowserAgent
) {
  monitoringGlobal.shelterBrowserAgent = new BrowserAgent({
    info: {
      applicationID,
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
      accountID,
      agentID: applicationID,
      applicationID,
      licenseKey,
      trustKey,
    },
    init: {
      ajax: { deny_list: ['bam.nr-data.net'], capture_payloads: 'none' },
      // Off until the API approves the trace headers. The web app calls the API
      // cross-origin, where the agent adds no tracing headers unless the origin
      // is approved in New Relic AND the API allows `traceparent`/`tracestate`/
      // `newrelic` in CORS_ALLOW_HEADERS. Enabling only one side breaks requests.
      distributed_tracing: { enabled: false },
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
