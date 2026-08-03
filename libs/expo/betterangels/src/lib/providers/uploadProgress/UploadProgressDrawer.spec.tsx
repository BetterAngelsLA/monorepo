import { fireEvent, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import { TUploadSession } from './UploadProgressContext';
import { UploadProgressDrawer } from './UploadProgressDrawer';

const mocks = vi.hoisted(() => ({
  sessions: [] as TUploadSession[],
  cancelUpload: vi.fn(),
  endUpload: vi.fn(),
}));

vi.mock('./UploadProgressContext', () => ({
  useUploadProgress: () => ({
    sessions: mocks.sessions,
    startUpload: vi.fn(),
    setUploadManifest: vi.fn(),
    updateUpload: vi.fn(),
    failUpload: vi.fn(),
    endUpload: mocks.endUpload,
    cancelUpload: mocks.cancelUpload,
  }),
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
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
}));

function makeSession(overrides: Partial<TUploadSession> = {}): TUploadSession {
  return {
    id: 's1',
    stage: 'UPLOADING',
    items: [{ refId: 'r1', name: 'a.pdf', status: 'uploading' }],
    completed: 1,
    total: 2,
    failed: false,
    ...overrides,
  };
}

describe('UploadProgressDrawer', () => {
  beforeEach(() => {
    mocks.sessions = [];
    mocks.cancelUpload.mockClear();
    mocks.endUpload.mockClear();
  });

  it('renders nothing when there are no sessions', () => {
    const { queryByText } = render(<UploadProgressDrawer />);

    expect(queryByText('Uploading…')).toBeNull();
  });

  it('shows the stage label and x-of-y counter of the latest session', () => {
    mocks.sessions = [
      makeSession({ id: 'older', completed: 1, total: 1 }),
      makeSession(),
    ];

    const { getByText, queryByText } = render(<UploadProgressDrawer />);

    expect(getByText('Uploading…')).toBeTruthy();
    expect(getByText('1 of 2')).toBeTruthy();
    expect(queryByText('1 of 1')).toBeNull();
  });

  it('renders per-file status rows with byte progress for multiple files', () => {
    mocks.sessions = [
      makeSession({
        items: [
          {
            refId: 'r1',
            name: 'a.pdf',
            status: 'uploading',
            bytesSent: 50,
            totalBytes: 100,
          },
          { refId: 'r2', name: 'b.pdf', status: 'done' },
        ],
      }),
    ];

    const { getByText } = render(<UploadProgressDrawer />);

    expect(getByText('a.pdf')).toBeTruthy();
    expect(getByText('b.pdf')).toBeTruthy();
    expect(getByText('50%')).toBeTruthy();
    expect(getByText('Done')).toBeTruthy();
  });

  it('shows the failed state with the error message and a Close action', () => {
    mocks.sessions = [
      makeSession({
        failed: true,
        errorMessage: 'File type not supported.',
        items: [{ refId: 'r1', name: 'a.pdf', status: 'error' }],
      }),
    ];

    const { getByText, getByLabelText } = render(<UploadProgressDrawer />);

    expect(getByText('Upload failed')).toBeTruthy();
    expect(getByText('File type not supported.')).toBeTruthy();

    fireEvent.press(getByLabelText('Close'));

    expect(mocks.endUpload).toHaveBeenCalledWith('s1');
    expect(mocks.cancelUpload).not.toHaveBeenCalled();
  });

  it('derives the failed state from an errored item even if not flagged', () => {
    mocks.sessions = [
      makeSession({
        failed: false,
        items: [{ refId: 'r1', name: 'a.pdf', status: 'error' }],
      }),
    ];

    const { getByText } = render(<UploadProgressDrawer />);

    expect(getByText('Upload failed')).toBeTruthy();
  });

  it('shows Cancel only for sessions that can be aborted', () => {
    mocks.sessions = [makeSession({ onCancel: vi.fn() })];

    const { getByLabelText } = render(<UploadProgressDrawer />);

    fireEvent.press(getByLabelText('Cancel upload'));
    expect(mocks.cancelUpload).toHaveBeenCalledWith('s1');
    expect(mocks.endUpload).not.toHaveBeenCalled();

    mocks.sessions = [makeSession()];
    const second = render(<UploadProgressDrawer />);
    expect(second.queryByLabelText('Cancel upload')).toBeNull();
    expect(second.queryByLabelText('Close')).toBeNull();
  });
});
