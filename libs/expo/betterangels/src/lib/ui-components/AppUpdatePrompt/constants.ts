import { minutesToMilliseconds } from 'date-fns';

// Extra safety check to avoid any rate limiting.
// TODO: increase threshold after testing
export const MIN_UPDATE_CHECK_INTERVAL_MS = minutesToMilliseconds(1);

// Interval to prevent showing update prompt for a period after user dismisses it.
// TODO: increase threshold after testing
export const DO_NOT_REPEAT_INTERVAL_MS = minutesToMilliseconds(5);

// storage keys
export const UPDATE_DISMISSED_TS_KEY = 'updateDismissedTsKey';
export const LAST_UPDATE_CHECK_TS_KEY = 'lastUpdateCheckTsKey';
