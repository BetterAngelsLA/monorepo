import { useActiveOrgId } from '@monorepo/ba-platform';
import { useCallback } from 'react';

import useSnackbar from '../snackbar/useSnackbar';

export const NO_ACTIVE_ORG_MESSAGE = 'Select an organization to create a task.';

/**
 * The org a create must be anchored to, or `null` after saying why.
 *
 * Task creation needs one. The screens ask at the entry point so a form never
 * opens without an org, and again on submit in case it went away.
 */
export function useActiveOrgGuard(): () => string | null {
  const activeOrgId = useActiveOrgId();
  const { showSnackbar } = useSnackbar();

  return useCallback((): string | null => {
    if (activeOrgId) {
      return activeOrgId;
    }

    showSnackbar({ message: NO_ACTIVE_ORG_MESSAGE, type: 'error' });

    return null;
  }, [activeOrgId, showSnackbar]);
}
