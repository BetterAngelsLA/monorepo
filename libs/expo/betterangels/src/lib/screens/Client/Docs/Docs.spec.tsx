import { fireEvent, render } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ClientProfileQuery } from '../__generated__/Client.generated';
import Docs from './index';

const mocks = vi.hoisted(() => ({
  showModalScreen: vi.fn(),
}));

vi.mock('../../../providers', () => ({
  useModalScreen: () => ({ showModalScreen: mocks.showModalScreen }),
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
  TextMedium: ({ children }: { children: ReactNode }) => (
    <Text>{children}</Text>
  ),
  TextBold: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
  TextRegular: ({ children }: { children: ReactNode }) => (
    <Text>{children}</Text>
  ),
}));

vi.mock('./Documents', () => ({
  __esModule: true,
  default: ({ title }: { title: string }) => (
    <View>
      <Text>{title}</Text>
    </View>
  ),
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
  });

  it('shows the empty state when there are no documents', () => {
    const { getByText, queryByText } = render(<Docs client={emptyClient} />);

    expect(getByText('No files yet')).toBeTruthy();
    expect(queryByText('Doc Ready')).toBeNull();
  });

  it('shows document sections when documents exist', () => {
    const { getByText, queryByText } = render(
      <Docs client={populatedClient} />,
    );

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
});
