/**
 * Web build of {@link useNewRelic}. `newrelic-react-native-agent` has no web
 * build — its agent is a native TurboModule — so there is no crash/analytics
 * agent on web. Adding one means the New Relic *Browser* agent (its own license
 * key, a document-level script), which is separate work.
 */
export default function useNewRelic(): void {
  // Intentionally empty on web.
}
