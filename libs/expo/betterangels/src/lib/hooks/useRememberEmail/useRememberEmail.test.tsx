import { act, renderHook, waitFor } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useRememberedEmail } from './useRememberEmail';

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  save: vi.fn(),
  clear: vi.fn(),
}));

vi.mock('./rememberedEmailStorage', () => ({
  loadRememberedEmail: mocks.load,
  saveRememberedEmail: mocks.save,
  clearRememberedEmail: mocks.clear,
}));

const STORAGE_KEY = 'non-hmis.email';

describe('useRememberedEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.load.mockResolvedValue(null);
    mocks.save.mockResolvedValue(undefined);
    mocks.clear.mockResolvedValue(undefined);
  });

  async function render() {
    const rendered = await renderHook(() => useRememberedEmail(STORAGE_KEY));
    await waitFor(() => expect(mocks.load).toHaveBeenCalledWith(STORAGE_KEY));
    return rendered;
  }

  it('loads the remembered email and checks the box', async () => {
    mocks.load.mockResolvedValue('user@example.com');

    const { result } = await render();

    await waitFor(() => expect(result.current.email).toBe('user@example.com'));
    expect(result.current.rememberMe).toBe(true);
  });

  it('starts blank when nothing is remembered', async () => {
    const { result } = await render();

    expect(result.current.email).toBe('');
    expect(result.current.rememberMe).toBe(false);
  });

  it('saves the trimmed email on a successful sign-in when remembered', async () => {
    mocks.load.mockResolvedValue('saved@example.com');

    const { result } = await render();
    await waitFor(() => expect(result.current.rememberMe).toBe(true));

    await act(async () => {
      await result.current.persistOnSuccessfulSignIn('  user@example.com  ');
    });

    expect(mocks.save).toHaveBeenCalledWith(STORAGE_KEY, 'user@example.com');
    expect(mocks.clear).not.toHaveBeenCalled();
  });

  it('clears when the box is unchecked', async () => {
    const { result } = await render();

    await act(async () => {
      await result.current.persistOnSuccessfulSignIn('user@example.com');
    });

    expect(mocks.clear).toHaveBeenCalledWith(STORAGE_KEY);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('clears rather than saves when the email is blank', async () => {
    mocks.load.mockResolvedValue('saved@example.com');

    const { result } = await render();
    await waitFor(() => expect(result.current.rememberMe).toBe(true));

    await act(async () => {
      await result.current.persistOnSuccessfulSignIn('   ');
    });

    expect(mocks.clear).toHaveBeenCalledWith(STORAGE_KEY);
    expect(mocks.save).not.toHaveBeenCalled();
  });

  it('leaves the fields blank when loading fails', async () => {
    mocks.load.mockRejectedValue(new Error('keychain locked'));

    const { result } = await render();

    expect(result.current.email).toBe('');
    expect(result.current.rememberMe).toBe(false);
  });

  it('does not throw when the storage write fails', async () => {
    mocks.load.mockResolvedValue('saved@example.com');
    mocks.save.mockRejectedValue(new Error('storage unavailable'));

    const { result } = await render();
    await waitFor(() => expect(result.current.rememberMe).toBe(true));

    await act(async () => {
      await result.current.persistOnSuccessfulSignIn('user@example.com');
    });

    expect(mocks.save).toHaveBeenCalledWith(STORAGE_KEY, 'user@example.com');
  });
});
