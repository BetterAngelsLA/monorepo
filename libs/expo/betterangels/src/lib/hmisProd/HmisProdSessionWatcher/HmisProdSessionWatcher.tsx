import { useHmisProdSessionWatch } from '../hooks';

/**
 * Renders nothing; force-signs the user out when their direct-HMIS session
 * stops working — either discovered by the foreground probe or reported by a
 * failed direct-HMIS request (see `useHmisProdSessionWatch`). Mounted by
 * `ClientsScreenHmisProd` (which only renders while the HMIS prod demo flag
 * is on), so a stale session is caught throughout the feature's lifetime —
 * the clients tab stays mounted beneath pushed screens and modals.
 */
export function HmisProdSessionWatcher(): null {
  useHmisProdSessionWatch();

  return null;
}
