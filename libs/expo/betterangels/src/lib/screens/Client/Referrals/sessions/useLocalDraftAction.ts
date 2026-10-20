import { useCallback } from 'react';
import { useSnackbar } from '../../../../hooks';

/** UI writes share one failure boundary; the store publishes only persisted changes. */
export function useLocalDraftAction() {
  const { showSnackbar } = useSnackbar();
  return useCallback(
    (action: () => boolean): boolean => {
      try {
        return action();
      } catch {
        showSnackbar({
          message:
            'Could not save this change on this device. Your last saved draft is unchanged. Please try again.',
          type: 'error',
        });
        return false;
      }
    },
    [showSnackbar],
  );
}
