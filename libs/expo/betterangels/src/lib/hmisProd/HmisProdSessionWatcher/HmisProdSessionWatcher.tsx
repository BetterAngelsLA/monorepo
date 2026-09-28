import { useHmisProdSessionWatch } from '../hooks';

/**
 * Renders nothing; force-signs the user out when their direct-HMIS session
 * stops working — see `useHmisProdSessionWatch`. Mounted by
 * `ClientsScreenHmisProd` (which only renders while the HMIS prod demo flag
 * is on), so a stale session is caught on foreground transitions throughout
 * the feature's lifetime — the clients tab stays mounted beneath pushed
 * screens and modals.
 */
export function HmisProdSessionWatcher(): null {
  useHmisProdSessionWatch();

  return null;
}
