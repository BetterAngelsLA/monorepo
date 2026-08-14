import { render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import type { ClientDocumentType } from '../../../apollo';
import Documents from './Documents';

const mocks = vi.hoisted(() => ({
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

vi.mock('../../../ui-components', () => ({
  DocumentModal: () => null,
  FileThumbnail: () => null,
}));

function renderFolder(options: { data?: ClientDocumentType[] }) {
  return render(
    <Documents
      title="Doc Ready"
      expanded="Doc Ready"
      setExpanded={() => undefined}
      data={options.data ?? []}
      clientId="client-1"
    />,
  );
}

describe('Documents', () => {
  beforeEach(() => {
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

  it('renders no rows when there are no documents', () => {
    renderFolder({});

    expect(mocks.fileCards).toHaveLength(0);
  });
});
