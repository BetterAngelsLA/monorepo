import { BrowserAgent } from '@newrelic/browser-agent/loaders/browser-agent';
import type { BrowserPrivacyRule } from './privacy';

export type BrowserMonitoringConfig = {
  applicationID: string;
  accountID: string;
  trustKey: string;
  licenseKey?: string;
  environment?: string;
  appVersion: string;
  privacyRules: BrowserPrivacyRule[];
};

type MonitoringGlobal = typeof globalThis & {
  __browserAgent?: BrowserAgent;
};

/**
 * Creates the shared New Relic Browser agent. App-specific identity, env and
 * privacy rules are passed in; everything else is kept consistent between apps.
 * Missing configuration leaves monitoring disabled, and init errors never
 * prevent the app from starting.
 */
export function initBrowserMonitoring(
  config: BrowserMonitoringConfig,
): BrowserAgent | undefined {
  if (
    typeof window === 'undefined' ||
    !config.licenseKey ||
    !config.environment
  ) {
    return undefined;
  }

  const monitoringGlobal = globalThis as MonitoringGlobal;
  if (monitoringGlobal.__browserAgent) return monitoringGlobal.__browserAgent;

  try {
    const agent = new BrowserAgent({
      info: {
        applicationID: config.applicationID,
        beacon: 'bam.nr-data.net',
        errorBeacon: 'bam.nr-data.net',
        licenseKey: config.licenseKey,
        sa: 1,
        jsAttributes: {
          environment: config.environment,
          appVersion: config.appVersion,
          platform: 'web',
        },
      },
      loader_config: {
        accountID: config.accountID,
        agentID: config.applicationID,
        applicationID: config.applicationID,
        licenseKey: config.licenseKey,
        trustKey: config.trustKey,
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
        obfuscate: config.privacyRules,
      },
    });
    monitoringGlobal.__browserAgent = agent;
    return agent;
  } catch (error) {
    console.warn('[monitoring] Browser agent initialization failed', error);
    return undefined;
  }
}
