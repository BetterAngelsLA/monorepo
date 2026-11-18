import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Whether the user is currently typing into something.
 *
 * The update prompt is a modal, so showing it mid-note takes focus out of the
 * field the caseworker is in and offers them a button that throws the form away.
 * Deferring until nothing is focused costs nothing: the staleness does not get
 * worse, and the prompt appears as soon as they finish.
 *
 * Web-only by construction — there is no `document` on native, and the native
 * update path is a different prompt.
 */
const isEditableElement = (element: Element | null): boolean => {
  if (!element) return false;

  const tag = element.tagName;

  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;

  return (element as HTMLElement).isContentEditable === true;
};

export function useHasFocusedEditor(): boolean {
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const update = () => setIsEditing(isEditableElement(document.activeElement));

    // `focusin`/`focusout` bubble, so one listener each covers the whole tree.
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    update();

    return () => {
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
    };
  }, []);

  return isEditing;
}
