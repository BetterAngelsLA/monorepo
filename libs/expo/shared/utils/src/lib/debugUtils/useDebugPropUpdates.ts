/**
 * Debug-only hook that logs prop changes between renders.
 *
 * For each changed prop it prints:
 *   - previous value
 *   - next value
 *   - whether the change was "identity-only" (deep-equal but new reference)
 *     or "value-changed" (actual semantic difference).
 *
 * Notes:
 *   - Uses JSON.stringify() for deep equality, so it is best suited for
 *     plain JSON-like data (objects, arrays, primitives).
 *   - Should not be left in production builds.
 *   - Intended as a temporary debugging tool for tracking unexpected re-renders
 *     or unstable props.
 */

import { useEffect, useRef } from 'react';

function safeJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

const isDev =
  (typeof __DEV__ !== 'undefined' && __DEV__) ||
  (typeof process !== 'undefined' &&
    process.env &&
    process.env.NODE_ENV !== 'production');

export function useDebugPropUpdates(
  componentName: string,
  props: Record<string, unknown>
): void {
  const previousPropsRef = useRef<Record<string, any> | null>(null);

  console.info('[debug] running debug util: useDebugPropUpdates');

  useEffect(() => {
    if (!isDev) {
      return;
    }

    if (previousPropsRef.current === null) {
      previousPropsRef.current = props;
      return;
    }

    const previous = previousPropsRef.current;
    const changed: Record<
      string,
      {
        previous: any;
        next: any;
        deepEqual: boolean;
        reason: 'value-changed' | 'identity-only';
      }
    > = {};

    for (const key of Object.keys(props)) {
      const prev = previous[key];
      const next = props[key];

      if (prev === next) {
        continue;
      }

      const prevJson = safeJson(prev);
      const nextJson = safeJson(next);
      const deepEqual = prevJson === nextJson;

      changed[key] = {
        previous: prev,
        next,
        deepEqual,
        reason: deepEqual ? 'identity-only' : 'value-changed',
      };
    }

    if (Object.keys(changed).length > 0) {
      console.log(`[useDebugPropUpdates::${componentName}]`, changed);
    }

    previousPropsRef.current = props;
  }, [componentName, props]);
}
