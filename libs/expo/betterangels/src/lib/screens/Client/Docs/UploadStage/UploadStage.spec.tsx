import { act, fireEvent, render } from '@testing-library/react-native';
import { getDefaultStore } from 'jotai';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import {
  completeUploadSession,
  failUploadSession,
  resetUploadProgressAtoms,
  startUploadSession,
  updateUploadSession,
  uploadSessionsAtom,
} from '../../../../providers';
import UploadStage from './UploadStage';

const mocks = vi.hoisted(() => ({
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

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: ReactNode }) => children,
}));

// The full providers index drags in expo-router and other native modules;
// scope it to the upload-progress surface the stage actually uses.
vi.mock('../../../../providers', async () => {
  const actual = await vi.importActual<
    typeof import('../../../../providers/uploadProgress')
  >('../../../../providers/uploadProgress');

  return actual;
});

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

function renderStage(
  resumeSessionIds: string[],
  closeModal: () => void = vi.fn(),
) {
  return render(
    <UploadStage closeModal={closeModal} resumeSessionIds={resumeSessionIds} />,
  );
}

describe('UploadStage', () => {
  beforeEach(() => {
    resetUploadProgressAtoms();
    mocks.rows = [];
  });

  afterEach(() => {
    resetUploadProgressAtoms();
  });

  it('renders the resumed session items with the uploading chrome', () => {
    startUploadSession('s1', ['a.pdf'], {
      groupId: 'g1',
      clientId: 'client-1',
    });

    const { getByText } = renderStage(['s1']);

    expect(getByText('a.pdf')).toBeTruthy();
    expect(getByText('Uploading…')).toBeTruthy();
    expect(getByText('Cancel upload')).toBeTruthy();
  });

  it('shows Done and stays open until the user closes it', () => {
    startUploadSession('s1', ['a.pdf'], {
      groupId: 'g1',
      clientId: 'client-1',
    });
    const closeModal = vi.fn();

    const { getByText, queryByText } = renderStage(['s1'], closeModal);

    act(() => {
      completeUploadSession('s1');
    });

    expect(getByText('Upload complete')).toBeTruthy();
    // No auto-close: the screen persists and has no footer action either.
    expect(queryByText('Done')).toBeNull();
    expect(closeModal).not.toHaveBeenCalled();
  });

  it('shows a failed state with Retry and no footer action', () => {
    startUploadSession('s1', ['a.pdf'], {
      groupId: 'g1',
      clientId: 'client-1',
      onRetryItem: () => undefined,
    });
    const closeModal = vi.fn();

    const { getByText, queryByText } = renderStage(['s1'], closeModal);

    act(() => {
      failUploadSession('s1', 'boom');
    });

    expect(getByText('Upload failed')).toBeTruthy();
    expect(getByText('Retry')).toBeTruthy();
    expect(queryByText('Done')).toBeNull();
    expect(closeModal).not.toHaveBeenCalled();
  });

  it('cancel-all removes the session and closes', () => {
    startUploadSession('s1', ['a.pdf'], {
      groupId: 'g1',
      clientId: 'client-1',
    });
    const closeModal = vi.fn();

    const { getByLabelText } = renderStage(['s1'], closeModal);

    act(() => {
      fireEvent.press(getByLabelText('Cancel upload'));
    });

    expect(store.get(uploadSessionsAtom)).toHaveLength(0);
    expect(closeModal).toHaveBeenCalled();
  });

  it('retry starts a replacement session with the same group id', () => {
    startUploadSession('s1', ['a.pdf'], {
      groupId: 'g1',
      clientId: 'client-1',
      onRetryItem: () =>
        startUploadSession('s2', ['a.pdf'], {
          groupId: 'g1',
          clientId: 'client-1',
        }),
    });
    updateUploadSession('s1', {
      stage: 'UPLOADING',
      completed: 0,
      total: 1,
      refId: 'pending-0',
      status: 'error',
    });

    const { getByLabelText, getByText } = renderStage(['s1']);

    act(() => {
      fireEvent.press(getByLabelText('retry-a.pdf'));
    });

    // The failed session is replaced; the new session (same group) renders.
    expect(store.get(uploadSessionsAtom).map((session) => session.id)).toEqual([
      's2',
    ]);
    expect(getByText('a.pdf')).toBeTruthy();
    expect(getByText('Uploading…')).toBeTruthy();
  });

  it('closes immediately when the resumed sessions no longer exist', () => {
    const closeModal = vi.fn();

    renderStage(['gone'], closeModal);

    expect(closeModal).toHaveBeenCalled();
  });
});
