import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReactNode } from 'react';
import { Text } from 'react-native';
import { ScreenHeaderCloseButton } from './buttons';
import { ScreenHeader } from './ScreenHeader';

const mocks = vi.hoisted(() => ({
  back: vi.fn(),
}));

vi.mock('expo-router', () => ({
  useRouter: () => ({ back: mocks.back }),
}));

vi.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, bottom: 0, left: 0, right: 0 }),
}));

// The shared ui-components barrel drags in native modules (expo-image,
// expo-modules-core) that cannot initialise in this environment. Stub it to the
// pieces the header actually uses.
vi.mock('@monorepo/expo/shared/ui-components', () => ({
  TextBold: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
  TextRegular: ({ children }: { children: ReactNode }) => (
    <Text>{children}</Text>
  ),
}));

// Icons are SVG assets that cannot load here; the close glyph is not asserted.
vi.mock('@monorepo/expo/shared/icons', () => ({
  PlusIcon: () => null,
}));

describe('ScreenHeader', () => {
  beforeEach(() => {
    mocks.back.mockClear();
  });

  it('renders the title', () => {
    render(<ScreenHeader title="Upload Files" />);

    expect(screen.getByText('Upload Files')).toBeTruthy();
  });

  it('defaults to a Back button that navigates back', () => {
    render(<ScreenHeader title="Upload Files" />);

    fireEvent.press(screen.getByTestId('screen-header-back-btn'));

    expect(mocks.back).toHaveBeenCalledTimes(1);
  });

  it('renders no left button when buttonLeft is null', () => {
    render(<ScreenHeader title="Upload Files" buttonLeft={null} />);

    expect(screen.queryByTestId('screen-header-back-btn')).toBeNull();
  });

  it('renders the supplied left and right slots', () => {
    render(
      <ScreenHeader
        title="Upload Files"
        buttonLeft={<Text>Cancel</Text>}
        buttonRight={<Text>Done</Text>}
      />,
    );

    expect(screen.getByText('Cancel')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
    expect(screen.queryByTestId('screen-header-back-btn')).toBeNull();
  });

  it('pads for the status bar, and honours a topInset override', () => {
    const { rerender } = render(
      <ScreenHeader title="Upload Files" testID="header" />,
    );

    expect(screen.getByTestId('header').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingTop: 47 })]),
    );

    rerender(
      <ScreenHeader title="Upload Files" testID="header" topInset={0} />,
    );

    expect(screen.getByTestId('header').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ paddingTop: 0 })]),
    );
  });

  describe('variants', () => {
    it('renders a Back button and no close button by default', () => {
      render(<ScreenHeader title="Clients" />);

      expect(screen.getByTestId('screen-header-back-btn')).toBeTruthy();
      expect(screen.queryByTestId('screen-header-close-btn')).toBeNull();
    });

    it('renders a close button and no Back button for modal', () => {
      render(<ScreenHeader variant="modal" title="Upload Files" />);

      expect(screen.getByTestId('screen-header-close-btn')).toBeTruthy();
      expect(screen.queryByTestId('screen-header-back-btn')).toBeNull();
    });

    it("closes via the router by default on modal's close button", () => {
      render(<ScreenHeader variant="modal" title="Upload Files" />);

      fireEvent.press(screen.getByTestId('screen-header-close-btn'));

      expect(mocks.back).toHaveBeenCalledTimes(1);
    });

    it('renders a text label on the close button when one is given', () => {
      render(
        <ScreenHeader
          variant="modal"
          title="Upload Files"
          buttonRight={<ScreenHeaderCloseButton label="Done" />}
        />,
      );

      expect(screen.getByText('Done')).toBeTruthy();
    });

    it('renders only the inset background for minimal', () => {
      render(
        <ScreenHeader variant="minimal" title="Upload Files" testID="header" />,
      );

      const bar = screen.getByTestId('header');

      expect(bar.props.style).toEqual(expect.objectContaining({ height: 47 }));
      expect(screen.queryByText('Upload Files')).toBeNull();
      expect(screen.queryByTestId('screen-header-back-btn')).toBeNull();
    });
  });
});
