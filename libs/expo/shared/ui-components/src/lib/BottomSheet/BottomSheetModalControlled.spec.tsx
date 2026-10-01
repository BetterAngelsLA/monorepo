import { act, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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
  options: { onClose?: (id: string) => void };
};

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

function showCalls(): TShowCall[] {
  return mocks.showBottomSheet.mock.calls.map((call) => call[0] as TShowCall);
}

/** Simulates the provider mounting the sheet that owns `closeSheet`. */
function mountSheet(index: number, id: string, closeSheet: () => void) {
  act(() => {
    showCalls()[index].render({ id, closeSheet });
  });
}

/** Simulates Gorhom reporting that a sheet fully dismissed. */
function completeDismissal(index: number, id: string) {
  act(() => {
    showCalls()[index].options.onClose?.(id);
  });
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
    mountSheet(0, 'sheet-1', closeSheet);
    expect(closeSheet).not.toHaveBeenCalled();
  });

  it('dismisses the sheet when isOpen flips to false after it mounted', () => {
    const { rerender } = render(<Controlled isOpen={false} />);
    rerender(<Controlled isOpen={true} />);

    const closeSheet = vi.fn();
    mountSheet(0, 'sheet-1', closeSheet);

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
      showCalls()[0].render({ id: 'sheet-1', closeSheet });
    });

    // The close is scheduled on a microtask to avoid a render-phase setState.
    await act(async () => {
      await Promise.resolve();
    });

    expect(closeSheet).toHaveBeenCalled();
  });

  it('reopening during a close keeps the NEW sheet functional (stale onClose ignored)', () => {
    const parentClose = vi.fn();
    const { rerender } = render(
      <Controlled isOpen={false} onClose={parentClose} />,
    );

    // Open #1.
    rerender(<Controlled isOpen={true} onClose={parentClose} />);
    const close1 = vi.fn();
    mountSheet(0, 'sheet-1', close1);

    // Close via state (like Cancel).
    rerender(<Controlled isOpen={false} onClose={parentClose} />);
    expect(close1).toHaveBeenCalledTimes(1);

    // Rapid reopen → a brand-new sheet is presented.
    rerender(<Controlled isOpen={true} onClose={parentClose} />);
    expect(mocks.showBottomSheet).toHaveBeenCalledTimes(2);
    const close2 = vi.fn();
    mountSheet(1, 'sheet-2', close2);

    // The OLD sheet finishes dismissing AFTER the reopen. Its onClose is
    // stale and must not notify the parent or break the new sheet.
    completeDismissal(0, 'sheet-1');
    expect(parentClose).not.toHaveBeenCalled();

    // The new sheet must still be closable.
    rerender(<Controlled isOpen={false} onClose={parentClose} />);
    expect(close2).toHaveBeenCalledTimes(1);
    expect(close1).toHaveBeenCalledTimes(1);
  });

  it('notifies the parent when the active sheet is dismissed externally', () => {
    const parentClose = vi.fn();
    const { rerender } = render(
      <Controlled isOpen={false} onClose={parentClose} />,
    );

    rerender(<Controlled isOpen={true} onClose={parentClose} />);
    mountSheet(0, 'sheet-1', vi.fn());

    // Provider surfaces a user-initiated dismissal (backdrop / pan-down /
    // header) via options.onClose with the active sheet's id.
    completeDismissal(0, 'sheet-1');

    expect(parentClose).toHaveBeenCalledTimes(1);
  });

  it('does not notify the parent when the close originated from state', () => {
    const parentClose = vi.fn();
    const { rerender } = render(
      <Controlled isOpen={false} onClose={parentClose} />,
    );

    rerender(<Controlled isOpen={true} onClose={parentClose} />);
    mountSheet(0, 'sheet-1', vi.fn());

    // State-driven close (isOpen false) — the parent already knows.
    rerender(<Controlled isOpen={false} onClose={parentClose} />);

    // Gorhom reports the dismissal completing.
    completeDismissal(0, 'sheet-1');

    expect(parentClose).not.toHaveBeenCalled();
  });
});
