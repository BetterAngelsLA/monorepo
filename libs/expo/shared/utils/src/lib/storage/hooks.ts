import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export function useAsyncStorageState(
  key: string,
  initialValue: string
): [string, (newValue: string) => Promise<void>] {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    AsyncStorage.getItem(key)
      .then((stored) => {
        if (stored != null) setValue(stored);
      })
      .catch(console.warn);
  }, [key]);

  const setPersistedValue = useCallback(
    async (newValue: string) => {
      setValue(newValue);
      try {
        await AsyncStorage.setItem(key, newValue);
      } catch (err) {
        console.warn(`Failed to save ${key}`, err);
      }
    },
    [key]
  );

  return [value, setPersistedValue];
}
