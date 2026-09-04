import { act, renderHook } from '@testing-library/react-native';
import { RefObject } from 'react';
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
 * Dismissals are driven imperatively through the shared sheetRefs map.
 */

type FakeSheetInstance = { dismiss: ReturnType<typeof vi.fn> };

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
    const sheetRefs = {
      current: new Map<string, FakeSheetInstance>(),
    } as unknown as RefObject<Map<string, never>>;

    const setSheets = vi.fn();

    const { result } = renderHook(() =>
      useBottomSheetStack({
        sheetRefs,
        setSheets: setSheets as never,
      }),
    );

    const register = (...ids: string[]): FakeSheetInstance[] => {
      const instances = ids.map(() => ({ dismiss: vi.fn() }));
      ids.forEach((id, index) =>
        sheetRefs.current.set(id, instances[index] as never),
      );
      return instances;
    };

    return {
      addSheet: result.current.addSheet,
      setSheets,
      register,
      applyLast: (previous: TBottomSheetInstance[]) =>
        applyLastUpdater(setSheets, previous),
    };
  }

  it("'push' appends the new sheet on top and dismisses nothing", () => {
    const { addSheet, register, applyLast } = setup();
    const a = makeSheet('a');
    register('a');
    const b = makeSheet('b');

    act(() => {
      addSheet(b, 'push');
    });

    expect(applyLast([a]).map((s) => s.id)).toEqual(['a', 'b']);
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
    const { addSheet, register, applyLast } = setup();
    const a = makeSheet('a');
    const b = makeSheet('b');
    const instances = register('a', 'b');
    const c = makeSheet('c');

    act(() => {
      addSheet(c, 'switch');
    });

    const next = applyLast([a, b]);
    expect(next.map((s) => s.id)).toEqual(['a', 'c']);
    expect(instances[0].dismiss).not.toHaveBeenCalled();
    expect(instances[1].dismiss).toHaveBeenCalledTimes(1);
  });

  it("'replace' dismisses all existing sheets and keeps only the new one", () => {
    const { addSheet, register, applyLast } = setup();
    const a = makeSheet('a');
    const b = makeSheet('b');
    const instances = register('a', 'b');
    const c = makeSheet('c');

    act(() => {
      addSheet(c, 'replace');
    });

    const next = applyLast([a, b]);
    expect(next.map((s) => s.id)).toEqual(['c']);
    expect(instances[0].dismiss).toHaveBeenCalledTimes(1);
    expect(instances[1].dismiss).toHaveBeenCalledTimes(1);
  });

  it("'replace' with no existing sheets keeps only the new sheet", () => {
    const { addSheet, applyLast } = setup();
    const c = makeSheet('c');

    act(() => {
      addSheet(c, 'replace');
    });

    expect(applyLast([]).map((s) => s.id)).toEqual(['c']);
  });

  it('tolerates a missing instance when dismissing an existing sheet', () => {
    const { addSheet, applyLast } = setup();
    const a = makeSheet('a'); // intentionally NOT registered in sheetRefs
    const b = makeSheet('b');

    act(() => {
      addSheet(b, 'replace');
    });

    expect(applyLast([a]).map((s) => s.id)).toEqual(['b']);
  });
});
