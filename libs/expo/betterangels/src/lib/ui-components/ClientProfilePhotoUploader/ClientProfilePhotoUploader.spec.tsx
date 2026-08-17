import { act, render } from '@testing-library/react-native';
import { View } from 'react-native';
import { ClientProfilePhotoUploader } from './ClientProfilePhotoUploader';

const mocks = vi.hoisted(() => ({
  uploadPhoto: vi.fn(),
  showSnackbar: vi.fn(),
  mediaPickerProps: [] as Array<{
    isOpen: boolean;
    onFilesSelected?: (files: unknown[]) => void;
    onCameraCapture?: (file: unknown) => void;
  }>,
}));

vi.mock('@monorepo/expo/shared/icons', () => ({
  WFEdit: () => null,
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  Avatar: () => <View testID="avatar" />,
  MediaPicker: (props: {
    isOpen: boolean;
    onFilesSelected?: (files: unknown[]) => void;
    onCameraCapture?: (file: unknown) => void;
  }) => {
    mocks.mediaPickerProps.push(props);

    return null;
  },
}));

vi.mock('../../hooks/snackbar/useSnackbar', () => ({
  __esModule: true,
  default: () => ({ showSnackbar: mocks.showSnackbar }),
}));

vi.mock('./useClientProfilePhotoUpload', () => ({
  useClientProfilePhotoUpload: () => ({ uploadPhoto: mocks.uploadPhoto }),
}));

vi.mock('../../screens/Client/ClientHeader/ProfilePhotoModal', () => ({
  ProfilePhotoModal: () => null,
}));

const sampleFile = {
  name: 'photo.jpg',
  type: 'image/jpeg',
  uri: 'file://photo.jpg',
};

function openPickerAndSelect(file: unknown) {
  const latest = mocks.mediaPickerProps[mocks.mediaPickerProps.length - 1];

  return act(async () => {
    latest.onFilesSelected?.([file]);
  });
}

describe('ClientProfilePhotoUploader', () => {
  beforeEach(() => {
    mocks.uploadPhoto.mockReset();
    mocks.showSnackbar.mockClear();
    mocks.mediaPickerProps.length = 0;
  });

  it('uploads the selected photo', async () => {
    mocks.uploadPhoto.mockResolvedValue(undefined);

    render(<ClientProfilePhotoUploader clientId="client-1" />);

    await openPickerAndSelect(sampleFile);

    // No background session: this flow blocks on its own avatar spinner, so
    // registering it in the global store only ever produced a phantom row in
    // the progress bar for work already on screen.
    expect(mocks.uploadPhoto).toHaveBeenCalledWith({
      clientProfileId: 'client-1',
      file: expect.objectContaining(sampleFile),
    });
    expect(mocks.showSnackbar).not.toHaveBeenCalled();
  });

  it('shows an error snackbar when the upload fails', async () => {
    mocks.uploadPhoto.mockRejectedValue(new Error('boom'));

    render(<ClientProfilePhotoUploader clientId="client-1" />);

    await openPickerAndSelect(sampleFile);

    expect(mocks.showSnackbar).toHaveBeenCalledWith({
      message: 'Sorry, something went wrong. Please try again.',
      type: 'error',
    });
  });

  it('passes through a captured camera file', async () => {
    mocks.uploadPhoto.mockResolvedValue(undefined);

    render(<ClientProfilePhotoUploader clientId="client-1" />);

    const latest = mocks.mediaPickerProps[mocks.mediaPickerProps.length - 1];

    await act(async () => {
      latest.onCameraCapture?.(sampleFile);
    });

    expect(mocks.uploadPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ file: expect.objectContaining(sampleFile) }),
    );
  });
});
