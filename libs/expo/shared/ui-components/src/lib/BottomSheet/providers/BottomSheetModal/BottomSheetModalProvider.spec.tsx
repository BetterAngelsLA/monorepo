import { act, render } from '@testing-library/react-native';
import { useEffect } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ShowBottomSheetParams } from '../../types';
import { BottomSheetModalProvider } from './BottomSheetModalProvider';
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
};

type MountedBase = {
  inst: MockInstance;
  onRequestClose?: () => void;
  onDismiss?: () => void;
};

const state = vi.hoisted(() => ({
  mountedBases: [] as MountedBase[],
  makeInstance: (): MockInstance => ({ present: vi.fn(), dismiss: vi.fn() }),
}));

vi.mock('@gorhom/bottom-sheet', () => {
  const GbsProvider = ({ children }: { children?: unknown }) =>
    children ?? null;

  return {
    BottomSheetModal: class BottomSheetModal {},
    BottomSheetModalProvider: GbsProvider,
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
    onRequestClose!: () => void;
    onDismiss!: () => void;
    entry?: MountedBase;

    constructor(props: Record<string, unknown>) {
      super(props);
      const inst = state.makeInstance();
      this.present = inst.present;
      this.dismiss = inst.dismiss;
      this.onRequestClose = props.onRequestClose as () => void;
      this.onDismiss = props.onDismiss as () => void;
    }

    componentDidMount() {
      this.entry = {
        inst: { present: this.present, dismiss: this.dismiss },
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

  it("'replace' dismisses the previous sheet before mounting the new one", () => {
    const { show } = renderProvider();

    showSheet(show, { stackBehavior: 'replace' });
    const first = state.mountedBases[0];
    expect(first.inst.dismiss).not.toHaveBeenCalled();

    showSheet(show, { stackBehavior: 'replace' });

    expect(first.inst.dismiss).toHaveBeenCalledTimes(1);
    expect(state.mountedBases).toHaveLength(1);
  });

  it('onRequestClose dismisses the sheet (backdrop / header X path)', () => {
    const { show } = renderProvider();

    showSheet(show);
    const base = state.mountedBases[0];

    act(() => {
      base.onRequestClose?.();
    });

    expect(base.inst.dismiss).toHaveBeenCalledTimes(1);
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
});
