/**
 * When a stale tab should update itself, and when it should ask.
 *
 * The default is silence: a deploy reaches a tab by reloading it, and the least
 * disruptive moment to do that is while nobody is looking. Reloading on
 * `visibilitychange` to hidden is the pattern that makes an update invisible —
 * the tab is re-read when it is brought back, at the URL the user left.
 *
 * Three cases make a silent reload the wrong choice, and they are what the
 * predicates below encode:
 *
 * - the user is editing. A reload discards an unsaved note, and a tab switch
 *   does not blur a focused field, so "hidden" alone is not evidence that nobody
 *   is mid-sentence;
 * - a reload was just attempted for this deployment (see `reloadGuard`) — the
 *   edge may still be serving the old HTML, and reloading again is a loop;
 * - the tab is visible. Reloading under someone's cursor is exactly the
 *   behaviour that makes in-app update prompts untrustworthy.
 *
 * A tab that is never hidden is the remaining gap. For it the prompt is a
 * fallback, offered only after the build has been stale long enough that the
 * interruption is worth it.
 */

/** How long a visible, stale tab runs before it is offered a reload. */
export const PROMPT_AFTER_STALE_MS = 30 * 60 * 1000;

export type TUpdateSignals = {
  /** The running build is behind the deployment. */
  stale: boolean;
  /** The document is hidden — the user is not looking at this tab. */
  hidden: boolean;
  /** An editable element has focus (see `useHasFocusedEditor`). */
  editing: boolean;
  /** A reload was already attempted for this deployment, recently. */
  guardActive: boolean;
};

/** Reload now, without asking: hidden, not mid-edit, not already tried. */
export const shouldApplySilently = (signals: TUpdateSignals): boolean =>
  signals.stale && signals.hidden && !signals.editing && !signals.guardActive;

/**
 * Ask the user: still stale and visible once the wait has elapsed, and not
 * mid-edit.
 *
 * `promptDue` is managed by a timer in the component rather than computed from
 * `Date.now()` during render, which would be impure. `dismissed` is the user's
 * "not now" for this page load; the poll re-arms it, so a dismissal buys one
 * poll interval rather than the tab's lifetime.
 */
export const shouldPrompt = (
  signals: TUpdateSignals & { promptDue: boolean; dismissed: boolean },
): boolean =>
  signals.stale &&
  !signals.hidden &&
  !signals.editing &&
  !signals.dismissed &&
  !signals.guardActive &&
  signals.promptDue;
