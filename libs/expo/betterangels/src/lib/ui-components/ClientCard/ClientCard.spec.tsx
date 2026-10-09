import { fireEvent, render, within } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ClientCard, type IClientCardProps } from './ClientCard';

const mocks = vi.hoisted(() => ({
  showModalScreen: vi.fn(),
  onMenuPress: vi.fn(),
  onPress: vi.fn(),
}));

vi.mock('../../providers', () => ({
  useModalScreen: () => ({ showModalScreen: mocks.showModalScreen }),
}));

vi.mock('@monorepo/expo/shared/icons', () => ({
  IdCardOutlineIcon: () => null,
  LocationDotIcon: () => null,
  ThreeDotIcon: () => null,
  UserOutlineIcon: () => null,
}));

vi.mock('@monorepo/expo/shared/ui-components', () => ({
  Avatar: () => null,
  TextBold: ({ children }: { children: React.ReactNode }) => (
    <Text>{children}</Text>
  ),
  TextRegular: ({ children }: { children: React.ReactNode }) => (
    <Text>{children}</Text>
  ),
  IconButton: ({
    children,
    onPress,
    accessibilityLabel,
    accessibilityHint,
  }: {
    children?: React.ReactNode;
    onPress?: () => void;
    accessibilityLabel?: string;
    accessibilityHint?: string;
  }) => (
    <Text
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      onPress={onPress}
    >
      {children}
    </Text>
  ),
}));

vi.mock('@monorepo/shared/scalars', () => ({
  formatScalarDate: () => '01/01/1990',
}));

vi.mock('../ClientSummary', () => ({
  ClientSummary: () => <Text>ClientSummary</Text>,
}));

const client = {
  id: 'client-1',
  firstName: 'Test',
  lastName: 'Client',
  nickname: null,
  age: 34,
  dateOfBirth: '1990-01-01',
  heightInInches: 70,
  residenceAddress: '123 Main St',
  profilePhoto: null,
  hmisProfiles: [],
} as unknown as IClientCardProps['client'];

const MENU_LABEL = 'open client options menu';

describe('ClientCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * `accessibilityRole="button"` renders a real `<button>` on react-native-web,
   * so a menu button nested inside the card is invalid HTML (React reports a
   * hydration error). The menu must be a sibling of the card's pressable area,
   * never a descendant.
   */
  it('does not nest the menu button inside the card button', async () => {
    const { getByTestId, getByLabelText } = await render(
      <ClientCard client={client} onMenuPress={mocks.onMenuPress} />,
    );

    const card = getByTestId('client-card-test');

    expect(within(card).queryByLabelText(MENU_LABEL)).toBeNull();
    expect(getByLabelText(MENU_LABEL)).toBeTruthy();
  });

  it('still fires onPress when the card itself is tapped', async () => {
    const { getByTestId } = await render(
      <ClientCard client={client} onPress={mocks.onPress} />,
    );

    await fireEvent.press(getByTestId('client-card-test'));

    expect(mocks.onPress).toHaveBeenCalledTimes(1);
  });

  it('fires onMenuPress with the client when the menu is tapped', async () => {
    const { getByLabelText } = await render(
      <ClientCard client={client} onMenuPress={mocks.onMenuPress} />,
    );

    await fireEvent.press(getByLabelText(MENU_LABEL));

    expect(mocks.onMenuPress).toHaveBeenCalledWith(client);
  });

  it('renders no menu when onMenuPress is not provided', async () => {
    const { queryByLabelText } = await render(<ClientCard client={client} />);

    expect(queryByLabelText(MENU_LABEL)).toBeNull();
  });
});
