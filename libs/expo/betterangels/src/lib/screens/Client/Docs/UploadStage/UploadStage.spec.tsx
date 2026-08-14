import { act, fireEvent, render } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { ClientDocumentNamespaceEnum } from '../../../../apollo';
import {
  resetUploadProgressAtoms,
  startUploadSession,
  uploadSessionsAtom,
} from '../../../../providers';
import UploadStage, { TUploadSelection } from './UploadStage';

const mocks = vi.hoisted(() => ({
  uploadDocuments: vi.fn(),
  showSnackbar: vi.fn(),
  rows: [] as Array<{
    filename: string;
    status: string;
    onCancel?: () => void;
    onRetry?: () => void;
  }>,
}));

vi.mock('expo-crypto', () => ({
  randomUUID: () => 'session-generated',
}));

// The full providers index drags in expo-router and other native modules;
// scope it to the upload-progress surface the stage actually uses.
vi.mock('../../../../providers', async () => {
  const actual = await vi.importActual<
    typeof import('../../../../providers/uploadProgress')
  >('../../../../providers/uploadProgress');

  return actual;
});

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('../../../../hooks', () => ({
  useSnackbar: () => ({ showSnackbar: mocks.showSnackbar }),
}));

vi.mock('../UploadModal/useClientDocumentUpload', () => ({
  useClientDocumentUpload: () => ({ uploadDocuments: mocks.uploadDocuments }),
}));

vi.mock('@monorepo/expo/shared/icons', () => ({
  FileOutlineIcon: () => null,
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  UploadItemRow: (props: {
    filename: string;
    status: string;
    progressPct?: number | null;
    onCancel?: () => void;
    onRetry?: () => void;
  }) => {
    mocks.rows.push(props);

    return (
      <View>
        <Text>{props.filename}</Text>
        {props.onCancel ? (
          <Text
            accessibilityRole="button"
            accessibilityLabel={`cancel-${props.filename}`}
            accessibilityHint="cancels the file upload"
            onPress={props.onCancel}
          >
            Cancel
          </Text>
        ) : null}
        {props.status === 'error' && props.onRetry ? (
          <Text
            accessibilityRole="button"
            accessibilityLabel={`retry-${props.filename}`}
            accessibilityHint="retries the file upload"
            onPress={props.onRetry}
          >
            Retry
          </Text>
        ) : null}
      </View>
    );
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

const store = getDefaultStore();

const selection: TUploadSelection = {
  namespace: ClientDocumentNamespaceEnum.ConsentForm,
  title: 'Consent Forms',
  files: [
    {
      name: 'consent.pdf',
      type: 'application/pdf',
      uri: 'file://consent.pdf',
    } as never,
  ],
};

function renderStage(props: Partial<Parameters<typeof UploadStage>[0]> = {}) {
  return render(
    <UploadStage
      closeModal={vi.fn()}
      clientProfileId="client-1"
      selection={selection}
      {...props}
    />,
  );
}

describe('UploadStage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetUploadProgressAtoms();
    mocks.uploadDocuments.mockReset();
    mocks.showSnackbar.mockClear();
    mocks.rows = [];
  });

  afterEach(() => {
    vi.useRealTimers();
    resetUploadProgressAtoms();
  });

  it('shows the Ready state and uploads nothing until confirmed', () => {
    const closeModal = vi.fn();
    const { getByText, queryByLabelText } = renderStage({ closeModal });

    expect(getByText('Ready to upload')).toBeTruthy();
    expect(getByText('consent.pdf')).toBeTruthy();
    expect(queryByLabelText('Upload')).toBeTruthy();
    expect(mocks.uploadDocuments).not.toHaveBeenCalled();

    fireEvent.press(getByText('Cancel'));
    expect(closeModal).toHaveBeenCalled();
  });

  it('uploads on confirm, shows Done, and auto-closes after the min display time', async () => {
    mocks.uploadDocuments.mockResolvedValue(undefined);
    const closeModal = vi.fn();

    const { getByLabelText, getByText } = renderStage({ closeModal });

    await act(async () => {
      fireEvent.press(getByLabelText('Upload'));
    });

    expect(mocks.uploadDocuments).toHaveBeenCalledWith(
      expect.objectContaining({
        clientProfileId: 'client-1',
        namespace: ClientDocumentNamespaceEnum.ConsentForm,
        documents: [
          expect.objectContaining({
            name: 'consent.pdf',
            signal: expect.any(AbortSignal),
          }),
        ],
      }),
    );

    expect(getByText('Upload complete')).toBeTruthy();
    expect(closeModal).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1500);
    });

    expect(closeModal).toHaveBeenCalled();
  });

  it('shows a failed state with Retry and does not auto-close', async () => {
    mocks.uploadDocuments.mockRejectedValue(new Error('boom'));
    const closeModal = vi.fn();

    const { getByText } = renderStage({ closeModal });

    await act(async () => {
      fireEvent.press(getByText('Upload'));
    });

    expect(getByText('Upload failed')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
    expect(getByText('consent.pdf')).toBeTruthy();

    act(() => {
      vi.advanceTimersByTime(10000);
    });

    expect(closeModal).not.toHaveBeenCalled();
  });

  it('cancel-all aborts every file, removes the session, and closes', async () => {
    // Upload hangs forever so only the cancel path can end it.
    mocks.uploadDocuments.mockImplementation(
      () => new Promise(() => undefined),
    );
    const closeModal = vi.fn();

    const { getByLabelText } = renderStage({ closeModal });

    await act(async () => {
      fireEvent.press(getByLabelText('Upload'));
    });

    expect(store.get(uploadSessionsAtom)).toHaveLength(1);

    await act(async () => {
      fireEvent.press(getByLabelText('Cancel upload'));
    });

    expect(store.get(uploadSessionsAtom)).toHaveLength(0);
    expect(closeModal).toHaveBeenCalled();
  });

  it('resumes background sessions from the store', () => {
    startUploadSession('s1', ['a.pdf'], {
      groupId: 'g1',
      clientId: 'client-1',
    });

    const closeModal = vi.fn();
    const { getByText } = renderStage({
      closeModal,
      selection: undefined,
      resumeSessionIds: ['s1'],
    });

    expect(getByText('a.pdf')).toBeTruthy();
    expect(mocks.uploadDocuments).not.toHaveBeenCalled();
    // In-flight sessions show the uploading chrome.
    expect(getByText('Uploading…')).toBeTruthy();
  });

  it('closes immediately when resumed sessions no longer exist', () => {
    const closeModal = vi.fn();

    render(<UploadStage closeModal={closeModal} resumeSessionIds={['gone']} />);

    expect(closeModal).toHaveBeenCalled();
  });
});
