import { render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import type { ClientDocumentType } from '../../../apollo';
import type { TUploadSession } from '../../../providers';
import Documents from './Documents';

const mocks = vi.hoisted(() => ({
  uploadRows: [] as Array<{ sessions?: unknown[] }>,
  fileCards: [] as Array<{ filename?: string | null }>,
}));

vi.mock('@monorepo/expo/shared/icons', () => ({
  FolderIcon: () => null,
  FolderOpenIcon: () => null,
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  Accordion: ({ children }: { children: ReactNode }) => <>{children}</>,
  FileCard: (props: { filename?: string | null }) => {
    mocks.fileCards.push(props);

    return <Text>{props.filename}</Text>;
  },
}));

vi.mock('../../../providers', () => ({
  UploadProgressRows: (props: { sessions?: unknown[] }) => {
    mocks.uploadRows.push(props);

    return <Text>upload-rows</Text>;
  },
}));

vi.mock('../../../ui-components', () => ({
  DocumentModal: () => null,
  FileThumbnail: () => null,
}));

function makeSession(overrides: Partial<TUploadSession> = {}): TUploadSession {
  return {
    id: 's1',
    stage: 'UPLOADING',
    items: [{ refId: 'r1', name: 'a.pdf', status: 'uploading' }],
    completed: 0,
    total: 1,
    failed: false,
    ...overrides,
  };
}

function renderFolder(options: {
  data?: ClientDocumentType[];
  uploadingSessions?: TUploadSession[];
}) {
  return render(
    <Documents
      title="Doc Ready"
      expanded="Doc Ready"
      setExpanded={() => undefined}
      data={options.data ?? []}
      clientId="client-1"
      uploadingSessions={options.uploadingSessions}
    />,
  );
}

describe('Documents', () => {
  beforeEach(() => {
    mocks.uploadRows = [];
    mocks.fileCards = [];
  });

  it('renders completed document rows from the query data', () => {
    const data = [
      {
        id: 'd1',
        originalFilename: 'consent.pdf',
        createdAt: '2026-08-01T12:00:00.000Z',
        mimeType: 'application/pdf',
        file: { url: 'https://example.com/consent.pdf' },
      },
    ] as unknown as ClientDocumentType[];

    renderFolder({ data });

    expect(mocks.fileCards).toHaveLength(1);
    expect(mocks.fileCards[0].filename).toBe('consent.pdf');
  });

  it('passes the folder’s in-flight sessions to UploadProgressRows', () => {
    const session = makeSession();

    renderFolder({ uploadingSessions: [session] });

    expect(mocks.uploadRows).toHaveLength(1);
    expect(mocks.uploadRows[0].sessions).toEqual([session]);
  });

  it('renders UploadProgressRows with an empty list when there are no uploads', () => {
    renderFolder({});

    expect(mocks.uploadRows).toHaveLength(1);
    expect(mocks.uploadRows[0].sessions).toEqual([]);
  });
});
