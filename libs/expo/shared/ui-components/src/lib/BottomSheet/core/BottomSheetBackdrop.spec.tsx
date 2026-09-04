import { fireEvent, render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BottomSheetBackdrop } from './BottomSheetBackdrop';

/**
 * BottomSheetBackdrop
 *
 * Documents the dismissal contract:
 * - a tap is forwarded to onRequestClose (the app's reliable dismiss path)
 * - Gorhom's own close is NOT used (pressBehavior must not be 'close'),
 *   otherwise the provider's forceClose and Gorhom's close() would double-dismiss
 * - a numeric pressBehavior keeps the tap gesture attached while doing nothing
 */

const mocks = vi.hoisted(() => ({
  onGorhomProps: vi.fn(),
}));

vi.mock('@gorhom/bottom-sheet', () => {
  const { Pressable } = require('react-native');

  return {
    BottomSheetBackdrop: (props: {
      onPress?: () => void;
      pressBehavior?: unknown;
    }) => {
      mocks.onGorhomProps(props);
      return (
        <Pressable
          testID="gorhom-backdrop"
          accessibilityRole="button"
          onPress={props.onPress}
        />
      );
    },
  };
});

describe('BottomSheetBackdrop', () => {
  // Gorhom passes animatedIndex/animatedPosition into backdrop components; the
  // component only forwards them, so a plain object suffices here.
  const fakeSharedValue = { value: 0 } as never;

  beforeEach(() => {
    mocks.onGorhomProps.mockClear();
  });

  it('forwards taps to onRequestClose as the single dismissal path', () => {
    const onRequestClose = vi.fn();
    const { getByTestId } = render(
      <BottomSheetBackdrop
        animatedIndex={fakeSharedValue}
        animatedPosition={fakeSharedValue}
        onRequestClose={onRequestClose}
      />,
    );

    const gorhomProps = mocks.onGorhomProps.mock.calls[0][0];

    // Gorhom must not close the sheet itself — the provider force-closes via
    // onRequestClose. Keeping 'close' here would double-dismiss.
    expect(gorhomProps.pressBehavior).not.toBe('close');

    // A numeric pressBehavior keeps the tap gesture (onPress fires) but is a
    // no-op snap, so dismissal happens exactly once, through onRequestClose.
    expect(gorhomProps.pressBehavior).toBe(0);
    expect(gorhomProps.onPress).toBe(onRequestClose);

    fireEvent.press(getByTestId('gorhom-backdrop'));
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it('renders nothing when disableBackdrop is set', () => {
    const { queryByTestId } = render(
      <BottomSheetBackdrop
        animatedIndex={fakeSharedValue}
        animatedPosition={fakeSharedValue}
        disableBackdrop
      />,
    );
    expect(queryByTestId('gorhom-backdrop')).toBeNull();
  });
});
