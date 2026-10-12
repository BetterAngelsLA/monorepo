import { fireEvent, render } from '@testing-library/react-native';
import type { ComponentType, ReactNode } from 'react';
import { Text } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BottomSheetOptions } from '../types';
import { BottomSheetBase } from './BottomSheetBase';

/**
 * Gorhom is mocked down to the pieces `BottomSheetBase` actually uses, so the
 * test can observe which `handleComponent` it hands over and whether the
 * in-content header is still rendered.
 */
vi.mock('@gorhom/bottom-sheet', () => {
  const { View } = require('react-native');

  const BottomSheetModal = (props: {
    ref?: unknown;
    handleComponent?: ComponentType | null;
    children?: ReactNode;
  }) => {
    const Handle = props.handleComponent;

    return (
      <View testID="gorhom-modal">
        {Handle ? (
          <View testID="handle-slot">
            <Handle />
          </View>
        ) : null}
        {props.children}
      </View>
    );
  };

  return {
    BottomSheetModal,
    BottomSheetView: ({ children }: { children?: ReactNode }) => (
      <>{children}</>
    ),
    BottomSheetScrollView: ({ children }: { children?: ReactNode }) => (
      <>{children}</>
    ),
  };
});

const CONTENT_TEST_ID = 'sheet-content';
const HANDLE_SLOT_TEST_ID = 'handle-slot';
const HANDLE_INDICATOR_TEST_ID = 'bottom-sheet-handle';

const onRequestClose = vi.fn();

beforeEach(() => {
  onRequestClose.mockClear();
});

function renderBase(options: BottomSheetOptions) {
  return render(
    <BottomSheetBase options={options} onRequestClose={onRequestClose}>
      <Text testID={CONTENT_TEST_ID}>content</Text>
    </BottomSheetBase>,
  );
}

/**
 * BottomSheetBase top-bar wiring
 *
 * The unified `BottomSheetTopBar` is mounted as Gorhom's `handleComponent`
 * whenever the sheet has top-bar content; with no content the sheet renders no
 * top chrome at all. `topBarProps` is customization only — it does not toggle.
 */
describe('BottomSheetBase topBarProps', () => {
  it('renders no top chrome when the sheet has no content', async () => {
    const { queryByTestId, queryAllByRole } = await renderBase({});

    expect(queryByTestId(HANDLE_SLOT_TEST_ID)).toBeNull();
    expect(queryAllByRole('button')).toHaveLength(0);
  });

  it('mounts BottomSheetTopBar as the handle when the sheet has a close button', async () => {
    const { getByTestId, getAllByRole } = await renderBase({
      showCloseButton: true,
    });

    expect(getByTestId(HANDLE_SLOT_TEST_ID)).toBeTruthy();
    expect(getByTestId(CONTENT_TEST_ID)).toBeTruthy();
    expect(getAllByRole('button')).toHaveLength(1);
  });

  it('shows the handle indicator in the bar only when showHandle is set', async () => {
    const withoutHandle = await renderBase({ showCloseButton: true });
    expect(withoutHandle.queryByTestId(HANDLE_INDICATOR_TEST_ID)).toBeNull();

    const withHandle = await renderBase({
      showHandle: true,
      showCloseButton: true,
    });
    expect(withHandle.getByTestId(HANDLE_INDICATOR_TEST_ID)).toBeTruthy();
  });

  it('lets the caller customize the bar through topBarProps', async () => {
    const { getByTestId } = await renderBase({
      showCloseButton: true,
      topBarProps: { leftSlot: <Text testID="left-slot">back</Text> },
    });

    expect(getByTestId(HANDLE_SLOT_TEST_ID)).toBeTruthy();
    expect(getByTestId('left-slot')).toBeTruthy();
  });

  it('keeps showHandle sheet-owned — a topBarProps value cannot force the indicator', async () => {
    const { queryByTestId } = await renderBase({
      showCloseButton: true,
      topBarProps: { showHandle: true },
    });

    // No sheet-level showHandle → the indicator stays off.
    expect(queryByTestId(HANDLE_INDICATOR_TEST_ID)).toBeNull();
  });

  it('always wires the bar close button to the sheet dismissal', async () => {
    const callerOnClose = vi.fn();
    const { getByRole } = await renderBase({
      showCloseButton: true,
      topBarProps: { onClose: callerOnClose },
    });

    await fireEvent.press(getByRole('button'));

    expect(onRequestClose).toHaveBeenCalledTimes(1);
    expect(callerOnClose).not.toHaveBeenCalled();
  });
});
