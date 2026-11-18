import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppUpdatePromptModal } from '../AppUpdatePrompt';
import { useHasFocusedEditor } from './useHasFocusedEditor';
import { useIsDocumentHidden } from './useIsDocumentHidden';
import { useWebUpdateCheck } from './useWebUpdateCheck';
import {
  PROMPT_AFTER_STALE_MS,
  shouldApplySilently,
  shouldPrompt,
} from './webUpdatePolicy';

type TProps = {
  /** Build id compiled into this bundle; see `apps/betterangels/src/clientVersion.ts`. */
  ownBuildId?: string;
};

/**
 * Keeps an open web tab on the deployed build, without asking.
 *
 * A web build never reaches an open tab on its own — `expo-updates` has no OTA
 * channel in a browser and nothing reloads the page — so a caseworker who keeps
 * the app in a tab runs whatever bundle they loaded, potentially for weeks.
 *
 * The update is applied while the tab is hidden, so it is invisible: the user
 * returns to the same URL, freshly loaded. Reloading under someone's cursor is
 * not acceptable, and neither is reloading while they are mid-note, which is why
 * the decision is not "is the tab hidden" alone (see `webUpdatePolicy`).
 *
 * The dialog is a fallback for a tab that is never hidden. It appears only after
 * the build has been stale for a while, so the common case is silent.
 */
export function WebUpdateManager(props: TProps) {
  const { ownBuildId } = props;

  const {
    updateAvailable,
    staleSince,
    dismissed,
    dismiss,
    noteReloadAttempt,
    guardActive,
    check,
  } = useWebUpdateCheck(ownBuildId);
  const isEditing = useHasFocusedEditor();
  const hidden = useIsDocumentHidden();

  // A timer, not `Date.now()` during render: the prompt becomes due on a clock,
  // and render has to stay pure.
  const [promptDue, setPromptDue] = useState(false);

  useEffect(() => {
    if (staleSince === null) {
      setPromptDue(false);

      return;
    }

    const remaining = PROMPT_AFTER_STALE_MS - (Date.now() - staleSince);

    if (remaining <= 0) {
      setPromptDue(true);

      return;
    }

    const timer = setTimeout(() => setPromptDue(true), remaining);

    return () => clearTimeout(timer);
  }, [staleSince]);

  const signals = useMemo(
    () => ({
      stale: updateAvailable,
      hidden,
      editing: isEditing,
      guardActive: guardActive(),
      promptDue,
      dismissed,
    }),
    [updateAvailable, hidden, isEditing, guardActive, promptDue, dismissed],
  );

  const applyUpdate = useCallback(() => {
    // Recorded before navigating: `sessionStorage` survives the document load
    // this is about to perform, and that is what stops the next mount from
    // reloading again while the edge is still serving the old HTML.
    noteReloadAttempt();

    window.location.reload();
  }, [noteReloadAttempt]);

  // Silent path: nobody is looking.
  useEffect(() => {
    if (shouldApplySilently(signals)) applyUpdate();
  }, [signals, applyUpdate]);

  // A tab coming back into view may have missed the silent path while the edge
  // was still propagating; check then, rather than waiting out the poll.
  const wasHiddenRef = useRef(false);

  useEffect(() => {
    if (wasHiddenRef.current && !hidden) void check();

    wasHiddenRef.current = hidden;
  }, [hidden, check]);

  if (!shouldPrompt(signals)) return null;

  return (
    <AppUpdatePromptModal
      visible
      primaryButtonTitle="Reload"
      secondaryButtonTitle="Not now"
      setVisible={() => dismiss()}
      onAccept={applyUpdate}
      onDismiss={() => dismiss()}
    />
  );
}
