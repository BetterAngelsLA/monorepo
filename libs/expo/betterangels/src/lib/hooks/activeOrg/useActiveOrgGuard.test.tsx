import { renderHook } from '@testing-library/react-native';
import { createElement, type ReactNode } from 'react';

import { SnackbarContext } from '../../providers/snackbar/SnackbarContext';
import { NO_ACTIVE_ORG_MESSAGE, useActiveOrgGuard } from './useActiveOrgGuard';

const { activeOrgId, showSnackbar } = vi.hoisted(() => ({
  activeOrgId: vi.fn<() => string | null>(),
  showSnackbar: vi.fn(),
}));

vi.mock('@monorepo/ba-platform', () => ({
  useActiveOrgId: () => activeOrgId(),
}));

const wrapper = ({ children }: { children: ReactNode }) =>
  createElement(
    SnackbarContext.Provider,
    { value: { showSnackbar } },
    children,
  );

beforeEach(() => {
  activeOrgId.mockReset();
  showSnackbar.mockReset();
});

it('answers with the active org and says nothing', async () => {
  activeOrgId.mockReturnValue('org-1');

  const { result } = await renderHook(() => useActiveOrgGuard(), {
    wrapper,
  });

  expect(result.current()).toBe('org-1');
  expect(showSnackbar).not.toHaveBeenCalled();
});

it('says why and answers null when there is no active org', async () => {
  activeOrgId.mockReturnValue(null);

  const { result } = await renderHook(() => useActiveOrgGuard(), {
    wrapper,
  });

  expect(result.current()).toBeNull();
  expect(showSnackbar).toHaveBeenCalledExactlyOnceWith({
    message: NO_ACTIVE_ORG_MESSAGE,
    type: 'error',
  });
});
