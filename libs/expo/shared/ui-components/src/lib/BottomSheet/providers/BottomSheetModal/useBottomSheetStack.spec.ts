import { act, renderHook } from '@testing-library/react-native';
import { describe, expect, it, vi } from 'vitest';
import { TBottomSheetInstance } from './types.internal';
import { useBottomSheetStack } from './useBottomSheetStack';

/**
 * useBottomSheetStack
 *
 * Documents the three stack behaviors:
 * - 'push'    → append on top, dismiss nothing
 * - 'switch'  → dismiss the top sheet, replace it in place
 * - 'replace' → dismiss every existing sheet, keep only the new one
 *
 * Dismissals are delegated to the provider's idempotent `dismissSheet`, so the
 * hook never touches Gorhom refs directly.
 */

function makeSheet(id: string): TBottomSheetInstance {
  return {
    id,
    render: () => null,
    options: {},
  } as unknown as TBottomSheetInstance;
}

function applyLastUpdater(
  setSheets: ReturnType<typeof vi.fn>,
  previous: TBottomSheetInstance[],
): TBottomSheetInstance[] {
  const calls = setSheets.mock.calls as Array<
    [(prev: TBottomSheetInstance[]) => TBottomSheetInstance[]]
  >;
  const updater = calls[calls.length - 1]?.[0];
  return updater ? updater(previous) : previous;
}

describe('useBottomSheetStack', () => {
  function setup() {
    const dismissSheet = vi.fn();
    const setSheets = vi.fn();

    const { result } = renderHook(() =>
      useBottomSheetStack({
        dismissSheet,
        setSheets: setSheets as never,
      }),
    );

    return {
      addSheet: result.current.addSheet,
      dismissSheet,
      setSheets,
      applyLast: (previous: TBottomSheetInstance[]) =>
        applyLastUpdater(setSheets, previous),
    };
  }

  it("'push' appends the new sheet on top and dismisses nothing", () => {
    const { addSheet, dismissSheet, applyLast } = setup();
    const a = makeSheet('a');
    const b = makeSheet('b');

    act(() => {
      addSheet(b, 'push');
    });

    expect(applyLast([a]).map((s) => s.id)).toEqual(['a', 'b']);
    expect(dismissSheet).not.toHaveBeenCalled();
  });

  it("'push' onto an empty stack keeps only the new sheet", () => {
    const { addSheet, applyLast } = setup();
    const b = makeSheet('b');

    act(() => {
      addSheet(b, 'push');
    });

    expect(applyLast([]).map((s) => s.id)).toEqual(['b']);
  });

  it("'switch' dismisses only the top sheet and replaces it in place", () => {
    const { addSheet, dismissSheet, applyLast } = setup();
    const a = makeSheet('a');
    const b = makeSheet('b');
    const c = makeSheet('c');

    act(() => {
      addSheet(c, 'switch');
    });

    const next = applyLast([a, b]);
    expect(next.map((s) => s.id)).toEqual(['a', 'c']);
    expect(dismissSheet).toHaveBeenCalledTimes(1);
    expect(dismissSheet).toHaveBeenCalledWith('b');
  });

  it("'replace' dismisses all existing sheets and keeps only the new one", () => {
    const { addSheet, dismissSheet, applyLast } = setup();
    const a = makeSheet('a');
    const b = makeSheet('b');
    const c = makeSheet('c');

    act(() => {
      addSheet(c, 'replace');
    });

    const next = applyLast([a, b]);
    expect(next.map((s) => s.id)).toEqual(['c']);
    expect(dismissSheet).toHaveBeenCalledTimes(2);
    expect(dismissSheet).toHaveBeenCalledWith('a');
    expect(dismissSheet).toHaveBeenCalledWith('b');
  });

  it("'replace' with no existing sheets keeps only the new sheet", () => {
    const { addSheet, dismissSheet, applyLast } = setup();
    const c = makeSheet('c');

    act(() => {
      addSheet(c, 'replace');
    });

    expect(applyLast([]).map((s) => s.id)).toEqual(['c']);
    expect(dismissSheet).not.toHaveBeenCalled();
  });

  it('delegates dismissal of existing sheets to dismissSheet', () => {
    const { addSheet, dismissSheet, applyLast } = setup();
    const a = makeSheet('a');
    const b = makeSheet('b');

    act(() => {
      addSheet(b, 'replace');
    });

    expect(applyLast([a]).map((s) => s.id)).toEqual(['b']);
    // The hook delegates; the provider's dismissSheet tolerates a missing live
    // instance / a not-yet-presented sheet.
    expect(dismissSheet).toHaveBeenCalledWith('a');
  });
});
