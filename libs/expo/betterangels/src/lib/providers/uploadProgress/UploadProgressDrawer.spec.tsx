import { fireEvent, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import { TUploadSession } from './UploadProgressContext';
import { UploadProgressDrawer } from './UploadProgressDrawer';

const mocks = vi.hoisted(() => ({
  sessions: [] as TUploadSession[],
  cancelUpload: vi.fn(),
  endUpload: vi.fn(),
  panelProps: [] as Array<{
    index?: number;
    enableDynamicSizing?: boolean;
    snapPoints?: Array<string | number>;
    enablePanDownToClose?: boolean;
    onClose?: () => void;
  }>,
}));

vi.mock('./UploadProgressContext', () => ({
  useUploadProgress: () => ({
    sessions: mocks.sessions,
    startUpload: vi.fn(),
    setUploadManifest: vi.fn(),
    updateUpload: vi.fn(),
    failUpload: vi.fn(),
    completeUpload: vi.fn(),
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
  BottomSheetPanel: ({
    children,
    ...props
  }: {
    children: ReactNode;
    index?: number;
    enableDynamicSizing?: boolean;
    snapPoints?: Array<string | number>;
    enablePanDownToClose?: boolean;
    onClose?: () => void;
  }) => {
    mocks.panelProps.push(props);

    return <>{children}</>;
  },
}));

function lastPanelProps() {
  return mocks.panelProps.at(-1) ?? {};
}

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
    mocks.panelProps = [];
  });

  it('renders nothing when there are no sessions', () => {
    const { queryByText } = render(<UploadProgressDrawer />);

    expect(queryByText('Uploading…')).toBeNull();
    expect(mocks.panelProps).toHaveLength(0);
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

  it('configures the panel as a single dynamic snap sheet', () => {
    mocks.sessions = [makeSession()];

    render(<UploadProgressDrawer />);

    expect(lastPanelProps()).toMatchObject({
      index: 0,
      enableDynamicSizing: true,
    });
    expect(lastPanelProps().snapPoints).toBeUndefined();
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

  it('shows the complete state with a Close action and no cancel', () => {
    mocks.sessions = [
      makeSession({
        complete: true,
        completed: 2,
        items: [{ refId: 'r1', name: 'a.pdf', status: 'done' }],
      }),
    ];

    const { getByText, getByLabelText, queryByLabelText } = render(
      <UploadProgressDrawer />,
    );

    expect(getByText('Upload complete')).toBeTruthy();
    expect(getByText('2 of 2')).toBeTruthy();
    expect(queryByLabelText('Cancel upload')).toBeNull();

    fireEvent.press(getByLabelText('Close'));
    expect(mocks.endUpload).toHaveBeenCalledWith('s1');
  });

  it('retries a failed session via its onRetry callback', () => {
    const onRetry = vi.fn();
    mocks.sessions = [
      makeSession({
        failed: true,
        errorMessage: 'boom',
        items: [{ refId: 'r1', name: 'a.pdf', status: 'error' }],
        onRetry,
      }),
    ];

    const { getByText, getByLabelText } = render(<UploadProgressDrawer />);

    expect(getByText('Upload failed')).toBeTruthy();
    expect(getByText('boom')).toBeTruthy();

    fireEvent.press(getByLabelText('Retry'));
    expect(mocks.endUpload).toHaveBeenCalledWith('s1');
    expect(onRetry).toHaveBeenCalled();
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

  it('disables pan-down while active and enables it for terminal sessions', () => {
    mocks.sessions = [makeSession()];

    render(<UploadProgressDrawer />);
    expect(lastPanelProps().enablePanDownToClose).toBe(false);
    expect(lastPanelProps().onClose).toBeUndefined();

    mocks.sessions = [
      makeSession({
        complete: true,
        completed: 2,
        items: [{ refId: 'r1', name: 'a.pdf', status: 'done' }],
      }),
    ];
    render(<UploadProgressDrawer />);
    expect(lastPanelProps().enablePanDownToClose).toBe(true);
    expect(lastPanelProps().onClose).toBeDefined();
  });

  it('ends the session when the terminal sheet is swiped down (onClose)', () => {
    mocks.sessions = [
      makeSession({
        failed: true,
        items: [{ refId: 'r1', name: 'a.pdf', status: 'error' }],
      }),
    ];

    render(<UploadProgressDrawer />);

    lastPanelProps().onClose?.();
    expect(mocks.endUpload).toHaveBeenCalledWith('s1');
  });
});
