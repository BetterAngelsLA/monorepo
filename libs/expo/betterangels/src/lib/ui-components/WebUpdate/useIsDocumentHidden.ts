import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Whether the document is hidden.
 *
 * Web only: the whole notion of a backgrounded tab does not exist on native,
 * and this is used to decide when a reload can happen unseen.
 *
 * Starts `false` (visible) rather than reading `document` during render, so the
 * first paint is identical on every platform and SSR.
 */
export function useIsDocumentHidden(): boolean {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    const update = () => setHidden(document.visibilityState === 'hidden');

    update();
    document.addEventListener('visibilitychange', update);

    return () => document.removeEventListener('visibilitychange', update);
  }, []);

  return hidden;
}
