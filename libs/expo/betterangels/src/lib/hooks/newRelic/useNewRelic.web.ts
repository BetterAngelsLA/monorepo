/**
 * Web build of {@link useNewRelic}.
 *
 * `newrelic-react-native-agent` is a native TurboModule — it calls
 * `TurboModuleRegistry.getEnforcing('NRMModularAgent')` at import time, which
 * throws in a browser before React ever renders. There is no web equivalent in
 * that package.
 *
 * Web currently has no crash/analytics agent. Adding one means the New Relic
 * *Browser* agent (its own license key and a script injection at the document
 * level), which is a separate piece of work — see `docs/outreach-web.md`.
 */
export default function useNewRelic(): void {
  // Intentionally empty on web.
}
