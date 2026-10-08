import { act, render } from '@testing-library/react-native';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShowBottomSheetParams } from '../../types';
import { BottomSheetModalProvider } from './BottomSheetModalProvider';
import { DISMISS_RETRY_INTERVAL_MS, GORHOM_MODAL_STATUS } from './constants';
import { useBottomSheet } from './useBottomSheet';

/**
 * BottomSheetModalProvider
 *
 * Documents the provider's lifecycle responsibilities:
 * - a sheet is PRESENTED exactly once per id, even when the provider
 *   re-renders and React re-attaches refs (no re-present storms)
 * - onRequestClose / closeSheet dismiss the sheet imperatively
 * - stackBehavior 'replace' dismisses the previous sheet
 * - when a sheet fully dismisses (onDismiss), options.onClose(id) fires once
 *   and the sheet is removed from the stack
 *
 * Gorhom's own modal + BottomSheetBase are mocked so the test controls the
 * imperative instance (present/dismiss) and the onDismiss signal.
 */

type MockInstance = {
  present: ReturnType<typeof vi.fn>;
  dismiss: ReturnType<typeof vi.fn>;
  /** Mirrors the status ref Gorhom exposes on its imperative handle. */
  status: { current: number };
};

/** The `MODAL_STATUS` values this spec exercises. */
const STATUS_INITIAL = GORHOM_MODAL_STATUS.INITIAL;
const STATUS_PRESENTED = GORHOM_MODAL_STATUS.PRESENTED;
const STATUS_ANIMATING = GORHOM_MODAL_STATUS.ANIMATING;

type MountedBase = {
  inst: MockInstance;
  onRequestClose?: () => void;
  onDismiss?: () => void;
};

const state = vi.hoisted(() => ({
  mountedBases: [] as MountedBase[],
  makeInstance: (): MockInstance => ({
    present: vi.fn(),
    dismiss: vi.fn(),
    status: { current: 1 },
  }),
}));

vi.mock('@gorhom/bottom-sheet', () => {
  const GbsProvider = ({ children }: { children?: unknown }) =>
    children ?? null;

  return {
    BottomSheetModal: class BottomSheetModal {},
    BottomSheetModalProvider: GbsProvider,
    // The provider switches Gorhom's internal trace on in __DEV__.
    enableLogging: vi.fn(),
    useBottomSheetModalInternal: () => ({
      containerLayoutState: { value: { height: 800, offset: {} } },
    }),
  };
});

vi.mock('../../core/BottomSheetBase', () => {
  const React = require('react');

  // A class component so React attaches the provider's ref to an instance
  // that exposes present()/dismiss() — no forwardRef/hooks needed.
  class MockBottomSheetBase extends React.Component {
    present!: MockInstance['present'];
    dismiss!: MockInstance['dismiss'];
    status!: MockInstance['status'];
    onRequestClose!: () => void;
    onDismiss!: () => void;
    entry?: MountedBase;

    constructor(props: Record<string, unknown>) {
      super(props);
      const inst = state.makeInstance();
      this.present = inst.present;
      this.dismiss = inst.dismiss;
      this.status = inst.status;
      this.onRequestClose = props.onRequestClose as () => void;
      this.onDismiss = props.onDismiss as () => void;
    }

    componentDidMount() {
      this.entry = {
        inst: {
          present: this.present,
          dismiss: this.dismiss,
          status: this.status,
        },
        onRequestClose: this.onRequestClose,
        onDismiss: this.onDismiss,
      };
      state.mountedBases.push(this.entry);
    }

    componentWillUnmount() {
      const index = state.mountedBases.indexOf(this.entry as MountedBase);
      if (index !== -1) {
        state.mountedBases.splice(index, 1);
      }
    }

    render() {
      return null;
    }
  }

  return { BottomSheetBase: MockBottomSheetBase };
});

function Harness({
  onReady,
}: {
  onReady: (show: (params: ShowBottomSheetParams) => void) => void;
}) {
  const { showBottomSheet } = useBottomSheet();

  useEffect(() => {
    onReady(showBottomSheet);
  }, [showBottomSheet, onReady]);

  return null;
}

describe('BottomSheetModalProvider', () => {
  beforeEach(() => {
    state.mountedBases.length = 0;
  });

  function renderProvider() {
    const ref: { show?: (params: ShowBottomSheetParams) => void } = {};

    render(
      <BottomSheetModalProvider enableLayoutProvider={false}>
        <Harness onReady={(fn) => (ref.show = fn)} />
      </BottomSheetModalProvider>,
    );

    if (!ref.show) {
      throw new Error('Harness did not receive showBottomSheet');
    }

    return { show: ref.show };
  }

  function showSheet(
    show: (params: ShowBottomSheetParams) => void,
    options?: ShowBottomSheetParams['options'],
  ) {
    act(() => {
      show({ render: () => null, options });
    });
  }

  it('presents each sheet exactly once, even across provider re-renders', () => {
    const { show } = renderProvider();

    showSheet(show, { stackBehavior: 'replace' });
    expect(state.mountedBases).toHaveLength(1);
    const first = state.mountedBases[0].inst;
    expect(first.present).toHaveBeenCalledTimes(1);

    // Adding a second sheet re-renders the provider, which re-attaches the
    // ref callbacks for ALL mounted sheets. present() must NOT re-fire.
    showSheet(show, { stackBehavior: 'push' });
    expect(state.mountedBases).toHaveLength(2);
    expect(first.present).toHaveBeenCalledTimes(1);
    expect(state.mountedBases[1].inst.present).toHaveBeenCalledTimes(1);
  });

  it("'replace' keeps the previous sheet mounted until Gorhom confirms dismissal", () => {
    const { show } = renderProvider();

    showSheet(show, { stackBehavior: 'replace' });
    const first = state.mountedBases[0];
    expect(first.inst.dismiss).not.toHaveBeenCalled();

    showSheet(show, { stackBehavior: 'replace' });

    // Dismissed exactly once, and NOT unmounted: dropping it from React before
    // Gorhom finishes tearing it down leaks its portal entry, which keeps the
    // modal alive and swallowing touches (the "UI freeze").
    expect(first.inst.dismiss).toHaveBeenCalledTimes(1);
    expect(state.mountedBases).toHaveLength(2);

    // Gorhom reports the dismissal finishing → now it may be unmounted.
    act(() => {
      first.onDismiss?.();
    });

    expect(state.mountedBases).toHaveLength(1);
  });

  it("'push' leaves the sheets below it untouched", () => {
    const { show } = renderProvider();

    showSheet(show, { stackBehavior: 'push' });
    const first = state.mountedBases[0];

    showSheet(show, { stackBehavior: 'push' });

    expect(first.inst.dismiss).not.toHaveBeenCalled();
    expect(state.mountedBases).toHaveLength(2);
  });

  it('defers a dismiss requested while the modal is still materialising', async () => {
    const { show } = renderProvider();

    showSheet(show, {});
    const base = state.mountedBases[0];

    // `present()` is in flight: Gorhom has not mounted the modal natively yet
    // (status INITIAL). Dismissing now would be swallowed and the modal would
    // resurrect itself with no owner left to tear it down.
    base.inst.status.current = STATUS_INITIAL;

    act(() => {
      base.onRequestClose?.();
    });

    expect(base.inst.dismiss).not.toHaveBeenCalled();
    expect(state.mountedBases).toHaveLength(1);

    // The modal finishes materialising on a later frame; the deferred dismiss
    // is then honoured.
    base.inst.status.current = STATUS_PRESENTED;

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(base.inst.dismiss).toHaveBeenCalledTimes(1);
  });

  it('dismisses a sheet at most once, even with repeated close requests', () => {
    const { show } = renderProvider();

    showSheet(show, {});
    const base = state.mountedBases[0];

    act(() => {
      base.onRequestClose?.();
      base.onRequestClose?.();
    });

    expect(base.inst.dismiss).toHaveBeenCalledTimes(1);
  });

  it('defers a dismiss requested while the sheet is still animating', async () => {
    const { show } = renderProvider();

    showSheet(show, {});
    const base = state.mountedBases[0];

    // Dismissing mid-animation latches Gorhom's status at DISMISSING and its
    // `forceClose()` silently no-ops (it has to stop the running animation
    // without resetting `isForcedClosing`) — the sheet can then never close
    // again, which is the freeze.
    base.inst.status.current = STATUS_ANIMATING;

    act(() => {
      base.onRequestClose?.();
    });

    expect(base.inst.dismiss).not.toHaveBeenCalled();
    expect(state.mountedBases).toHaveLength(1);

    // Sheet settles → the deferred dismiss is honoured.
    base.inst.status.current = STATUS_PRESENTED;

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(base.inst.dismiss).toHaveBeenCalledTimes(1);
  });

  it('re-asks Gorhom to dismiss a sheet that never confirms its dismissal', async () => {
    vi.useFakeTimers();

    try {
      const { show } = renderProvider();

      showSheet(show, {});
      const base = state.mountedBases[0];

      act(() => {
        base.onRequestClose?.();
      });

      expect(base.inst.dismiss).toHaveBeenCalledTimes(1);

      // Gorhom dropped it silently: still closing, no onDismiss → re-ask.
      await act(async () => {
        vi.advanceTimersByTime(DISMISS_RETRY_INTERVAL_MS + 20);
      });

      expect(base.inst.dismiss).toHaveBeenCalledTimes(2);

      // Once Gorhom confirms the dismissal, retrying stops.
      act(() => {
        base.onDismiss?.();
      });

      await act(async () => {
        vi.advanceTimersByTime(DISMISS_RETRY_INTERVAL_MS * 3);
      });

      expect(base.inst.dismiss).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('onRequestClose notifies onClose at request time and dismisses (backdrop / header X)', () => {
    const { show } = renderProvider();
    const onClose = vi.fn();

    showSheet(show, { onClose });
    const base = state.mountedBases[0];

    act(() => {
      base.onRequestClose?.();
    });

    // Request-time notification lets a controlled sheet close its state
    // immediately (like a Cancel button) instead of waiting for onDismiss.
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0]).toMatch(/^sheet-/);
    expect(base.inst.dismiss).toHaveBeenCalledTimes(1);

    // When Gorhom later reports the dismissal finishing, onClose is NOT fired
    // again (once-per-sheet guard) and the sheet is removed.
    act(() => {
      base.onDismiss?.();
    });
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(state.mountedBases).toHaveLength(0);
  });

  it('closeSheet (render API) dismisses the sheet', () => {
    const { show } = renderProvider();

    let closeSheet: (() => void) | undefined;
    act(() => {
      show({
        render: ({ closeSheet: cs }) => {
          closeSheet = cs;
          return null;
        },
      });
    });

    const base = state.mountedBases[0];
    expect(base.inst.dismiss).not.toHaveBeenCalled();

    act(() => {
      closeSheet?.();
    });

    expect(base.inst.dismiss).toHaveBeenCalledTimes(1);
  });

  it('fires options.onClose(id) once on dismissal and removes the sheet', () => {
    const { show } = renderProvider();
    const onClose = vi.fn();

    showSheet(show, { onClose });
    expect(state.mountedBases).toHaveLength(1);

    act(() => {
      state.mountedBases[0].onDismiss?.();
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose.mock.calls[0][0]).toMatch(/^sheet-/);
    // Sheet fully dismissed → removed from the rendered stack.
    expect(state.mountedBases).toHaveLength(0);
  });

  it('presents a new sheet immediately once the closing sheet is dismissing', () => {
    const { show } = renderProvider();

    showSheet(show, { stackBehavior: 'replace' });
    const first = state.mountedBases[0];

    // Dismissal handed to Gorhom (mock status is PRESENTED, i.e. dismissable).
    act(() => {
      first.onRequestClose?.();
    });

    expect(first.inst.dismiss).toHaveBeenCalledTimes(1);

    // No need to wait for the close animation: Gorhom's own `mountSheet` skips
    // a DISMISSING modal, so e.g. "Take Photo" opens the camera sheet while the
    // menu slides away.
    showSheet(show, { stackBehavior: 'replace' });
    const second = state.mountedBases[1];

    expect(second.inst.present).toHaveBeenCalledTimes(1);
  });

  it('holds a new sheet back while the closing sheet is not dismissing yet', () => {
    const { show } = renderProvider();

    showSheet(show, {});
    const first = state.mountedBases[0];

    // Not dismissable, so our dismiss is deferred: that modal is still live
    // natively and presenting over it would make Gorhom minimize it instead of
    // letting the dismissal run.
    first.inst.status.current = STATUS_ANIMATING;

    act(() => {
      first.onRequestClose?.();
    });

    expect(first.inst.dismiss).not.toHaveBeenCalled();

    showSheet(show, {});
    const second = state.mountedBases[1];

    expect(second.inst.present).not.toHaveBeenCalled();
  });
});
