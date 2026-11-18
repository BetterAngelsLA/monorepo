import { useCallback } from 'react';
import { AppUpdatePromptModal } from '../AppUpdatePrompt';
import { useWebUpdateCheck } from './useWebUpdateCheck';

type TProps = {
  /** Build id compiled into this bundle; see `apps/betterangels/src/clientVersion.ts`. */
  ownBuildId?: string;
};

/**
 * Offers a reload when the deployment has moved on.
 *
 * A web build never reaches an open tab on its own: `expo-updates` has no OTA
 * channel in a browser, and nothing in the app reloads the page. Without this,
 * a caseworker who keeps the app in a tab runs whatever bundle they loaded —
 * potentially for weeks — which is what makes "the browser version is broken"
 * reports impossible to reconcile with a deploy that works.
 *
 * Reusing the native prompt rather than inventing a second dialog: the copy,
 * the icon and the two-button shape are already right, and a reload is the web
 * equivalent of accepting an OTA update.
 *
 * Cancelling hides it for this page load only. The staleness is still true, and
 * the next reload picks up the new bundle anyway; nagging someone mid-note
 * would be worse than letting them finish.
 */
export function WebUpdatePrompt(props: TProps) {
  const { ownBuildId } = props;

  const { updateAvailable, dismissed, dismiss } = useWebUpdateCheck(ownBuildId);

  const onAccept = useCallback(() => {
    // Full document load, not a router navigation: the point is to fetch the
    // new HTML and its chunks, which only a real reload does.
    window.location.reload();
  }, []);

  if (!updateAvailable || dismissed) return null;

  return (
    <AppUpdatePromptModal
      visible
      primaryButtonTitle="Reload"
      secondaryButtonTitle="Not now"
      setVisible={() => dismiss()}
      onAccept={onAccept}
      onDismiss={() => dismiss()}
    />
  );
}
