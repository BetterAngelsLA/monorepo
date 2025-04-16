import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  DO_NOT_REPEAT_INTERVAL_MS,
  LAST_UPDATE_CHECK_TS_KEY,
  MIN_UPDATE_CHECK_INTERVAL_MS,
  UPDATE_DISMISSED_TS_KEY,
} from './constants';

export async function canShowPromptAgain() {
  const minUpdateCheck = await passedTimeThreshold(
    LAST_UPDATE_CHECK_TS_KEY,
    MIN_UPDATE_CHECK_INTERVAL_MS
  );

  if (!minUpdateCheck) {
    return false;
  }

  const updateDismissedCheck = await passedTimeThreshold(
    UPDATE_DISMISSED_TS_KEY,
    DO_NOT_REPEAT_INTERVAL_MS
  );

  return updateDismissedCheck;
}

async function passedTimeThreshold(
  storageKey: string,
  timeThresholdMs: number
) {
  const timestamp = await AsyncStorage.getItem(storageKey);

  // data not set
  if (!timestamp) {
    return true;
  }

  const timestampInt = Number(timestamp);

  // if isNaN, something is wrong and return false.
  if (isNaN(timestampInt)) {
    console.error(`[AppUpdate] invalid ${storageKey}: [${timestamp}].`);

    return false;
  }

  const timeDiff = Date.now() - timestampInt;

  return timeDiff > timeThresholdMs;
}
