/**
 * Web build of {@link useNewRelic}. `newrelic-react-native-agent` has no web
 * build — its agent is a native TurboModule. The Browser agent is initialized
 * before the router in apps/betterangels/src/monitoring/newRelic.web.ts.
 */
export default function useNewRelic(): void {
  // Intentionally empty on web.
}
