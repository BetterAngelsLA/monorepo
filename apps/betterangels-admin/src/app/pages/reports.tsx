import { Reports } from '@monorepo/react/betterangels-admin';
import { googleMapsApiKey } from '../../../config';

export function ReportsPage() {
  // The map degrades to an explanatory panel without a key, rather than failing.
  return <Reports hasMapsKey={Boolean(googleMapsApiKey)} />;
}
