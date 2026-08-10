import { act, fireEvent, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import { ClientProfileQuery } from '../../__generated__/Client.generated';
import UploadModal from './index';

const mocks = vi.hoisted(() => ({
  uploadDocuments: vi.fn(),
  begin: vi.fn(() => ({
    id: 'session-1',
    signals: [new AbortController().signal],
    isAborted: () => false,
  })),
  endUpload: vi.fn(),
  completeUpload: vi.fn(),
  failUpload: vi.fn(),
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
    begin: mocks.begin,
    setUploadManifest: vi.fn(),
    updateUpload: vi.fn(),
    failUpload: mocks.failUpload,
    completeUpload: mocks.completeUpload,
    endUpload: mocks.endUpload,
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

function renderModal(overrides?: { closeModal?: () => void }) {
  return render(
    <UploadModal
      client={client}
      closeModal={overrides?.closeModal ?? vi.fn()}
    />,
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
    mocks.begin.mockClear();
    mocks.endUpload.mockClear();
    mocks.completeUpload.mockClear();
    mocks.failUpload.mockClear();
    mocks.mediaPickerProps.length = 0;
  });

  it('starts a labelled session, uploads, and keeps the form open', async () => {
    mocks.uploadDocuments.mockResolvedValue(undefined);
    const closeModal = vi.fn();

    const { getByText } = renderModal({ closeModal });

    fireEvent.press(getByText('Consent Forms'));
    await selectFiles([sampleFile]);

    expect(mocks.begin).toHaveBeenCalledWith(['consent.pdf'], {
      label: 'Consent Forms',
      onRetryItem: expect.any(Function),
    });
    expect(mocks.uploadDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        clientProfileId: 'client-1',
        documents: [expect.objectContaining(sampleFile)],
        namespace: ClientDocumentNamespaceEnum.ConsentForm,
      }),
    );
    expect(mocks.completeUpload).toHaveBeenCalledWith('session-1');
    expect(mocks.endUpload).not.toHaveBeenCalled();
    // The form stays open so the user can upload more documents; they dismiss
    // it with Done. Progress is visible in the drawer.
    expect(closeModal).not.toHaveBeenCalled();
  });

  it('keeps the form open when the upload fails so the drawer can show retry', async () => {
    mocks.uploadDocuments.mockRejectedValue(new Error('upload failed'));
    const closeModal = vi.fn();

    const { getByText } = renderModal({ closeModal });

    fireEvent.press(getByText('Consent Forms'));
    await selectFiles([sampleFile]);

    expect(closeModal).not.toHaveBeenCalled();
    expect(mocks.failUpload).toHaveBeenCalledWith('session-1');
    expect(mocks.endUpload).not.toHaveBeenCalled();
  });

  it('retries only the failed file in a fresh single-file session', async () => {
    mocks.uploadDocuments.mockResolvedValue(undefined);

    const { getByText } = renderModal();

    fireEvent.press(getByText('Consent Forms'));
    await selectFiles([sampleFile]);

    const beginCall = mocks.begin.mock.calls[0];
    const options = beginCall[1] as { onRetryItem?: (index: number) => void };
    expect(options.onRetryItem).toBeDefined();

    // The drawer's per-item Retry invokes onRetryItem with the item index.
    await act(async () => {
      options.onRetryItem?.(0);
    });

    // A fresh session is started with just the retried file — not the whole
    // batch — and that single file is re-uploaded.
    expect(mocks.begin).toHaveBeenCalledTimes(2);
    expect(mocks.begin.mock.calls[1][0]).toEqual(['consent.pdf']);

    expect(mocks.uploadDocuments).toHaveBeenCalledTimes(2);
    const retryUpload = mocks.uploadDocuments.mock.calls[1][0] as {
      documents: unknown[];
    };
    expect(retryUpload.documents).toHaveLength(1);
    expect(retryUpload.documents[0]).toEqual(
      expect.objectContaining(sampleFile),
    );
  });

  it('closes the form when Done is pressed', () => {
    const closeModal = vi.fn();

    const { getByLabelText } = renderModal({ closeModal });

    fireEvent.press(getByLabelText('Done'));
    expect(closeModal).toHaveBeenCalled();
  });
});
