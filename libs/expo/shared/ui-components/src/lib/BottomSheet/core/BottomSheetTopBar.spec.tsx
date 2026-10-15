import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { describe, expect, it, vi } from 'vitest';
import { BottomSheetTopBar } from './BottomSheetTopBar';

const HANDLE_TEST_ID = 'bottom-sheet-handle';

/**
 * BottomSheetTopBar
 *
 * Documents the top-band contract:
 * - renders nothing (so Gorhom reserves no space) when there's no chrome/header
 * - the handle is opt-in via `showHandle`
 * - a provided `onClose` renders exactly one close button that dismisses
 * - the header row only exists when `header` is provided (single band otherwise)
 */
describe('BottomSheetTopBar', () => {
  it('renders nothing when there is no chrome and no header', async () => {
    const { toJSON } = await render(<BottomSheetTopBar />);

    expect(toJSON()).toBeNull();
  });

  it('renders the handle only when showHandle is set', async () => {
    const { queryByTestId, rerender } = await render(<BottomSheetTopBar />);
    expect(queryByTestId(HANDLE_TEST_ID)).toBeNull();

    await rerender(<BottomSheetTopBar showHandle />);

    expect(queryByTestId(HANDLE_TEST_ID)).not.toBeNull();
  });

  it('renders a single close button that dismisses the sheet', async () => {
    const onClose = vi.fn();
    const { getByRole } = await render(
      <BottomSheetTopBar
        onClose={onClose}
        closeBtnAccessibilityHint="closes the sheet"
      />,
    );

    const closeButton = getByRole('button');
    expect(closeButton.props.accessibilityHint).toBe('closes the sheet');

    await fireEvent.press(closeButton);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders the left slot when provided', async () => {
    const { getByTestId } = await render(
      <BottomSheetTopBar leftSlot={<Text testID="left-slot">back</Text>} />,
    );

    expect(getByTestId('left-slot')).toBeTruthy();
  });

  it('only renders the header row when header is provided', async () => {
    const { queryByTestId, rerender } = await render(
      <BottomSheetTopBar showHandle />,
    );
    expect(queryByTestId('header-slot')).toBeNull();

    await rerender(
      <BottomSheetTopBar
        showHandle
        header={<Text testID="header-slot">Title</Text>}
      />,
    );

    expect(queryByTestId('header-slot')).not.toBeNull();
  });

  it('keeps the close button reachable alongside a handle (no merging)', async () => {
    const onClose = vi.fn();
    const { getByRole, getByTestId } = await render(
      <BottomSheetTopBar showHandle onClose={onClose} testId="top-bar" />,
    );

    // Both the bar and the handle are present…
    expect(getByTestId('top-bar')).toBeTruthy();
    expect(getByTestId(HANDLE_TEST_ID)).toBeTruthy();

    // …and the close button is still exposed as its own element.
    await fireEvent.press(getByRole('button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
