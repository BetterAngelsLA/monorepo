import { APIProvider as MapsApiProvider } from '@vis.gl/react-google-maps';
import { Reports } from '@monorepo/react/betterangels-admin';
import { googleMapsApiKey } from '../../../config';

/** Module scope, so the provider sees one identity and does not reload the script per render. */
function onMapsProviderError(error: unknown) {
  console.error(`[admin] MapsApiProvider error: ${error}`);
}

export function ReportsPage() {
  // The provider is mounted here rather than around the whole app: it loads the Maps JS API on
  // mount, and no other route draws a map. Mounting it without a key would request the script
  // with an empty key and log the failure on every page, which is the opposite of the panel's
  // stated behaviour — the map degrades to an explanatory message instead.
  if (!googleMapsApiKey) {
    return <Reports hasMapsKey={false} />;
  }

  return (
    <MapsApiProvider apiKey={googleMapsApiKey} onError={onMapsProviderError}>
      <Reports hasMapsKey />
    </MapsApiProvider>
  );
}
