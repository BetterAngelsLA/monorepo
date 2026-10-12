import { act, fireEvent, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MediaPicker } from './MediaPicker';

const mocks = vi.hoisted(() => ({
  pickImage: vi.fn(),
  pickDocuments: vi.fn(),
}));

vi.mock('../BottomSheet', () => ({
  // Mimic a real sheet: its children stay mounted (and tappable) while the
  // sheet animates out — the window that allowed a second picker launch.
  BottomSheetModalControlled: ({ children }: { children: ReactNode }) =>
    children ?? null,
}));

vi.mock('../Camera', () => ({
  CameraSheet: () => null,
}));

vi.mock('./useImagePicker', () => ({
  useImagePicker: () => ({ pickImage: mocks.pickImage }),
}));

vi.mock('./useDocumentPicker', () => ({
  useDocumentPicker: () => ({ pickDocuments: mocks.pickDocuments }),
}));

async function renderPicker() {
  return render(
    <MediaPicker
      allowMultiple={false}
      isOpen
      onClose={vi.fn()}
      onCameraCapture={vi.fn()}
      onFilesSelected={vi.fn()}
    />,
  );
}

/**
 * Both scenarios below need two taps that OVERLAP: the second has to land while
 * the first launch is still in flight, which is exactly what the picker's
 * in-flight guard is for.
 *
 * Under RNTL 14 every `fireEvent` is act-wrapped, so two taps started and
 * awaited separately overlap without nesting and leave React's act state dirty
 * — the next test then renders an empty tree. Starting and awaiting both inside
 * a single `act` nests them instead, which is what React supports.
 */
describe('MediaPicker', () => {
  beforeEach(() => {
    mocks.pickImage.mockReset();
    mocks.pickDocuments.mockReset();
  });

  it('launches the image picker only once on a rapid double tap', async () => {
    // Held open so the second tap lands while the first launch is in flight.
    let settlePick!: (result: { type: 'cancel' }) => void;
    mocks.pickImage.mockReturnValue(
      new Promise<{ type: 'cancel' }>((resolve) => {
        settlePick = resolve;
      }),
    );

    const { getByTestId } = await renderPicker();

    await act(async () => {
      const firstTap = fireEvent.press(getByTestId('media-picker-image-btn'));
      const secondTap = fireEvent.press(getByTestId('media-picker-image-btn'));

      expect(mocks.pickImage).toHaveBeenCalledTimes(1);

      // Let the launch finish before the test ends: a press still in flight
      // would be pending while the next test runs.
      settlePick({ type: 'cancel' });
      await firstTap;
      await secondTap;
    });
  });

  it('launches only one picker when two options are tapped rapidly', async () => {
    let settlePick!: (result: { type: 'cancel' }) => void;
    mocks.pickImage.mockReturnValue(
      new Promise<{ type: 'cancel' }>((resolve) => {
        settlePick = resolve;
      }),
    );
    // Never resolves: if the guard fails, the file tap launches this instead,
    // and `pickDocuments` being uncalled is the assertion that it did not.
    mocks.pickDocuments.mockReturnValue(new Promise(() => undefined));

    const { getByTestId } = await renderPicker();

    await act(async () => {
      const firstTap = fireEvent.press(getByTestId('media-picker-image-btn'));
      const secondTap = fireEvent.press(getByTestId('media-picker-file-btn'));

      expect(mocks.pickImage).toHaveBeenCalledTimes(1);
      expect(mocks.pickDocuments).not.toHaveBeenCalled();

      settlePick({ type: 'cancel' });
      await firstTap;
      // The second tap hit the in-flight guard and returned, so it settles on
      // its own.
      await secondTap;
    });
  });
});
