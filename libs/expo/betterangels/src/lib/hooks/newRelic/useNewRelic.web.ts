/**
 * Web build of {@link useNewRelic}.
 *
 * `newrelic-react-native-agent` has no web build: its agent is a native
 * TurboModule, and react-native-web sets no `__turboModuleProxy`, so the
 * package's wrapper takes its non-Turbo branch and resolves `NRMModularAgent` to
 * `NativeModules.NRMModularAgent` — `undefined` in a browser. Starting the agent
 * there cannot do anything but fail, and the package ships no browser agent to
 * substitute.
 *
 * Web currently has no crash/analytics agent. Adding one means the New Relic
 * *Browser* agent (its own license key and a script injection at the document
 * level), which is a separate piece of work — see `docs/outreach-web.md`.
 */
export default function useNewRelic(): void {
  // Intentionally empty on web.
}
