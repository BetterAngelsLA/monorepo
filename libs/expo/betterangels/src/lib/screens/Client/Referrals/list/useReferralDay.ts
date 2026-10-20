import { useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import { localReferralDay } from '../shared/referralPresentation';

/**
 * One shared "today" for every card on screen.
 *
 * Each card used to own a midnight timer and an AppState listener, so a
 * paginated list ran dozens of identical timers. The value is the same for all
 * of them, so it lives in one module-level store: the first subscriber starts
 * the timer, the last one stops it.
 */
let currentDay = localReferralDay();
let timer: ReturnType<typeof setTimeout> | undefined;
let subscription: { remove(): void } | undefined;
const listeners = new Set<() => void>();

function scheduleMidnight() {
  if (timer) clearTimeout(timer);
  const now = new Date();
  const midnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
  );
  timer = setTimeout(refresh, midnight.getTime() - now.getTime() + 100);
}

function refresh() {
  const next = localReferralDay();
  if (next !== currentDay) {
    currentDay = next;
    listeners.forEach((listener) => listener());
  }
  scheduleMidnight();
}

function subscribe(listener: () => void) {
  const isFirst = listeners.size === 0;
  listeners.add(listener);

  if (isFirst) {
    const next = localReferralDay();
    const changed = next !== currentDay;
    currentDay = next;
    scheduleMidnight();
    subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    // The module may have been loaded on a different day than the one this
    // first subscriber is rendering with; let React re-read the snapshot.
    if (changed)
      queueMicrotask(() => {
        if (listeners.has(listener)) listener();
      });
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      if (timer) clearTimeout(timer);
      timer = undefined;
      subscription?.remove();
      subscription = undefined;
    }
  };
}

const getSnapshot = () => currentDay;

/** Refresh at local midnight and after backgrounding. */
export function useReferralDay() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
