import { act, fireEvent, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { ClientProfilePhotoUploader } from './ClientProfilePhotoUploader';

const mocks = vi.hoisted(() => ({
  uploadPhoto: vi.fn(),
  endUpload: vi.fn(),
  failUpload: vi.fn(),
  isAborted: false,
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

vi.mock('../../providers', () => ({
  useUploadSession: () => ({
    begin: vi.fn(() => ({
      id: 'session-1',
      signal: new AbortController().signal,
      isAborted: () => mocks.isAborted,
    })),
    setUploadManifest: vi.fn(),
    updateUpload: vi.fn(),
    failUpload: mocks.failUpload,
    endUpload: mocks.endUpload,
  }),
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
    mocks.endUpload.mockClear();
    mocks.failUpload.mockClear();
    mocks.isAborted = false;
    mocks.mediaPickerProps.length = 0;
  });

  it('starts a session and uploads with signal + progress callbacks', async () => {
    mocks.uploadPhoto.mockResolvedValue(undefined);

    render(<ClientProfilePhotoUploader clientId="client-1" />);

    await openPickerAndSelect(sampleFile);

    expect(mocks.uploadPhoto).toHaveBeenCalledWith(
      expect.objectContaining({
        clientProfileId: 'client-1',
        file: sampleFile,
        signal: expect.any(AbortSignal),
        onManifest: expect.any(Function),
        onProgress: expect.any(Function),
      }),
    );
    expect(mocks.endUpload).toHaveBeenCalledWith('session-1');
    expect(mocks.failUpload).not.toHaveBeenCalled();
  });

  it('marks the session failed with a message when the upload errors', async () => {
    mocks.uploadPhoto.mockRejectedValue(new Error('boom'));

    render(<ClientProfilePhotoUploader clientId="client-1" />);

    await openPickerAndSelect(sampleFile);

    expect(mocks.failUpload).toHaveBeenCalledWith(
      'session-1',
      'Sorry, something went wrong. Please try again.',
    );
    expect(mocks.endUpload).not.toHaveBeenCalled();
  });

  it('ends the session when the upload was aborted via the drawer', async () => {
    mocks.isAborted = true;
    mocks.uploadPhoto.mockRejectedValue(new Error('aborted'));

    render(<ClientProfilePhotoUploader clientId="client-1" />);

    await openPickerAndSelect(sampleFile);

    expect(mocks.endUpload).toHaveBeenCalledWith('session-1');
    expect(mocks.failUpload).not.toHaveBeenCalled();
  });

  it('passes through a captured camera file', async () => {
    mocks.uploadPhoto.mockResolvedValue(undefined);

    render(<ClientProfilePhotoUploader clientId="client-1" />);

    const latest = mocks.mediaPickerProps[mocks.mediaPickerProps.length - 1];

    await act(async () => {
      latest.onCameraCapture?.(sampleFile);
    });

    expect(mocks.uploadPhoto).toHaveBeenCalledWith(
      expect.objectContaining({ file: sampleFile }),
    );
  });
});
