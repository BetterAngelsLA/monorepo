import { useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Whether the user is actively typing into something.
 *
 * The update prompt is a modal, so showing it mid-note takes focus out of the
 * field the caseworker is in and offers them a button that throws the form away.
 *
 * "Focused" alone is the wrong test: a textarea left focused while the user
 * alt-tabs away, or an input that iOS Safari never blurs when you tap the page
 * background, keeps `document.activeElement` on the field indefinitely — and the
 * prompt would then never appear at all, which is the outage this feature exists
 * to prevent. So deferral also requires *recent* keystrokes, and lapses on its
 * own when they stop.
 *
 * Web-only by construction — there is no `document` on native, and the native
 * update path is a different prompt.
 */
export const TYPING_IDLE_MS = 30_000;

/** How often the idle check re-evaluates while something is focused. */
const IDLE_POLL_MS = 5_000;

/**
 * Text entry, not merely focus. A checkbox, radio or `<select>` keeps focus
 * after it is used and none of them is a place a modal would interrupt.
 */
const TEXT_INPUT_TYPES = new Set([
  '',
  'text',
  'search',
  'email',
  'password',
  'number',
  'tel',
  'url',
]);

export const isEditableElement = (element: Element | null): boolean => {
  if (!element) return false;

  const tag = element.tagName;

  if (tag === 'TEXTAREA') return true;

  if (tag === 'INPUT') {
    const type = (element as HTMLInputElement).type?.toLowerCase() ?? '';

    return TEXT_INPUT_TYPES.has(type);
  }

  return (element as HTMLElement).isContentEditable === true;
};

/**
 * The decision, split out so it can be tested without a DOM.
 *
 * `lastActivityAt` is null when nothing editable is focused.
 */
export const isActivelyEditing = (
  lastActivityAt: number | null,
  now: number,
  idleMs: number = TYPING_IDLE_MS,
): boolean => {
  if (lastActivityAt === null) return false;

  const elapsed = now - lastActivityAt;

  return elapsed >= 0 && elapsed < idleMs;
};

export function useHasFocusedEditor(): boolean {
  const [isEditing, setIsEditing] = useState(false);
  // A ref, not state: this is bookkeeping for the timer, and putting it in state
  // would re-render on every keystroke for no visual change.
  const lastActivityRef = useRef(0);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const noteActivity = () => {
      lastActivityRef.current = Date.now();
      setIsEditing(true);
    };

    const onFocusChange = () => {
      if (isEditableElement(document.activeElement)) noteActivity();
      else setIsEditing(false);
    };

    const onActivity = () => {
      if (isEditableElement(document.activeElement)) noteActivity();
    };

    // `focusin`/`focusout` bubble, so one listener each covers the whole tree.
    document.addEventListener('focusin', onFocusChange);
    document.addEventListener('focusout', onFocusChange);
    document.addEventListener('input', onActivity);
    document.addEventListener('keydown', onActivity);

    // Without this the deferral would never lapse while a field holds focus —
    // the alt-tabbed-textarea case. The clock is read here, in a timer, not
    // during render.
    const interval = setInterval(() => {
      if (!isActivelyEditing(lastActivityRef.current, Date.now())) {
        setIsEditing(false);
      }
    }, IDLE_POLL_MS);

    onFocusChange();

    return () => {
      document.removeEventListener('focusin', onFocusChange);
      document.removeEventListener('focusout', onFocusChange);
      document.removeEventListener('input', onActivity);
      document.removeEventListener('keydown', onActivity);
      clearInterval(interval);
    };
  }, []);

  return isEditing;
}
