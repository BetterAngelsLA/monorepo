import { useAtom } from 'jotai';
import { useCallback } from 'react';
import { AUTO_DISMISS_MS, CLOSE_ANIMATION_MS } from '../constants';
import { IToastAction, TToastStatus } from '../types';
import { toastAtom } from './toastAtom';

interface IShowToastParams {
  status: TToastStatus;
  title: string;
  description?: string;
  action?: IToastAction;
  duration?: number;
}

let toastCounter = 0;

export function useToast() {
  const [_toasts, setToasts] = useAtom(toastAtom);

  const closeToast = useCallback(
    (id: string) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
      );

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, CLOSE_ANIMATION_MS);
    },
    [setToasts]
  );

  const showToast = useCallback(
    (params: IShowToastParams) => {
      const id = `toast-${++toastCounter}`;
      const duration = params.duration ?? AUTO_DISMISS_MS;

      setToasts((prev) => [
        ...prev,
        {
          id,
          visible: true,
          status: params.status,
          title: params.title,
          description: params.description,
          action: params.action,
        },
      ]);

      if (duration > 0) {
        setTimeout(() => closeToast(id), duration);
      }

      return id;
    },
    [setToasts, closeToast]
  );

  return { showToast, closeToast };
}
