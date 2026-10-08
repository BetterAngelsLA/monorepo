/**
 * DEV-2541 — DESIRED behaviour for the sheet lifecycle. All four tests fail on
 * this branch: that is the point of the file.
 *
 * Each test states what the review says the code should do, so each failure is
 * the evidence for one finding. This is the artefact worth keeping — when a
 * finding is fixed the matching test goes green and belongs in the shipped
 * spec like any other regression test.
 *
 * Covers findings 3, 4 and 6. Finding 5 is a documentation nit with no
 * behaviour to assert; see the review comment on #2437.
 *
 * Gorhom + BottomSheetBase are mocked exactly as the shipped provider spec
 * does, so the tests control the imperative handle and the onDismiss signal.
 */
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode, useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShowBottomSheetParams } from '../../types';
import { BottomSheetModalControlled } from '../../BottomSheetModalControlled';
import {
  DISMISS_RETRY_ATTEMPTS,
  DISMISS_RETRY_INTERVAL_MS,
  GORHOM_MODAL_STATUS,
} from './constants';
import { BottomSheetModalProvider } from './BottomSheetModalProvider';
import { useBottomSheet } from './useBottomSheet';

type MockInstance = {
  present: ReturnType<typeof vi.fn>;
  dismiss: ReturnType<typeof vi.fn>;
  status: { current: number };
};

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
    enableLogging: vi.fn(),
    useBottomSheetModalInternal: () => ({
      containerLayoutState: { value: { height: 800, offset: {} } },
    }),
  };
});

vi.mock('../../core/BottomSheetBase', () => {
  const React = require('react');

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

    componentDidUpdate() {
      this.onRequestClose = this.props.onRequestClose as () => void;
      this.onDismiss = this.props.onDismiss as () => void;
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

function Passthrough({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}

function Owner({ mounted, isOpen }: { mounted: boolean; isOpen: boolean }) {
  if (!mounted) {
    return null;
  }

  return (
    <BottomSheetModalControlled isOpen={isOpen}>
      <>{null}</>
    </BottomSheetModalControlled>
  );
}

describe('desired behaviour — currently failing on DEV-2541', () => {
  beforeEach(() => {
    state.mountedBases.length = 0;
  });

  it('finding 4: a shared-backdrop tap notifies onClose at request time, like the per-sheet backdrop', () => {
    const ref: { show?: (params: ShowBottomSheetParams) => void } = {};

    render(
      <BottomSheetModalProvider
        enableSharedBackdrop
        enableLayoutProvider={false}
        defaultOptions={{ containerComponent: Passthrough }}
      >
        <Harness onReady={(fn) => (ref.show = fn)} />
      </BottomSheetModalProvider>,
    );

    const onClose = vi.fn();

    act(() => {
      ref.show?.({ render: () => null, options: { onClose } });
    });

    const base = state.mountedBases[0];
    base.inst.status.current = GORHOM_MODAL_STATUS.PRESENTED;

    act(() => {
      fireEvent.press(screen.getByRole('button'));
    });

    expect(base.inst.dismiss).toHaveBeenCalledTimes(1);
    // DESIRED: types.ts documents request-time notification for backdrop taps.
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('finding 3: a close request after the retries are exhausted still dismisses the sheet', async () => {
    vi.useFakeTimers();

    try {
      const ref: { show?: (params: ShowBottomSheetParams) => void } = {};
      const onClose = vi.fn();

      render(
        <BottomSheetModalProvider enableLayoutProvider={false}>
          <Harness onReady={(fn) => (ref.show = fn)} />
        </BottomSheetModalProvider>,
      );

      act(() => {
        ref.show?.({ render: () => null, options: { onClose } });
      });

      const base = state.mountedBases[0];
      base.inst.status.current = GORHOM_MODAL_STATUS.PRESENTED;

      act(() => {
        base.onRequestClose?.();
      });

      await act(async () => {
        vi.advanceTimersByTime(
          DISMISS_RETRY_INTERVAL_MS * (DISMISS_RETRY_ATTEMPTS + 2),
        );
      });

      // DESIRED: the sheet is not latched shut — another tap tries again.
      act(() => {
        base.onRequestClose?.();
      });

      expect(base.inst.dismiss).toHaveBeenCalledTimes(
        1 + DISMISS_RETRY_ATTEMPTS + 1,
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('finding 6: unmounting the owner dismisses its sheet', () => {
    const ref: { show?: (params: ShowBottomSheetParams) => void } = {};

    const tree = (mounted: boolean, isOpen: boolean) => (
      <BottomSheetModalProvider enableLayoutProvider={false}>
        <Harness onReady={(fn) => (ref.show = fn)} />
        <Owner mounted={mounted} isOpen={isOpen} />
      </BottomSheetModalProvider>
    );

    const { rerender } = render(tree(true, false));

    rerender(tree(true, true));
    const sheet = state.mountedBases[0];

    rerender(tree(false, false));

    // DESIRED: no ghost sheet left behind by an unmounted owner.
    expect(sheet.inst.dismiss).toHaveBeenCalledTimes(1);
  });

  it('finding 6: unmounting the provider stops the retry chain and late onClose', async () => {
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
      base.inst.status.current = GORHOM_MODAL_STATUS.PRESENTED;

      act(() => {
        closeSheet?.();
      });

      unmount();

      await act(async () => {
        vi.advanceTimersByTime(
          DISMISS_RETRY_INTERVAL_MS * (DISMISS_RETRY_ATTEMPTS + 2),
        );
      });

      // DESIRED: nothing keeps working against a tree that is gone.
      expect(base.inst.dismiss).toHaveBeenCalledTimes(1);

      act(() => {
        base.onDismiss?.();
      });

      expect(onClose).not.toHaveBeenCalled();
    } finally {
      vi.useRealTimers();
    }
  });
});
