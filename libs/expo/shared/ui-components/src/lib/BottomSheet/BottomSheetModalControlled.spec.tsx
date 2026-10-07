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

type TRenderArgs = { closeSheet: () => void };

function Controlled({ isOpen }: { isOpen: boolean }) {
  return (
    <BottomSheetModalControlled isOpen={isOpen}>
      <Text>menu</Text>
    </BottomSheetModalControlled>
  );
}

function mountSheetRender(): (args: TRenderArgs) => ReactNode {
  return mocks.showBottomSheet.mock.calls[0][0].render;
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
      mountSheetRender()({ closeSheet });
    });
    expect(closeSheet).not.toHaveBeenCalled();
  });

  it('dismisses the sheet when isOpen flips to false after it mounted', () => {
    const { rerender } = render(<Controlled isOpen={false} />);
    rerender(<Controlled isOpen={true} />);

    const closeSheet = vi.fn();
    act(() => {
      mountSheetRender()({ closeSheet });
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
      mountSheetRender()({ closeSheet });
    });

    // The close is scheduled on a microtask to avoid a render-phase setState.
    await act(async () => {
      await Promise.resolve();
    });

    expect(closeSheet).toHaveBeenCalled();
  });

  it('dismisses the sheet when unmounted while open', () => {
    const { rerender, unmount } = render(<Controlled isOpen={false} />);
    rerender(<Controlled isOpen={true} />);

    const closeSheet = vi.fn();
    act(() => {
      mountSheetRender()({ closeSheet });
    });

    unmount();

    expect(closeSheet).toHaveBeenCalled();
  });

  it('dismisses the sheet when unmounted before its render callback runs', async () => {
    const { rerender, unmount } = render(<Controlled isOpen={false} />);
    rerender(<Controlled isOpen={true} />);

    // The host goes away BEFORE the provider renders (invokes) the sheet, so
    // there is no `closeSheet` to call yet.
    unmount();

    const closeSheet = vi.fn();
    act(() => {
      mountSheetRender()({ closeSheet });
    });

    // The render callback's staleness guard defers the dismiss to a microtask.
    await act(async () => {
      await Promise.resolve();
    });

    expect(closeSheet).toHaveBeenCalled();
  });
});
