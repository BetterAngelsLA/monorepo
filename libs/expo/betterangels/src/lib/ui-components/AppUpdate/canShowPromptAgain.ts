import AsyncStorage from '@react-native-async-storage/async-storage';
import { DO_NOT_REPEAT_INTERVAL_MS } from './constants';

export async function canShowPromptAgain(lastDismissedTsKey: string) {
  const lastDismissedTs = await AsyncStorage.getItem(lastDismissedTsKey);

  if (!lastDismissedTs) {
    return true;
  }

  const lastDismissedTsInt = Number(lastDismissedTs);

  if (isNaN(lastDismissedTsInt)) {
    console.error(`[AppUpdate] invalid lastDismissedTs [${lastDismissedTs}].`);

    return false;
  }

  const timeDiff = Date.now() - lastDismissedTsInt;

  return timeDiff > DO_NOT_REPEAT_INTERVAL_MS;
}
