import { act, renderHook } from '@testing-library/react-native';
import { Provider, createStore } from 'jotai';
import type { ReactNode } from 'react';
import { createMMKV } from 'react-native-mmkv';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_SORT_DIRECTION,
  SORT_DIRECTION_STORAGE_KEY,
} from './sortDirectionState';
import { useSortDirection } from './useSortDirection';

// The setup file stubs `react-native-mmkv`; this file backs the stub with a
// plain map so the storage round-trip is observable.
const mmkvData: Record<string, string> = {};

const fakeMmkv = {
  getString: (key: string) => mmkvData[key],
  set: (key: string, value: string) => {
    mmkvData[key] = value;
  },
  remove: (key: string) => {
    delete mmkvData[key];
  },
};

const mockedCreateMMKV = vi.mocked(createMMKV);

beforeEach(() => {
  mockedCreateMMKV.mockImplementation(
    () => fakeMmkv as unknown as ReturnType<typeof createMMKV>,
  );
});

function renderSortDirection() {
  const store = createStore();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  return renderHook(() => useSortDirection(), { wrapper });
}

describe('sortDirectionState', () => {
  it('does not create the MMKV handle just by being imported', async () => {
    // Import a fresh copy of the module graph, so the assertion cannot depend
    // on test execution order: the store must stay lazy at import time.
    vi.resetModules();

    const freshMmkv = await import('react-native-mmkv');

    await import('./sortDirectionState');

    expect(vi.mocked(freshMmkv.createMMKV)).not.toHaveBeenCalled();
  });

  it('defaults to newest-first and uses the app-wide MMKV instance', () => {
    delete mmkvData[SORT_DIRECTION_STORAGE_KEY];

    const { result } = renderSortDirection();

    expect(result.current.direction).toBe(DEFAULT_SORT_DIRECTION);
    expect(mockedCreateMMKV).toHaveBeenCalledWith(undefined);
  });

  it('hydrates a stored direction on the first render', () => {
    mmkvData[SORT_DIRECTION_STORAGE_KEY] = JSON.stringify('oldestFirst');

    const { result } = renderSortDirection();

    // synchronous storage: no waitFor, the first render already reads it
    expect(result.current.direction).toBe('oldestFirst');
  });

  it('falls back to the default when the stored value is not a direction', () => {
    mmkvData[SORT_DIRECTION_STORAGE_KEY] = JSON.stringify('sideways');

    const { result } = renderSortDirection();

    expect(result.current.direction).toBe(DEFAULT_SORT_DIRECTION);
  });

  it('falls back to the default when the stored value is not JSON', () => {
    mmkvData[SORT_DIRECTION_STORAGE_KEY] = 'not json {';

    const { result } = renderSortDirection();

    expect(result.current.direction).toBe(DEFAULT_SORT_DIRECTION);
  });

  it('persists the toggled direction for the next mount', () => {
    delete mmkvData[SORT_DIRECTION_STORAGE_KEY];

    const first = renderSortDirection();

    act(() => {
      first.result.current.toggle();
    });

    expect(first.result.current.direction).toBe('oldestFirst');
    expect(mmkvData[SORT_DIRECTION_STORAGE_KEY]).toBe(
      JSON.stringify('oldestFirst'),
    );

    first.unmount();

    const second = renderSortDirection();

    expect(second.result.current.direction).toBe('oldestFirst');
  });
});
