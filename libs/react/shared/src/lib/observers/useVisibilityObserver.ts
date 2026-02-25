// libs/react/shared/src/lib/observers/useVisibilityObserver.ts

import { useEffect, useRef } from 'react';

export type VisibilityObserverOptions = {
  onTrigger: () => void;
  enabled?: boolean;
  root?: Element | null;
  rootMargin?: string;
  threshold?: number;
};

export function useVisibilityObserver(options: VisibilityObserverOptions) {
  const {
    onTrigger,
    enabled = true,
    root = null,
    rootMargin = '200px',
    threshold = 0,
  } = options;

  const triggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const element = triggerRef.current;

    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];

        if (!entry.isIntersecting) {
          return;
        }

        onTrigger();
      },
      {
        root,
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [enabled, onTrigger, root, rootMargin, threshold]);

  return {
    triggerRef,
  };
}
