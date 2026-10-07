import { fireEvent, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
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

function renderPicker() {
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

describe('MediaPicker', () => {
  beforeEach(() => {
    mocks.pickImage.mockReset();
    mocks.pickDocuments.mockReset();
  });

  it('launches the image picker only once on a rapid double tap', () => {
    // Never resolves — keeps the first launch in flight.
    mocks.pickImage.mockReturnValue(new Promise(() => undefined));

    const { getByTestId } = renderPicker();

    fireEvent.press(getByTestId('media-picker-image-btn'));
    fireEvent.press(getByTestId('media-picker-image-btn'));

    expect(mocks.pickImage).toHaveBeenCalledTimes(1);
  });

  it('launches only one picker when two options are tapped rapidly', () => {
    mocks.pickImage.mockReturnValue(new Promise(() => undefined));
    mocks.pickDocuments.mockReturnValue(new Promise(() => undefined));

    const { getByTestId } = renderPicker();

    fireEvent.press(getByTestId('media-picker-image-btn'));
    fireEvent.press(getByTestId('media-picker-file-btn'));

    expect(mocks.pickImage).toHaveBeenCalledTimes(1);
    expect(mocks.pickDocuments).not.toHaveBeenCalled();
  });
});
