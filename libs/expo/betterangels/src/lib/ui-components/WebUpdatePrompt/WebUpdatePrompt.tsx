import { useCallback } from 'react';
import { AppUpdatePromptModal } from '../AppUpdatePrompt';
import { useHasFocusedEditor } from './useHasFocusedEditor';
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
 * Reusing the native prompt rather than inventing a second dialog: the copy, the
 * icon and the two-button shape are already right, and a reload is the web
 * equivalent of accepting an OTA update.
 *
 * Two things keep it from being a nuisance rather than a help:
 * - it waits while the user is typing, because the modal would take focus out of
 *   a half-written note and its button throws that note away;
 * - a reload attempt suppresses it for a settling window (see `reloadGuard`), so
 *   it cannot become a loop.
 */
export function WebUpdatePrompt(props: TProps) {
  const { ownBuildId } = props;

  const { updateAvailable, dismissed, dismiss, noteReloadAttempt } =
    useWebUpdateCheck(ownBuildId);
  const isEditing = useHasFocusedEditor();

  const onAccept = useCallback(() => {
    // Recorded before navigating: `sessionStorage` survives the document load
    // this is about to perform, and that is exactly what stops the next mount
    // from offering the same reload again.
    noteReloadAttempt();

    // Full document load, not a router navigation: the point is to fetch the
    // new HTML and its chunks, which only a real reload does.
    window.location.reload();
  }, [noteReloadAttempt]);

  if (!updateAvailable || dismissed || isEditing) return null;

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
