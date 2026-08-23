import { act, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import { BottomSheetModalControlled } from './BottomSheetModalControlled';

const mocks = vi.hoisted(() => ({
  showBottomSheet: vi.fn(),
}));

vi.mock('./providers/BottomSheetModal/useBottomSheet', () => ({
  useBottomSheet: () => ({ showBottomSheet: mocks.showBottomSheet }),
}));

type TRenderArgs = { closeSheet: () => void; id: string };

type TShowCall = {
  render: (args: TRenderArgs) => ReactNode;
  options: { onClose?: () => void };
};

function lastCall(): TShowCall {
  const calls = mocks.showBottomSheet.mock.calls;

  return calls[calls.length - 1][0];
}

function Controlled({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose?: () => void;
}) {
  return (
    <BottomSheetModalControlled isOpen={isOpen} onClose={onClose}>
      <Text>menu</Text>
    </BottomSheetModalControlled>
  );
}

function mountSheet(call: TShowCall, id: string) {
  const closeSheet = vi.fn();

  act(() => {
    call.render({ closeSheet, id });
  });

  return closeSheet;
}

describe('BottomSheetModalControlled', () => {
  beforeEach(() => {
    mocks.showBottomSheet.mockReset();
  });

  it('presents the sheet when isOpen becomes true', () => {
    const { rerender } = render(<Controlled isOpen={false} />);

    rerender(<Controlled isOpen={true} />);

    expect(mocks.showBottomSheet).toHaveBeenCalledTimes(1);

    // Sheet mounts while isOpen is true → it stays open.
    const closeSheet = vi.fn();
    act(() => {
      lastCall().render({ closeSheet, id: 'sheet-1' });
    });
    expect(closeSheet).not.toHaveBeenCalled();
  });

  it('dismisses the sheet when isOpen flips to false after it mounted', () => {
    const { rerender } = render(<Controlled isOpen={false} />);
    rerender(<Controlled isOpen={true} />);

    const closeSheet = vi.fn();
    act(() => {
      lastCall().render({ closeSheet, id: 'sheet-1' });
    });

    rerender(<Controlled isOpen={false} />);
    expect(closeSheet).toHaveBeenCalled();
  });

  it('dismisses the sheet even when it mounts after isOpen already went false', async () => {
    const { rerender } = render(<Controlled isOpen={false} />);
    rerender(<Controlled isOpen={true} />);

    // isOpen flips back to false BEFORE the sheet's render callback runs
    // (the mount-race that left the media picker open).
    rerender(<Controlled isOpen={false} />);

    const closeSheet = vi.fn();
    act(() => {
      lastCall().render({ closeSheet, id: 'sheet-1' });
    });

    // The close is scheduled on a microtask to avoid a render-phase setState.
    await act(async () => {
      await Promise.resolve();
    });

    expect(closeSheet).toHaveBeenCalled();
  });

  it('ignores a stale onClose from an older sheet after a rapid reopen', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Controlled isOpen={false} onClose={onClose} />,
    );

    // Open → first sheet generation mounts.
    rerender(<Controlled isOpen={true} onClose={onClose} />);
    const firstCall = lastCall();
    const firstClose = mountSheet(firstCall, 'sheet-1');

    // Close → first sheet starts dismissing.
    rerender(<Controlled isOpen={false} onClose={onClose} />);
    expect(firstClose).toHaveBeenCalled();

    // Reopen quickly → a second sheet generation mounts while the first is
    // still dismissing.
    rerender(<Controlled isOpen={true} onClose={onClose} />);
    expect(mocks.showBottomSheet).toHaveBeenCalledTimes(2);
    const secondCall = lastCall();
    const secondClose = mountSheet(secondCall, 'sheet-2');

    // The first sheet's onDismiss fires AFTER the second sheet mounted. It
    // must not clobber the second sheet's close handle nor notify the parent
    // (that orphaned the newer sheet and leaked the camera).
    act(() => {
      firstCall.options.onClose?.();
    });
    expect(onClose).not.toHaveBeenCalled();

    // The second sheet is still fully closable via state.
    rerender(<Controlled isOpen={false} onClose={onClose} />);
    expect(secondClose).toHaveBeenCalled();
  });

  it('does not notify the parent when the close was driven by isOpen', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Controlled isOpen={false} onClose={onClose} />,
    );
    rerender(<Controlled isOpen={true} onClose={onClose} />);

    const call = lastCall();
    mountSheet(call, 'sheet-1');

    rerender(<Controlled isOpen={false} onClose={onClose} />);

    // onDismiss arrives after the state-driven close.
    act(() => {
      call.options.onClose?.();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('notifies the parent when the current sheet is dismissed externally', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Controlled isOpen={false} onClose={onClose} />,
    );
    rerender(<Controlled isOpen={true} onClose={onClose} />);

    const call = lastCall();
    mountSheet(call, 'sheet-1');

    // gorhom reports a dismissal that was not driven by isOpen (e.g. the
    // provider replaced the sheet, or a gesture dismissed it).
    act(() => {
      call.options.onClose?.();
    });

    expect(onClose).toHaveBeenCalled();
  });
});
