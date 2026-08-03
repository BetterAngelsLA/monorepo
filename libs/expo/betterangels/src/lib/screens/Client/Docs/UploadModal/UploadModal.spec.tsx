import { act, fireEvent, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { ClientProfileQuery } from '../../__generated__/Client.generated';
import UploadModal from './index';

const mocks = vi.hoisted(() => ({
  uploadDocuments: vi.fn(),
  mediaPickerProps: [] as Array<{
    isOpen: boolean;
    onFilesSelected?: (files: unknown[]) => void;
    onCameraCapture?: (file: unknown) => void;
  }>,
}));

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('./useClientDocumentUpload', () => ({
  useClientDocumentUpload: () => ({ uploadDocuments: mocks.uploadDocuments }),
}));

vi.mock('../../../../providers', () => ({
  useUploadSession: () => ({
    begin: vi.fn(() => ({
      id: 'session-1',
      signal: new AbortController().signal,
      isAborted: () => false,
    })),
    cancel: vi.fn(),
    setUploadManifest: vi.fn(),
    updateUpload: vi.fn(),
    endUpload: vi.fn(),
  }),
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  MediaPicker: (props: {
    isOpen: boolean;
    onFilesSelected?: (files: unknown[]) => void;
    onCameraCapture?: (file: unknown) => void;
  }) => {
    mocks.mediaPickerProps.push(props);

    return null;
  },
  TextBold: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
  Button: ({
    title,
    onPress,
    accessibilityHint,
  }: {
    title: string;
    onPress?: () => void;
    accessibilityHint?: string;
  }) => (
    <Text
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
    >
      {title}
    </Text>
  ),
}));

const client = {
  clientProfile: { id: 'client-1', docReadyDocuments: [] },
} as unknown as ClientProfileQuery;

const sampleFile = {
  name: 'consent.pdf',
  type: 'application/pdf',
  uri: 'file://consent.pdf',
};

function renderModal(overrides: {
  onUploadSuccess?: () => void;
  onUploadError?: () => void;
  closeModal?: () => void;
}) {
  return render(
    <UploadModal
      client={client}
      closeModal={overrides.closeModal ?? vi.fn()}
      onUploadSuccess={overrides.onUploadSuccess}
      onUploadError={overrides.onUploadError}
    />
  );
}

async function selectFiles(files: unknown[]) {
  const latest = mocks.mediaPickerProps[mocks.mediaPickerProps.length - 1];

  await act(async () => {
    latest.onFilesSelected?.(files);
  });
}

describe('UploadModal', () => {
  beforeEach(() => {
    mocks.uploadDocuments.mockReset();
    mocks.mediaPickerProps.length = 0;
  });

  it('uploads selected files with the matching namespace and reports success', async () => {
    const onUploadSuccess = vi.fn();
    const onUploadError = vi.fn();
    const closeModal = vi.fn();
    mocks.uploadDocuments.mockResolvedValue(undefined);

    const { getByText } = renderModal({ onUploadSuccess, onUploadError, closeModal });

    fireEvent.press(getByText('Consent Forms'));
    await selectFiles([sampleFile]);

    expect(mocks.uploadDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        clientProfileId: 'client-1',
        documents: [sampleFile],
        namespace: ClientDocumentNamespaceEnum.ConsentForm,
      }),
    );
    expect(onUploadSuccess).toHaveBeenCalled();
    expect(closeModal).toHaveBeenCalled();
    expect(onUploadError).not.toHaveBeenCalled();
  });

  it('reports an error without closing the modal when the upload fails', async () => {
    const onUploadSuccess = vi.fn();
    const onUploadError = vi.fn();
    const closeModal = vi.fn();
    mocks.uploadDocuments.mockRejectedValue(new Error('upload failed'));

    const { getByText } = renderModal({ onUploadSuccess, onUploadError, closeModal });

    fireEvent.press(getByText('Consent Forms'));
    await selectFiles([sampleFile]);

    expect(onUploadError).toHaveBeenCalled();
    expect(closeModal).not.toHaveBeenCalled();
    expect(onUploadSuccess).not.toHaveBeenCalled();
  });
});
