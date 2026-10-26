import { renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import useEmailEnvironment from './useEmailEnvironment';

/**
 * The email is how a developer or tester picks an environment, so these pin the
 * address → environment mapping — including `+local`, which has to be tested
 * before the `@example.com` demo rule because its addresses match both.
 */

const mocks = vi.hoisted(() => ({
  switchEnvironment: vi.fn(),
}));

vi.mock('@monorepo/ba-platform', () => ({
  useEnvironment: () => ({
    environment: 'production',
    switchEnvironment: mocks.switchEnvironment,
  }),
}));

async function render(email: string) {
  const rendered = await renderHook(() => useEmailEnvironment(email));
  // The switch happens in an effect, after the first render.
  await new Promise((resolve) => setTimeout(resolve, 0));
  return rendered;
}

describe('useEmailEnvironment', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it.each([
    ['caseworker+local@example.com', 'local'],
    ['caseworker+local@betterangels.la', 'local'],
    ['caseworker+local+demo@example.com', 'local'],
  ])('selects the local environment for %s', async (email, expected) => {
    await render(email);

    await waitFor(() =>
      expect(mocks.switchEnvironment).toHaveBeenCalledWith(expected),
    );
  });

  it.each([
    ['caseworker+demo@betterangels.la', 'demo'],
    ['admin@example.com', 'demo'],
    ['caseworker@betterangels.la', 'production'],
  ])('maps %s to %s', async (email, expected) => {
    const { result } = await render(email);

    await waitFor(() =>
      expect(mocks.switchEnvironment).toHaveBeenCalledWith(expected),
    );
    expect(result.current.isValidEmail).toBe(true);
  });

  it('does not switch for an invalid or empty address', async () => {
    await render('not-an-email');
    await render('');

    expect(mocks.switchEnvironment).not.toHaveBeenCalled();
  });

  it('reports @example.com as a password login', async () => {
    const { result } = await render('admin@example.com');

    await waitFor(() => expect(result.current.isValidEmail).toBe(true));
    expect(result.current.isPasswordLogin).toBe(true);
  });
});
