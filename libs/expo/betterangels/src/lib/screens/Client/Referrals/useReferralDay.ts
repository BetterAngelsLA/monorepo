import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { localReferralDay } from './referralPresentation';

/** Refresh past-date warnings at local midnight and after backgrounding. */
export function useReferralDay() {
  const [day, setDay] = useState(localReferralDay);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      clearTimeout(timer);
      const now = new Date();
      setDay(localReferralDay(now.getTime()));
      const midnight = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      );
      timer = setTimeout(refresh, midnight.getTime() - now.getTime() + 100);
    };
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);
  return day;
}
