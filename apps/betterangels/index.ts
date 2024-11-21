import 'expo-router/entry';

// Initialize New Relic
import { runtimeVersion, updateId } from 'expo-updates';
import NewRelic from 'newrelic-react-native-agent';
import { newRelicAppToken } from './config';

const agentConfiguration = {
  // Android Specific
  // Optional:Enable or disable collection of event data.
  analyticsEventEnabled: true,

  // Optional:Enable or disable crash reporting.
  crashReportingEnabled: true,

  // Optional:Enable or disable interaction tracing. Trace instrumentation still occurs, but no traces are harvested.
  // This will disable default and custom interactions.
  interactionTracingEnabled: true,

  // Optional:Enable or disable reporting successful HTTP requests to the MobileRequest event type.
  networkRequestEnabled: true,

  // Optional:Enable or disable reporting network and HTTP request errors to the MobileRequestError event type.
  networkErrorRequestEnabled: true,

  // Optional:Enable or disable capture of HTTP response bodies for HTTP error traces, and MobileRequestError events.
  httpRequestBodyCaptureEnabled: true,

  // Optional:Enable or disable agent logging.
  loggingEnabled: true,

  // Optional:Specifies the log level. Omit this field for the default log level.
  // Options include: ERROR (least verbose), WARNING, INFO, VERBOSE, AUDIT (most verbose).
  logLevel: NewRelic.LogLevel.INFO,

  // iOS Specific
  // Optional:Enable/Disable automatic instrumentation of WebViews
  webViewInstrumentation: true,

  // Optional:Set a specific collector address for sending data. Omit this field for default address.
  collectorAddress: '',

  // Optional:Set a specific crash collector address for sending crashes. Omit this field for default address.
  crashCollectorAddress: '',

  // Optional:Enable or disable reporting data using different endpoints for US government clients
  fedRampEnabled: false,

  // Optional: Enable or disable offline data storage when no internet connection is available.
  offlineStorageEnabled: true,

  // iOS Specific
  // Optional: Enable or disable Background Reporting.
  backgroundReportingEnabled: false,

  // iOS Specific
  // Optional: Enable or disable to use our new, more stable event system for iOS agent.
  newEventSystemEnabled: false,
};

NewRelic.startAgent(newRelicAppToken, agentConfiguration);
NewRelic.setJSAppVersion(runtimeVersion || 'unknown');
NewRelic.setAttribute('easUpdateId', updateId || 'no-update-id');
