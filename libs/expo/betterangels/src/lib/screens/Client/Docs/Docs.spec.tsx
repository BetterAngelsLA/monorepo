import { fireEvent, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import Docs from './index';

const mocks = vi.hoisted(() => ({
  showModalScreen: vi.fn(),
  sessions: [] as Array<Record<string, unknown>>,
  documentsProps: [] as Array<{
    title: string;
    expanded?: unknown;
    uploadingSessions?: unknown[];
  }>,
}));

vi.mock('../../../providers', () => ({
  useModalScreen: () => ({ showModalScreen: mocks.showModalScreen }),
  useUploadProgress: () => ({ sessions: mocks.sessions }),
}));

vi.mock('@monorepo/expo/shared/icons', () => ({
  FileOutlineIcon: () => null,
  PlusIcon: () => null,
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  IconButton: ({
    children,
    onPress,
    accessibilityLabel,
  }: {
    children: ReactNode;
    onPress?: () => void;
    accessibilityLabel: string;
  }) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={`opens ${accessibilityLabel}`}
      onPress={onPress}
    >
      {children}
    </Pressable>
  ),
  TextMedium: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
  TextBold: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
  TextRegular: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
}));

vi.mock('./Documents', () => ({
  __esModule: true,
  default: (props: {
    title: string;
    expanded?: unknown;
    uploadingSessions?: unknown[];
  }) => {
    mocks.documentsProps.push(props);

    return (
      <View>
        <Text>{props.title}</Text>
        {props.uploadingSessions?.map((session) => (
          <Text
            key={String((session as { id?: string }).id)}
          >{`uploading-${props.title}`}</Text>
        ))}
      </View>
    );
  },
}));

vi.mock('./UploadModal', () => ({
  __esModule: true,
  default: () => (
    <View>
      <Text>UploadModal</Text>
    </View>
  ),
}));

const emptyClient = {
  clientProfile: {
    id: 'client-1',
    docReadyDocuments: [],
    consentFormDocuments: [],
    otherDocuments: [],
  },
} as unknown as ClientProfileQuery;

const populatedClient = {
  clientProfile: {
    id: 'client-1',
    docReadyDocuments: [{ id: 'd1' }],
    consentFormDocuments: [{ id: 'd2' }],
    otherDocuments: [],
  },
} as unknown as ClientProfileQuery;

describe('Client Docs', () => {
  beforeEach(() => {
    mocks.showModalScreen.mockClear();
    mocks.sessions = [];
    mocks.documentsProps = [];
  });

  function makeSession(overrides: Record<string, unknown> = {}) {
    return {
      id: 's1',
      stage: 'UPLOADING',
      items: [{ refId: 'r1', name: 'a.pdf', status: 'uploading' }],
      completed: 1,
      total: 1,
      failed: false,
      ...overrides,
    };
  }

  it('shows the empty state when there are no documents', () => {
    const { getByText, queryByText } = render(<Docs client={emptyClient} />);

    expect(getByText('No files yet')).toBeTruthy();
    expect(queryByText('Doc Ready')).toBeNull();
  });

  it('shows document sections when documents exist', () => {
    const { getByText, queryByText } = render(<Docs client={populatedClient} />);

    expect(getByText('Doc Ready')).toBeTruthy();
    expect(getByText('Forms')).toBeTruthy();
    expect(queryByText('No files yet')).toBeNull();
  });

  it('opens the upload modal from the add button', () => {
    const { getByLabelText } = render(<Docs client={emptyClient} />);

    fireEvent.press(getByLabelText('add document'));

    expect(mocks.showModalScreen).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Upload Files' }),
    );

    const modalOptions = mocks.showModalScreen.mock.calls[0][0];
    const modal = render(modalOptions.renderContent({ close: vi.fn() }));
    expect(modal.getByText('UploadModal')).toBeTruthy();
  });

  it('shows in-flight uploads in their folder instead of the empty state', () => {
    mocks.sessions = [makeSession({ folder: 'Doc Ready' })];

    const { getByText, queryByText } = render(<Docs client={emptyClient} />);

    expect(queryByText('No files yet')).toBeNull();
    expect(getByText('uploading-Doc Ready')).toBeTruthy();
  });

  it('auto-expands the folder with an in-flight upload', () => {
    mocks.sessions = [makeSession({ folder: 'Forms' })];

    render(<Docs client={emptyClient} />);

    const formsProps = mocks.documentsProps.find(
      (props) => props.title === 'Forms',
    );
    expect(formsProps?.expanded).toBe('Forms');
  });

  it('hides completed sessions and shows the empty state when there are no docs', () => {
    mocks.sessions = [makeSession({ folder: 'Doc Ready', complete: true })];

    const { getByText } = render(<Docs client={emptyClient} />);

    expect(getByText('No files yet')).toBeTruthy();
  });
});
