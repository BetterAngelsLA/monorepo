import { act, fireEvent, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { TUploadSession } from '../../../../providers';
import { ClientProfileQuery } from '../../__generated__/Client.generated';
import UploadModal from './index';

const mocks = vi.hoisted(() => {
  let counter = 0;
  const sessions: TUploadSession[] = [];

  return {
    uploadDocuments: vi.fn(),
    sessions,
    mediaPickerProps: [] as Array<{
      isOpen: boolean;
      onFilesSelected?: (files: unknown[]) => void;
      onCameraCapture?: (file: unknown) => void;
    }>,
    setQueueOpen: vi.fn(),
    cancelUpload: vi.fn(),
    endUpload: vi.fn(),
    completeUpload: vi.fn((id: string) => {
      const session = sessions.find((s) => s.id === id);
      if (session) {
        session.complete = true;
        session.completed = session.total;
      }
    }),
    failUpload: vi.fn((id: string, errorMessage?: string) => {
      const session = sessions.find((s) => s.id === id);
      if (session) {
        session.failed = true;
        session.errorMessage = errorMessage;
      }
    }),
    begin: vi.fn((names: string[], options?: { label?: string }) => {
      counter += 1;
      const id = `session-${counter}`;
      sessions.push({
        id,
        stage: 'UPLOADING',
        items: names.map((name, index) => ({
          refId: `r-${index}`,
          name,
          status: 'uploading',
        })),
        completed: 0,
        total: names.length,
        failed: false,
        label: options?.label,
      });

      return { id, signal: new AbortController().signal, isAborted: () => false };
    }),
    reset: () => {
      counter = 0;
      sessions.length = 0;
    },
  };
});

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('./useClientDocumentUpload', () => ({
  useClientDocumentUpload: () => ({ uploadDocuments: mocks.uploadDocuments }),
}));

vi.mock('../../../../providers', () => ({
  useUploadSession: () => ({
    begin: mocks.begin,
    setUploadManifest: vi.fn(),
    updateUpload: vi.fn(),
    failUpload: mocks.failUpload,
    completeUpload: mocks.completeUpload,
    endUpload: mocks.endUpload,
  }),
  useUploadProgress: () => ({
    sessions: mocks.sessions,
    queueOpen: false,
    setQueueOpen: mocks.setQueueOpen,
    startUpload: vi.fn(),
    setUploadManifest: vi.fn(),
    updateUpload: vi.fn(),
    failUpload: mocks.failUpload,
    completeUpload: mocks.completeUpload,
    endUpload: mocks.endUpload,
    cancelUpload: mocks.cancelUpload,
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
  TextRegular: ({ children }: { children: ReactNode }) => (
    <Text>{children}</Text>
  ),
  TextButton: ({
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

function renderModal() {
  return render(<UploadModal client={client} closeModal={vi.fn()} />);
}

async function selectFiles(files: unknown[]) {
  const latest = mocks.mediaPickerProps[mocks.mediaPickerProps.length - 1];

  await act(async () => {
    latest.onFilesSelected?.(files);
  });
}

describe('UploadModal', () => {
  beforeEach(() => {
    mocks.reset();
    mocks.uploadDocuments.mockReset();
    mocks.endUpload.mockClear();
    mocks.completeUpload.mockClear();
    mocks.failUpload.mockClear();
    mocks.setQueueOpen.mockClear();
    mocks.cancelUpload.mockClear();
    mocks.mediaPickerProps.length = 0;
  });

  it('opens the upload queue and starts a session with the doc-type label', async () => {
    mocks.uploadDocuments.mockResolvedValue(undefined);

    const { getAllByText, getByText, unmount } = renderModal();

    expect(mocks.setQueueOpen).toHaveBeenCalledWith(true);

    fireEvent.press(getByText('Consent Forms'));
    await selectFiles([sampleFile]);

    expect(mocks.begin).toHaveBeenCalledWith(['consent.pdf'], {
      label: 'Consent Forms',
    });
    expect(mocks.uploadDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        clientProfileId: 'client-1',
        documents: [sampleFile],
        namespace: ClientDocumentNamespaceEnum.ConsentForm,
      }),
    );
    expect(mocks.completeUpload).toHaveBeenCalledWith('session-1');
    expect(mocks.endUpload).not.toHaveBeenCalled();

    // The queue lists the session (label appears next to the add row) with
    // its completion status.
    expect(getAllByText('Consent Forms').length).toBeGreaterThan(0);
    expect(getByText('Complete')).toBeTruthy();

    unmount();
    expect(mocks.setQueueOpen).toHaveBeenCalledWith(false);
  });

  it('keeps the modal open when the upload fails so it can be retried', async () => {
    mocks.uploadDocuments.mockRejectedValue(new Error('upload failed'));

    const { getByText } = renderModal();

    fireEvent.press(getByText('Consent Forms'));
    await selectFiles([sampleFile]);

    expect(mocks.failUpload).toHaveBeenCalledWith('session-1');
    expect(mocks.endUpload).not.toHaveBeenCalled();
    expect(getByText('Retry')).toBeTruthy();
  });

  it('retries a failed upload from the queue with the same files', async () => {
    mocks.uploadDocuments.mockRejectedValueOnce(new Error('boom'));

    const { getByText } = renderModal();

    fireEvent.press(getByText('Consent Forms'));
    await selectFiles([sampleFile]);

    expect(getByText('Retry')).toBeTruthy();

    mocks.uploadDocuments.mockResolvedValueOnce(undefined);
    fireEvent.press(getByText('Retry'));
    await act(async () => {});

    expect(mocks.endUpload).toHaveBeenCalledWith('session-1');
    expect(mocks.uploadDocuments).toHaveBeenLastCalledWith(
      expect.objectContaining({
        clientProfileId: 'client-1',
        documents: [sampleFile],
        namespace: ClientDocumentNamespaceEnum.ConsentForm,
      }),
    );
    expect(mocks.completeUpload).toHaveBeenCalledWith('session-2');
  });

  it('cancels an active upload from the queue', async () => {
    mocks.uploadDocuments.mockImplementation(() => new Promise(() => {}));

    const { getByText } = renderModal();

    fireEvent.press(getByText('Consent Forms'));
    await selectFiles([sampleFile]);

    expect(getByText('Cancel')).toBeTruthy();
    fireEvent.press(getByText('Cancel'));
    expect(mocks.cancelUpload).toHaveBeenCalledWith('session-1');
  });
});
