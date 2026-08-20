import { act, render } from '@testing-library/react-native';
import { ProfilePhotoUploaderHmis } from './ProfilePhotoUploaderHmis';

const mocks = vi.hoisted(() => ({
  uploadClientPhoto: vi.fn(),
  refetchQueries: vi.fn(),
  incrementClientPhotoVersion: vi.fn(),
  showSnackbar: vi.fn(),
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

vi.mock('../../../hooks', () => ({
  useSnackbar: () => ({ showSnackbar: mocks.showSnackbar }),
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
    mocks.showSnackbar.mockClear();
    mocks.mediaPickerProps.length = 0;
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uploads the photo and refetches on success', async () => {
    mocks.uploadClientPhoto.mockResolvedValue(undefined);

    render(
      <ProfilePhotoUploaderHmis
        clientId="client-1"
        imageUrl={null}
        headers={null}
      />,
    );
    await selectFile(sampleFile);
    expect(mocks.uploadClientPhoto).toHaveBeenCalledWith(
      'client-1',
      expect.any(FormData),
    );
    expect(mocks.refetchQueries).toHaveBeenCalledWith({
      include: [expect.anything()],
    });
    expect(mocks.incrementClientPhotoVersion).toHaveBeenCalledWith('client-1');
  });

  it('shows an error snackbar when the upload errors', async () => {
    mocks.uploadClientPhoto.mockRejectedValue(new Error('boom'));

    render(
      <ProfilePhotoUploaderHmis
        clientId="client-1"
        imageUrl={null}
        headers={null}
      />,
    );
    await selectFile(sampleFile);

    expect(mocks.showSnackbar).toHaveBeenCalledWith({
      message: 'Error uploading profile photo.',
      type: 'error',
    });
  });
});
