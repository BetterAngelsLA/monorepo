import { fireEvent, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import { TUploadSession } from './UploadProgressContext';
import { UploadProgressDrawer } from './UploadProgressDrawer';

const mocks = vi.hoisted(() => ({
  cancelUpload: vi.fn(),
  endUpload: vi.fn(),
}));

vi.mock('./UploadProgressContext', () => ({
  useUploadProgress: () => ({
    sessions: [],
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
    mocks.cancelUpload.mockClear();
    mocks.endUpload.mockClear();
  });

  it('renders nothing when there are no sessions', () => {
    const { queryByText } = render(<UploadProgressDrawer sessions={[]} />);

    expect(queryByText('Uploading…')).toBeNull();
  });

  it('shows the stage label and x-of-y counter of the latest session', () => {
    const { getByText, queryByText } = render(
      <UploadProgressDrawer
        sessions={[
          makeSession({ id: 'older', completed: 1, total: 1 }),
          makeSession(),
        ]}
      />,
    );

    expect(getByText('Uploading…')).toBeTruthy();
    expect(getByText('1 of 2')).toBeTruthy();
    expect(queryByText('1 of 1')).toBeNull();
  });

  it('renders per-file status rows with byte progress for multiple files', () => {
    const { getByText } = render(
      <UploadProgressDrawer
        sessions={[
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
        ]}
      />,
    );

    expect(getByText('a.pdf')).toBeTruthy();
    expect(getByText('b.pdf')).toBeTruthy();
    expect(getByText('50%')).toBeTruthy();
    expect(getByText('Done')).toBeTruthy();
  });

  it('shows the failed state with the error message and a Close action', () => {
    const { getByText, getByLabelText } = render(
      <UploadProgressDrawer
        sessions={[
          makeSession({
            failed: true,
            errorMessage: 'File type not supported.',
            items: [{ refId: 'r1', name: 'a.pdf', status: 'error' }],
          }),
        ]}
      />,
    );

    expect(getByText('Upload failed')).toBeTruthy();
    expect(getByText('File type not supported.')).toBeTruthy();

    fireEvent.press(getByLabelText('Close'));

    expect(mocks.endUpload).toHaveBeenCalledWith('s1');
    expect(mocks.cancelUpload).not.toHaveBeenCalled();
  });

  it('derives the failed state from an errored item even if not flagged', () => {
    const { getByText } = render(
      <UploadProgressDrawer
        sessions={[
          makeSession({
            failed: false,
            items: [{ refId: 'r1', name: 'a.pdf', status: 'error' }],
          }),
        ]}
      />,
    );

    expect(getByText('Upload failed')).toBeTruthy();
  });

  it('shows Cancel only for sessions that can be aborted', () => {
    const { getByLabelText, queryByLabelText } = render(
      <UploadProgressDrawer
        sessions={[makeSession({ onCancel: vi.fn() })]}
      />,
    );

    fireEvent.press(getByLabelText('Cancel upload'));
    expect(mocks.cancelUpload).toHaveBeenCalledWith('s1');
    expect(mocks.endUpload).not.toHaveBeenCalled();

    const second = render(<UploadProgressDrawer sessions={[makeSession()]} />);
    expect(second.queryByLabelText('Cancel upload')).toBeNull();
    expect(second.queryByLabelText('Close')).toBeNull();
  });
});
