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
} from '../../providers';
import UploadStage from './UploadStage';

const mocks = vi.hoisted(() => ({
  rows: [] as Array<{
    filename: string;
    status: string;
    thumbnail?: unknown;
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
vi.mock('../../providers', async () => {
  const actual = await vi.importActual<
    typeof import('../../providers/uploadProgress')
  >('../../providers/uploadProgress');

  return actual;
});

vi.mock('../FileThumbnail/FileThumbnail', () => ({
  FileThumbnail: (props: { uri: string; mimeType: string }) => (
    <Text>{`preview:${props.uri}`}</Text>
  ),
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  UploadItemRow: (props: {
    filename: string;
    status: string;
    progressPct?: number | null;
    thumbnail?: unknown;
    onCancel?: () => void;
    onRetry?: () => void;
  }) => {
    mocks.rows.push(props);

    // Mirror the real component's gating; a stub that always renders Cancel
    // would let the stage's tests pass on behaviour the row never shows.
    const cancellable =
      !!props.onCancel &&
      ['pending', 'uploading', 'error'].includes(props.status);

    return (
      <View>
        <Text>{props.filename}</Text>
        {cancellable ? (
          <Text
            accessibilityRole="button"
            accessibilityLabel={`cancel-${props.filename}`}
            accessibilityHint="cancels the file upload"
            onPress={props.onCancel}
          >
            {props.status === 'error' ? 'Dismiss' : 'Cancel'}
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

/** Reports a per-file failure the way the upload pipeline does. */
function failItem(sessionId: string, refId: string) {
  updateUploadSession(sessionId, {
    stage: 'UPLOADING',
    completed: 0,
    total: 1,
    refId,
    status: 'error',
  });
}

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
      clientId: 'client-1',
    });

    const { getByText, queryByText } = renderStage(['s1']);

    expect(getByText('a.pdf')).toBeTruthy();
    expect(getByText('Uploading…')).toBeTruthy();
    // Actions are per-file only; there is no global cancel button.
    expect(queryByText('Cancel upload')).toBeNull();
  });

  it('previews the actual local file for items with uri and mime type', () => {
    startUploadSession('s1', ['photo.jpg'], {
      clientId: 'client-1',
      files: [{ uri: 'file://photo.jpg', type: 'image/jpeg' }],
    });

    renderStage(['s1']);

    expect(mocks.rows).toHaveLength(1);
    expect(mocks.rows[0].thumbnail).toBeTruthy();
  });

  it('falls back to the default icon when no preview metadata exists', () => {
    startUploadSession('s1', ['scan.pdf'], {
      clientId: 'client-1',
    });

    renderStage(['s1']);

    expect(mocks.rows).toHaveLength(1);
    expect(mocks.rows[0].thumbnail).toBeUndefined();
  });

  it('shows Done and stays open until the user closes it', () => {
    startUploadSession('s1', ['a.pdf'], {
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
      clientId: 'client-1',
      refIds: ['ref-a'],
      onRetryItems: () => undefined,
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

  it('closes when every file is cancelled individually', () => {
    startUploadSession('s1', ['a.pdf'], {
      clientId: 'client-1',
    });
    const closeModal = vi.fn();

    const { getByLabelText } = renderStage(['s1'], closeModal);

    act(() => {
      fireEvent.press(getByLabelText('cancel-a.pdf'));
    });

    expect(store.get(uploadSessionsAtom)).toHaveLength(0);
    expect(closeModal).toHaveBeenCalled();
  });

  it('retries a failed file in place, keeping one session', () => {
    const onRetryItems = vi.fn();

    startUploadSession('s1', ['a.pdf', 'b.pdf'], {
      clientId: 'client-1',
      refIds: ['ref-a', 'ref-b'],
      onRetryItems,
    });
    failItem('s1', 'ref-a');

    const { getByLabelText } = renderStage(['s1']);

    act(() => {
      fireEvent.press(getByLabelText('retry-a.pdf'));
    });

    // No replacement session: the row the user tapped is the row that resets.
    const sessions = store.get(uploadSessionsAtom);
    expect(sessions.map((session) => session.id)).toEqual(['s1']);
    expect(sessions[0].items.map((item) => item.status)).toEqual([
      'pending',
      'pending',
    ]);
    expect(onRetryItems).toHaveBeenCalledWith(['ref-a']);
  });

  it('retries every failed file in one run', () => {
    const onRetryItems = vi.fn();

    startUploadSession('s1', ['a.pdf', 'b.pdf', 'c.pdf'], {
      clientId: 'client-1',
      refIds: ['ref-a', 'ref-b', 'ref-c'],
      onRetryItems,
    });
    failItem('s1', 'ref-a');
    failItem('s1', 'ref-c');

    const { getByLabelText } = renderStage(['s1']);

    act(() => {
      fireEvent.press(getByLabelText('Retry all 2 failed files'));
    });

    // One call carrying both files, not one call per file — each call is a
    // full generate/upload/save/refetch cycle.
    expect(onRetryItems).toHaveBeenCalledTimes(1);
    expect(onRetryItems).toHaveBeenCalledWith(['ref-a', 'ref-c']);
  });

  it('offers no bulk retry when only one file failed', () => {
    startUploadSession('s1', ['a.pdf', 'b.pdf'], {
      clientId: 'client-1',
      refIds: ['ref-a', 'ref-b'],
      onRetryItems: () => undefined,
    });
    failItem('s1', 'ref-a');

    const { queryByLabelText } = renderStage(['s1']);

    expect(queryByLabelText('Retry all 1 failed files')).toBeNull();
    expect(queryByLabelText('retry-a.pdf')).toBeTruthy();
  });

  it('shows every resumed session, not just the first one', () => {
    startUploadSession('s1', ['a.pdf'], {
      clientId: 'client-1',
      refIds: ['ref-a'],
    });
    startUploadSession('s2', ['b.pdf'], {
      clientId: 'client-2',
      refIds: ['ref-b'],
    });

    const { getByText } = renderStage(['s1', 's2']);

    // Concurrent uploads used to be scoped away by the first session's
    // group id, so the bar counted files this screen never showed.
    expect(getByText('a.pdf')).toBeTruthy();
    expect(getByText('b.pdf')).toBeTruthy();
  });

  it('dismisses failed files and closes when nothing is left', () => {
    startUploadSession('s1', ['a.pdf'], {
      clientId: 'client-1',
      refIds: ['ref-a'],
      onRetryItems: () => undefined,
    });
    const closeModal = vi.fn();

    const { getByLabelText } = renderStage(['s1'], closeModal);

    act(() => {
      failUploadSession('s1', 'boom');
    });

    act(() => {
      fireEvent.press(getByLabelText('Dismiss failed'));
    });

    // The only escape from a repeatedly-failing upload.
    expect(store.get(uploadSessionsAtom)).toHaveLength(0);
    expect(closeModal).toHaveBeenCalled();
  });

  it('closes immediately when the resumed sessions no longer exist', () => {
    const closeModal = vi.fn();

    renderStage(['gone'], closeModal);

    expect(closeModal).toHaveBeenCalled();
  });
});
