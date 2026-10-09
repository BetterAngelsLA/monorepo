import { act, render } from '@testing-library/react-native';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShowBottomSheetParams } from '../../types';
import { BottomSheetModalProvider } from './BottomSheetModalProvider';
import {
  DISMISS_DEFER_TIMEOUT_MS,
  DISMISS_RETRY_ATTEMPTS,
  DISMISS_RETRY_INTERVAL_MS,
  GORHOM_MODAL_STATUS,
} from './constants';
import { useBottomSheet } from './hooks';

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
 * - a dismissal that never completes is resolved one way or the other, rather
 *   than leaving the sheet mounted and unclosable
 *
 * Gorhom's own modal + BottomSheetBase are mocked so the test controls the
 * imperative instance (present/dismiss) and the onDismiss signal.
 *
 * The provider is rendered for real, so `useSheetStack` and `useSheetClose` run
 * as they do in the app — this file is their coverage too, exercised through the
 * public API rather than at the seam between them.
 *
 * The DEV-2541 scenarios at the bottom pin the two ways a dismissal can fail to
 * complete: Gorhom never confirming it, and the provider unmounting mid-close.
 * Both used to leave the sheet stuck on screen. They were written as the desired
 * contract from `BottomSheetDesiredBehaviour.spec.tsx`; they are now the
 * implemented one.
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
const STATUS_DISMISSING = GORHOM_MODAL_STATUS.DISMISSING;

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

    // The provider re-creates its onRequestClose / onDismiss closures on every
    // render, so keep the recorded ones fresh: a test that closes a sheet after
    // the provider has re-rendered must exercise the current closure.
    componentDidUpdate() {
      const props = this.props as {
        onRequestClose?: () => void;
        onDismiss?: () => void;
      };

      this.onRequestClose = props.onRequestClose as () => void;
      this.onDismiss = props.onDismiss as () => void;

      if (this.entry) {
        this.entry.onRequestClose = this.onRequestClose;
        this.entry.onDismiss = this.onDismiss;
      }
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

/** Opens one sheet imperatively on mount — the caller gets no handle back. */
function SheetOpener() {
  const { showBottomSheet } = useBottomSheet();

  useEffect(() => {
    showBottomSheet({ render: () => null });
  }, [showBottomSheet]);

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

  it('does not re-ask Gorhom while the dismissal is already in flight', async () => {
    vi.useFakeTimers();

    try {
      const { show } = renderProvider();

      showSheet(show, {});
      const base = state.mountedBases[0];

      act(() => {
        base.onRequestClose?.();
      });
      expect(base.inst.dismiss).toHaveBeenCalledTimes(1);

      // The dismissal was accepted and the modal is animating out. Re-asking
      // now would be dismissing mid-flight — the way a sheet latches.
      base.inst.status.current = STATUS_DISMISSING;

      await act(async () => {
        vi.advanceTimersByTime(
          DISMISS_RETRY_INTERVAL_MS * (DISMISS_RETRY_ATTEMPTS + 2),
        );
      });

      expect(base.inst.dismiss).toHaveBeenCalledTimes(1);

      // Gorhom confirms; the retries are done watching either way.
      act(() => {
        base.onDismiss?.();
      });

      await act(async () => {
        vi.advanceTimersByTime(DISMISS_RETRY_INTERVAL_MS * 3);
      });

      expect(base.inst.dismiss).toHaveBeenCalledTimes(1);
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

  it('keeps an imperatively-shown sheet mounted when its caller unmounts', () => {
    // Sheets are owned by the provider, not by the component that opened them.
    // The imperative API hands the caller no id and no close handle, and
    // unmounting the caller must not pull the sheet out of React —
    // it stays put until something explicitly dismisses it.
    const { rerender } = render(
      <BottomSheetModalProvider enableLayoutProvider={false}>
        <SheetOpener />
      </BottomSheetModalProvider>,
    );

    expect(state.mountedBases).toHaveLength(1);
    const base = state.mountedBases[0];
    expect(base.inst.present).toHaveBeenCalledTimes(1);

    // The caller goes away; the provider stays mounted.
    rerender(
      <BottomSheetModalProvider enableLayoutProvider={false}>
        {null}
      </BottomSheetModalProvider>,
    );

    expect(state.mountedBases).toHaveLength(1);
    expect(base.inst.dismiss).not.toHaveBeenCalled();
  });

  it('closes a sheet that never presented by removing it, not dismissing it', () => {
    const { show } = renderProvider();

    showSheet(show, {});
    const first = state.mountedBases[0];

    // The first sheet is not dismissable, so its close is deferred and its
    // modal is still live natively — which holds the next sheet back from
    // presenting at all (assumption 3).
    first.inst.status.current = STATUS_ANIMATING;

    act(() => {
      first.onRequestClose?.();
    });

    showSheet(show, {});
    const second = state.mountedBases[1];
    expect(second.inst.present).not.toHaveBeenCalled();

    // Closing a sheet that never reached the native layer. There is nothing to
    // animate out, and dropping it from React cannot leak a portal entry, so it
    // goes straight out of the stack — `dismiss()` here would target a modal
    // Gorhom never mounted.
    act(() => {
      second.onRequestClose?.();
    });

    expect(second.inst.dismiss).not.toHaveBeenCalled();
    expect(state.mountedBases).toHaveLength(1);
  });

  it('drops a sheet Gorhom never confirms instead of leaving it unclosable', async () => {
    vi.useFakeTimers();

    try {
      const { show } = renderProvider();

      showSheet(show, {});
      const base = state.mountedBases[0];

      act(() => {
        base.onRequestClose?.();
      });
      expect(base.inst.dismiss).toHaveBeenCalledTimes(1);
      expect(state.mountedBases).toHaveLength(1);

      // Gorhom never confirms the teardown: the retries fire and then the
      // budget is gone. Left mounted the sheet would be a permanent, app-wide
      // touch blocker — `closing` blocks every close path — so it is dropped.
      await act(async () => {
        vi.advanceTimersByTime(
          DISMISS_RETRY_INTERVAL_MS * (DISMISS_RETRY_ATTEMPTS + 2),
        );
      });

      expect(state.mountedBases).toHaveLength(0);
    } finally {
      vi.useRealTimers();
    }
  });

  it('stops the dismissal retry chain and late onClose when the provider unmounts', async () => {
    vi.useFakeTimers();

    try {
      const ref: { show?: (params: ShowBottomSheetParams) => void } = {};
      const onClose = vi.fn();
      let closeSheet: (() => void) | undefined;

      const { unmount } = render(
        <BottomSheetModalProvider enableLayoutProvider={false}>
          <Harness onReady={(fn) => (ref.show = fn)} />
        </BottomSheetModalProvider>,
      );

      act(() => {
        ref.show?.({
          render: ({ closeSheet: cs }) => {
            closeSheet = cs;
            return null;
          },
          options: { onClose },
        });
      });

      const base = state.mountedBases[0];
      base.inst.status.current = STATUS_PRESENTED;

      act(() => {
        closeSheet?.();
      });
      expect(base.inst.dismiss).toHaveBeenCalledTimes(1);

      unmount();

      await act(async () => {
        vi.advanceTimersByTime(
          DISMISS_RETRY_INTERVAL_MS * (DISMISS_RETRY_ATTEMPTS + 2),
        );
      });

      // Nothing may keep working against a tree that is gone.
      expect(base.inst.dismiss).toHaveBeenCalledTimes(1);

      act(() => {
        base.onDismiss?.();
      });

      expect(onClose).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });

  it('leaves a sheet closable when a give-up cannot rule out an unmounted modal', async () => {
    vi.useFakeTimers();

    try {
      const { show } = renderProvider();

      showSheet(show, {});
      const base = state.mountedBases[0];

      act(() => {
        base.onRequestClose?.();
      });
      expect(base.inst.dismiss).toHaveBeenCalledTimes(1);

      // The handle stops reporting a status, so we can no longer tell whether
      // the modal ever materialised. Unmounting an INITIAL modal is the one
      // teardown that leaks (assumption 1), so unlike the previous scenario the
      // sheet is NOT dropped: it is released and stays closable.
      (base.inst.status as { current: number | undefined }).current = undefined;

      await act(async () => {
        vi.advanceTimersByTime(
          DISMISS_RETRY_INTERVAL_MS * (DISMISS_RETRY_ATTEMPTS + 2),
        );
      });

      expect(state.mountedBases).toHaveLength(1);

      // Released, not latched: the sheet is still ours, and a fresh request is
      // still honoured once the status is readable again.
      base.inst.status.current = STATUS_PRESENTED;

      const dismissCallsBefore = base.inst.dismiss.mock.calls.length;

      act(() => {
        base.onRequestClose?.();
      });

      expect(base.inst.dismiss.mock.calls.length).toBe(dismissCallsBefore + 1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('releases a sheet that never becomes dismissable instead of latching it', async () => {
    // The deferral poll runs on requestAnimationFrame, which fake timers do not
    // take over by default — without it the deadline below never arrives.
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'Date',
        'requestAnimationFrame',
        'cancelAnimationFrame',
      ],
    });

    try {
      const { show } = renderProvider();

      showSheet(show, {});
      const base = state.mountedBases[0];

      // The modal never settles: it stays ANIMATING past the deadline, so no
      // dismissal is ever handed over.
      base.inst.status.current = STATUS_ANIMATING;

      act(() => {
        base.onRequestClose?.();
      });
      expect(base.inst.dismiss).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(DISMISS_DEFER_TIMEOUT_MS + 100);
      });

      // Still here, and no longer marked as closing. `closing` blocks every
      // close path, so latching it would leave a sheet the user can see but
      // never dismiss.
      expect(base.inst.dismiss).not.toHaveBeenCalled();
      expect(state.mountedBases).toHaveLength(1);

      base.inst.status.current = STATUS_PRESENTED;

      act(() => {
        base.onRequestClose?.();
      });

      expect(base.inst.dismiss).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not re-ask a released sheet just because it is still below the top', async () => {
    // Releasing a sheet that would not settle must not read as "this one still
    // needs superseding". `resolveSheetsToClose` derives its answer from the
    // stack, so re-deriving on every change would queue the just-released sheet
    // straight back up — once per give-up, forever.
    vi.useFakeTimers({
      toFake: [
        'setTimeout',
        'clearTimeout',
        'setInterval',
        'clearInterval',
        'Date',
        'requestAnimationFrame',
        'cancelAnimationFrame',
      ],
    });

    try {
      const { show } = renderProvider();

      showSheet(show, {});
      const stuck = state.mountedBases[0];

      // Never settles, so its close is deferred and then released rather than
      // handed over.
      stuck.inst.status.current = STATUS_ANIMATING;

      // A newer sheet opens on top and supersedes it (the default behaviour).
      showSheet(show, { stackBehavior: 'replace' });

      await act(async () => {
        vi.advanceTimersByTime(DISMISS_DEFER_TIMEOUT_MS + 100);
      });

      expect(stuck.inst.dismiss).not.toHaveBeenCalled();
      expect(state.mountedBases).toHaveLength(2);

      // The modal settles late. Nothing may still be watching it: it was
      // released, not queued, so no dismissal was ever requested of it.
      stuck.inst.status.current = STATUS_PRESENTED;

      await act(async () => {
        vi.advanceTimersByTime(DISMISS_DEFER_TIMEOUT_MS + 100);
      });

      expect(stuck.inst.dismiss).not.toHaveBeenCalled();

      // Released, not forgotten — asking again still closes it.
      act(() => {
        stuck.onRequestClose?.();
      });

      expect(stuck.inst.dismiss).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});
