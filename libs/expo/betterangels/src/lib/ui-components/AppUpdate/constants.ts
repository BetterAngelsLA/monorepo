import { hoursToMilliseconds } from 'date-fns';

export const DO_NOT_REPEAT_INTERVAL_MS = hoursToMilliseconds(24 * 7); // 7 days
export const UPDATE_DISMISSED_TS_KEY = 'updateDismissedTsKey';
