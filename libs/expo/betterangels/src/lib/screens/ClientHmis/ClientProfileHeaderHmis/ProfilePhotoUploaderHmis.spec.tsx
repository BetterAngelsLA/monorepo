import { act, render } from '@testing-library/react-native';
import { ProfilePhotoUploaderHmis } from './ProfilePhotoUploaderHmis';

const mocks = vi.hoisted(() => ({
  uploadClientPhoto: vi.fn(),
  refetchQueries: vi.fn(),
  incrementClientPhotoVersion: vi.fn(),
  startUpload: vi.fn(),
  updateUpload: vi.fn(),
  failUpload: vi.fn(),
  endUpload: vi.fn(),
  mediaPickerProps: [] as Array<{
    isOpen: boolean;
    onFilesSelected?: (files: unknown[]) => void;
    onCameraCapture?: (file: unknown) => void;
  }>,
}));

vi.mock('expo-crypto', () => ({ randomUUID: () => 'session-photo' }));

vi.mock('@apollo/client/react', () => ({
  useApolloClient: () => ({ refetchQueries: mocks.refetchQueries }),
}));

// The clients barrel pulls in expo-modules-core, which vitest-native cannot
// strip; provide the runtime helper used by the uploader.
vi.mock('@monorepo/expo/shared/clients', () => ({
  incrementClientPhotoVersion: mocks.incrementClientPhotoVersion,
}));

vi.mock('@monorepo/expo/shared/icons', () => ({
  WFEdit: () => null,
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  Avatar: () => null,
  MediaPicker: (props: {
    isOpen: boolean;
    onFilesSelected?: (files: unknown[]) => void;
    onCameraCapture?: (file: unknown) => void;
  }) => {
    mocks.mediaPickerProps.push(props);

    return null;
  },
}));

vi.mock('../../../hooks/useClientHmis', () => ({
  useClientHmis: () => ({ uploadClientPhoto: mocks.uploadClientPhoto }),
}));

vi.mock('../../../providers', () => ({
  useUploadProgress: () => ({
    sessions: [],
    startUpload: mocks.startUpload,
    setUploadManifest: vi.fn(),
    updateUpload: mocks.updateUpload,
    failUpload: mocks.failUpload,
    endUpload: mocks.endUpload,
    cancelUpload: vi.fn(),
  }),
}));

vi.mock('./ProfilePhotoModalHmis', () => ({
  ProfilePhotoModalHmis: () => null,
}));

const sampleFile = {
  name: 'photo.jpg',
  type: 'image/jpeg',
  uri: 'file://photo.jpg',
};

async function selectFile(file: unknown) {
  const latest = mocks.mediaPickerProps[mocks.mediaPickerProps.length - 1];

  await act(async () => {
    latest.onFilesSelected?.([file]);
  });
}

describe('ProfilePhotoUploaderHmis', () => {
  beforeEach(() => {
    mocks.uploadClientPhoto.mockReset();
    mocks.refetchQueries.mockClear();
    mocks.incrementClientPhotoVersion.mockClear();
    mocks.startUpload.mockClear();
    mocks.updateUpload.mockClear();
    mocks.failUpload.mockClear();
    mocks.endUpload.mockClear();
    mocks.mediaPickerProps.length = 0;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('drives a drawer session and ends it on success', async () => {
    mocks.uploadClientPhoto.mockResolvedValue(undefined);

    render(
      <ProfilePhotoUploaderHmis
        clientId="client-1"
        imageUrl={null}
        headers={null}
      />,
    );
    await selectFile(sampleFile);

    expect(mocks.startUpload).toHaveBeenCalledWith('session-photo', [
      'photo.jpg',
    ]);
    expect(mocks.updateUpload).toHaveBeenCalledWith('session-photo', {
      stage: 'UPLOADING',
      completed: 0,
      total: 1,
    });
    expect(mocks.uploadClientPhoto).toHaveBeenCalledWith(
      'client-1',
      expect.any(FormData),
    );
    expect(mocks.refetchQueries).toHaveBeenCalledWith({
      include: [expect.anything()],
    });
    expect(mocks.incrementClientPhotoVersion).toHaveBeenCalledWith('client-1');
    expect(mocks.endUpload).toHaveBeenCalledWith('session-photo');
    expect(mocks.failUpload).not.toHaveBeenCalled();
  });

  it('marks the session failed when the upload errors', async () => {
    mocks.uploadClientPhoto.mockRejectedValue(new Error('boom'));

    render(
      <ProfilePhotoUploaderHmis
        clientId="client-1"
        imageUrl={null}
        headers={null}
      />,
    );
    await selectFile(sampleFile);

    expect(mocks.failUpload).toHaveBeenCalledWith(
      'session-photo',
      'Error uploading profile photo.',
    );
    expect(mocks.endUpload).not.toHaveBeenCalled();
  });
});
