import { render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import type { TUploadSession } from './UploadProgressContext';
import { UploadProgressRows, uploadProgressPct } from './UploadProgressRows';

const mocks = vi.hoisted(() => ({
  cancelUploadItem: vi.fn(),
  retryUploadItem: vi.fn(),
  fileCards: [] as Array<{
    filename?: string | null;
    status?: string;
    progressPct?: number | null;
    onCancel?: () => void;
    onRetry?: () => void;
  }>,
}));

vi.mock('@monorepo/expo/shared/icons', () => ({
  FileOutlineIcon: () => null,
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  FileCard: (props: {
    filename?: string | null;
    status?: string;
    progressPct?: number | null;
    onCancel?: () => void;
    onRetry?: () => void;
  }) => {
    mocks.fileCards.push(props);

    return <Text>{props.filename}</Text>;
  },
  TextRegular: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
}));

vi.mock('./UploadProgressContext', () => ({
  useUploadProgress: () => ({
    cancelUploadItem: mocks.cancelUploadItem,
    retryUploadItem: mocks.retryUploadItem,
  }),
}));

function makeSession(overrides: Partial<TUploadSession> = {}): TUploadSession {
  return {
    id: 's1',
    stage: 'UPLOADING',
    items: [
      {
        refId: 'r1',
        name: 'a.pdf',
        status: 'uploading',
        bytesSent: 50,
        totalBytes: 100,
        onCancel: () => undefined,
      },
      {
        refId: 'r2',
        name: 'b.pdf',
        status: 'error',
        onRetry: () => undefined,
      },
    ],
    completed: 0,
    total: 2,
    failed: false,
    ...overrides,
  };
}

describe('uploadProgressPct', () => {
  it('computes the rounded percentage for an uploading item', () => {
    expect(
      uploadProgressPct({ refId: 'r', name: 'a', status: 'uploading', bytesSent: 50, totalBytes: 100 }),
    ).toBe(50);
  });

  it('returns null when the item is not uploading or has no byte info', () => {
    expect(
      uploadProgressPct({ refId: 'r', name: 'a', status: 'pending' }),
    ).toBeNull();
    expect(
      uploadProgressPct({ refId: 'r', name: 'a', status: 'uploading' }),
    ).toBeNull();
    expect(
      uploadProgressPct({ refId: 'r', name: 'a', status: 'uploading', bytesSent: 10, totalBytes: 0 }),
    ).toBeNull();
  });

  it('clamps to 100', () => {
    expect(
      uploadProgressPct({ refId: 'r', name: 'a', status: 'uploading', bytesSent: 200, totalBytes: 100 }),
    ).toBe(100);
  });
});

describe('UploadProgressRows', () => {
  beforeEach(() => {
    mocks.cancelUploadItem.mockClear();
    mocks.retryUploadItem.mockClear();
    mocks.fileCards = [];
  });

  it('renders nothing when there are no sessions', () => {
    render(<UploadProgressRows sessions={[]} />);

    expect(mocks.fileCards).toHaveLength(0);
  });

  it('renders one FileCard per in-flight item with progress and status', () => {
    render(<UploadProgressRows sessions={[makeSession()]} />);

    expect(mocks.fileCards).toHaveLength(2);
    expect(mocks.fileCards[0]).toMatchObject({
      filename: 'a.pdf',
      status: 'uploading',
      progressPct: 50,
    });
    expect(mocks.fileCards[1]).toMatchObject({
      filename: 'b.pdf',
      status: 'error',
      progressPct: null,
    });
  });

  it('wires cancel to the store for cancellable items', () => {
    render(<UploadProgressRows sessions={[makeSession()]} />);

    mocks.fileCards[0].onCancel?.();

    expect(mocks.cancelUploadItem).toHaveBeenCalledWith('s1', 'r1');
  });

  it('wires retry to the store for failed items', () => {
    render(<UploadProgressRows sessions={[makeSession()]} />);

    mocks.fileCards[1].onRetry?.();

    expect(mocks.retryUploadItem).toHaveBeenCalledWith('s1', 'r2');
  });

  it('shows the session error message for a failed upload', () => {
    const { getByText } = render(
      <UploadProgressRows
        sessions={[
          makeSession({
            failed: true,
            errorMessage: 'Upload failed. Use Retry on the file below.',
          }),
        ]}
      />,
    );

    expect(
      getByText('Upload failed. Use Retry on the file below.'),
    ).toBeTruthy();
  });
});
