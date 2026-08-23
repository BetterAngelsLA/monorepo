import { act, renderHook } from '@testing-library/react-native';
import { Dispatch, SetStateAction } from 'react';
import { TBottomSheetInstance } from './types.internal';
import { useBottomSheetStack } from './useBottomSheetStack';

function makeSheet(id: string): TBottomSheetInstance {
  return { id, render: () => null, options: {} };
}

function setup() {
  const sheetsRef = { current: [] as TBottomSheetInstance[] };

  const setSheets: Dispatch<SetStateAction<TBottomSheetInstance[]>> = (
    value,
  ) => {
    sheetsRef.current =
      typeof value === 'function' ? value(sheetsRef.current) : value;
  };

  const dismissSheet = vi.fn();

  const { result } = renderHook(() =>
    useBottomSheetStack({ sheetsRef, setSheets, dismissSheet }),
  );

  return { result, sheetsRef, dismissSheet };
}

describe('useBottomSheetStack', () => {
  it('push appends the sheet and dismisses nothing', () => {
    const { result, sheetsRef, dismissSheet } = setup();

    act(() => {
      result.current.addSheet(makeSheet('a'), 'push');
      result.current.addSheet(makeSheet('b'), 'push');
    });

    expect(sheetsRef.current.map((s) => s.id)).toEqual(['a', 'b']);
    expect(dismissSheet).not.toHaveBeenCalled();
  });

  it('switch dismisses only the top sheet and keeps it until onDismiss', () => {
    const { result, sheetsRef, dismissSheet } = setup();

    act(() => {
      result.current.addSheet(makeSheet('a'), 'push');
      result.current.addSheet(makeSheet('b'), 'push');
    });

    act(() => {
      result.current.addSheet(makeSheet('c'), 'switch');
    });

    expect(dismissSheet).toHaveBeenCalledTimes(1);
    expect(dismissSheet).toHaveBeenCalledWith('b');

    // The outgoing sheet stays in the stack until the provider removes it on
    // `onDismiss` (deferred removal), so its dismiss animation and lifecycle
    // cleanup still run.
    expect(sheetsRef.current.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });

  it('replace dismisses all existing sheets but keeps them until onDismiss', () => {
    const { result, sheetsRef, dismissSheet } = setup();

    act(() => {
      result.current.addSheet(makeSheet('a'), 'push');
      result.current.addSheet(makeSheet('b'), 'push');
    });
    dismissSheet.mockClear();

    act(() => {
      result.current.addSheet(makeSheet('c'), 'replace');
    });

    expect(dismissSheet).toHaveBeenCalledTimes(2);
    expect(dismissSheet).toHaveBeenCalledWith('a');
    expect(dismissSheet).toHaveBeenCalledWith('b');
    expect(sheetsRef.current.map((s) => s.id)).toEqual(['a', 'b', 'c']);
  });
});
