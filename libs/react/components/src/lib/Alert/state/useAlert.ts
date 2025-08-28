import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { TAlertAtomProps } from '../types';
import { alertAtom } from './alertAtom';

export function useAlert() {
  const [_alert, setAlert] = useAtom(alertAtom);

  const closeAlert = useCallback(() => {
    setAlert((prev) => {
      if (!prev) {
        return null;
      }

      return { ...prev, visible: false };
    });
  }, [setAlert]);

  const showAlert = useCallback(
    (props: Omit<TAlertAtomProps, 'visible'>) => {
      setAlert({ ...props, visible: true });
    },
    [setAlert]
  );

  return {
    showAlert,
    closeAlert,
  };
}
