import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  Observable,
} from '@apollo/client';
import { ApolloProvider } from '@apollo/client/react';
import { act, render, waitFor } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text, TextInput } from 'react-native';
import {
  AttachmentType,
  ClientDocumentNamespaceEnum,
} from '../../apollo';
import { ClientDocumentDocument } from './__generated__/Document.generated';
import FileScreenComponent from './index';

/**
 * Regression test for the edit-screen input reset introduced by
 * `fetchPolicy: 'cache-and-network'`. The query refetches on every mount and
 * the network response always replaces `data`, so the filename-seeding effect
 * used to run again and overwrite what the user typed. The component must seed
 * the input exactly once.
 */

const mocks = vi.hoisted(() => ({
  inputProps: [] as Array<{
    value?: string;
    onChangeText?: (value: string) => void;
  }>,
}));

vi.mock('../../hooks/snackbar/useSnackbar', () => ({
  default: () => ({ showSnackbar: vi.fn() }),
}));

vi.mock('expo-router', () => ({
  router: { back: vi.fn() },
  useNavigation: () => ({ setOptions: vi.fn() }),
}));

vi.mock('../../ui-components', () => ({
  FileThumbnail: () => null,
  MainScrollContainer: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  Colors: { WHITE: '#FFFFFF', NEUTRAL_EXTRA_LIGHT: '#F6F6F6' },
  MimeTypes: { PDF: 'application/pdf' },
  Radiuses: { xs: 8 },
  Spacings: { sm: 16, xs: 8, md: 24 },
  BaseModal: () => null,
  BasicInput: (props: {
    value?: string;
    onChangeText?: (value: string) => void;
  }) => {
    mocks.inputProps.push(props);

    return (
      <TextInput
        testID="file-name-input"
        accessibilityLabel="File Name"
        accessibilityHint="Enter a file name"
        value={props.value}
        onChangeText={props.onChangeText}
      />
    );
  },
  BottomActions: () => null,
  ImageViewer: () => null,
  Loading: () => <Text testID="file-screen-loading" />,
  PdfViewer: () => null,
  TextBold: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
  TextButton: () => null,
  TextRegular: ({ children }: { children: ReactNode }) => (
    <Text>{children}</Text>
  ),
}));

const DOCUMENT = {
  __typename: 'ClientDocumentType',
  id: 'doc-1',
  createdAt: '2026-01-02T03:04:05.000Z',
  namespace: ClientDocumentNamespaceEnum.DriversLicenseFront,
  originalFilename: 'original.pdf',
  attachmentType: AttachmentType.Document,
  mimeType: 'application/pdf',
  file: { __typename: 'DjangoFileType', url: 'https://example.com/signed-1', name: 'original.pdf' },
} as const;

function createClient(deferred: { resolve: (data: unknown) => void }) {
  const link = new ApolloLink(
    () =>
      new Observable((observer) => {
        deferred.resolve = observer.next.bind(observer);
      }),
  );
  const client = new ApolloClient({
    link,
    cache: new InMemoryCache({ addTypename: false }),
  });

  client.writeQuery({
    query: ClientDocumentDocument,
    variables: { id: DOCUMENT.id },
    data: { clientDocument: DOCUMENT },
  });

  return client;
}

describe('FileScreenComponent (edit mode)', () => {
  beforeEach(() => {
    mocks.inputProps = [];
  });

  it('does not overwrite the typed file name when the background refetch resolves', async () => {
    const deferred: { resolve: (data: unknown) => void } = {
      resolve: () => undefined,
    };
    const client = createClient(deferred);

    const { getByTestId } = render(
      <ApolloProvider client={client}>
        <FileScreenComponent id={DOCUMENT.id} clientId="client-1" editing="true" />
      </ApolloProvider>,
    );

    expect(getByTestId('file-name-input').props.value).toBe('original.pdf');

    const latestInput = mocks.inputProps[mocks.inputProps.length - 1];

    await act(async () => {
      latestInput.onChangeText?.('renamed.pdf');
    });

    expect(getByTestId('file-name-input').props.value).toBe('renamed.pdf');

    await act(async () => {
      deferred.resolve({
        data: {
          clientDocument: {
            ...DOCUMENT,
            originalFilename: 'server-renamed.pdf',
            file: {
              ...DOCUMENT.file,
              url: 'https://example.com/signed-2',
            },
          },
        },
      });
    });

    await waitFor(() =>
      expect(getByTestId('file-name-input').props.value).toBe('renamed.pdf'),
    );
  });
});
