import { render, screen } from '@testing-library/react-native';
import { ReactElement, ReactNode } from 'react';
import { Text } from 'react-native';
import { headerStyles } from './headerStyles';
import { getStackModalOptions, getStackScreenOptions } from './options';

type TOptions = {
  presentation?: string;
  title?: string;
  headerTitleAlign?: string;
  headerStyle?: { backgroundColor?: string };
  headerTitleStyle?: { color?: string };
  headerBackVisible?: boolean;
  headerShown?: boolean;
  headerLeft?: () => ReactElement;
  headerRight?: () => ReactElement;
};

vi.mock('expo-router', () => ({
  useRouter: () => ({ back: vi.fn() }),
}));

// The shared ui-components barrel drags in native modules (expo-image,
// expo-modules-core) that cannot initialise in this environment. Stub the
// pieces the resolvers render, exposing the props the tests assert on.
vi.mock('@monorepo/expo/shared/ui-components', () => ({
  TextButton: (props: {
    title: string;
    color?: string;
    pressedBackgroundColor?: string;
    accessibilityHint?: string;
    testId?: string;
  }) => (
    <Text testID={props.testId ?? 'text-button'} {...props}>
      {props.title}
    </Text>
  ),
  CloseButton: (props: {
    onClose?: () => void;
    testId?: string;
    iconColor?: string;
    children?: ReactNode;
  }) => (
    <Text testID={props.testId ?? 'close-button'} {...props}>
      {props.children}
    </Text>
  ),
  TextBold: ({ children }: { children: ReactNode }) => <Text>{children}</Text>,
}));

// Icons are SVG assets that cannot load here; the close glyph is not asserted.
vi.mock('@monorepo/expo/shared/icons', () => ({
  PlusIcon: () => null,
}));

function renderSlot(slot: (() => ReactElement) | undefined) {
  if (!slot) {
    throw new Error('Expected a header slot to render');
  }
  render(slot());
}

describe('getStackScreenOptions', () => {
  it('returns the primary screen header options with the given title', () => {
    const options = getStackScreenOptions({ title: 'Settings' });

    expect(options).toMatchObject({
      headerTitleAlign: 'center',
      title: 'Settings',
      headerStyle: { backgroundColor: headerStyles.primary.backgroundColor },
    });
    expect(typeof options.headerLeft).toBe('function');
  });

  it('defaults the title to an empty string', () => {
    expect(getStackScreenOptions().title).toBe('');
  });

  it('renders a Back button via headerLeft', () => {
    render(getStackScreenOptions().headerLeft());

    expect(screen.getByText('Back')).toBeTruthy();
  });
});

describe('getStackModalOptions', () => {
  it('defaults to a modal presentation with the secondary palette and a close button', () => {
    const options = getStackModalOptions({
      title: 'Filter',
      onClose: () => undefined,
    }) as TOptions;

    expect(options).toMatchObject({
      presentation: 'modal',
      title: 'Filter',
      headerTitleAlign: 'center',
      headerStyle: { backgroundColor: headerStyles.secondary.backgroundColor },
      headerTitleStyle: { color: headerStyles.secondary.textColor },
      headerBackVisible: false,
    });
    expect(typeof options.headerRight).toBe('function');
    expect(options.headerLeft).toBeUndefined();

    renderSlot(options.headerRight);
    expect(screen.getByTestId('modal-screen-close-btn').props.iconColor).toBe(
      headerStyles.secondary.textColor,
    );
  });

  it('uses the primary palette and a left Close button for a card presentation', () => {
    const options = getStackModalOptions({
      presentation: 'card',
      onClose: () => undefined,
    }) as TOptions;

    expect(options).toMatchObject({
      presentation: 'card',
      headerStyle: { backgroundColor: headerStyles.primary.backgroundColor },
      headerTitleStyle: { color: headerStyles.primary.textColor },
    });
    expect(typeof options.headerLeft).toBe('function');
    expect(options.headerRight).toBeUndefined();
  });

  it('uses the secondary palette for fullScreenModal', () => {
    const options = getStackModalOptions({
      presentation: 'fullScreenModal',
      onClose: () => undefined,
    }) as TOptions;

    expect(options).toMatchObject({
      presentation: 'fullScreenModal',
      headerStyle: { backgroundColor: headerStyles.secondary.backgroundColor },
    });
    expect(typeof options.headerRight).toBe('function');
  });

  it("lets a header variant override the presentation's palette", () => {
    const options = getStackModalOptions({
      presentation: 'modal',
      header: { variant: 'primary' },
      onClose: () => undefined,
    }) as TOptions;

    expect(options).toMatchObject({
      presentation: 'modal',
      headerStyle: { backgroundColor: headerStyles.primary.backgroundColor },
    });
  });

  it('hides the native bar for a custom header mode', () => {
    expect(
      getStackModalOptions({
        presentation: 'fullScreenModal',
        header: { mode: 'custom' },
      }),
    ).toEqual({
      presentation: 'fullScreenModal',
      headerShown: false,
    });
  });

  it('hides the native bar for a none header mode', () => {
    expect(
      getStackModalOptions({
        presentation: 'modal',
        header: { mode: 'none' },
      }),
    ).toEqual({
      presentation: 'modal',
      headerShown: false,
    });
  });

  it('renders no close button when onClose is omitted', () => {
    const options = getStackModalOptions({ presentation: 'modal' }) as TOptions;

    expect(options.headerRight).toBeUndefined();
  });

  it('threads the close label through to the close button', () => {
    const options = getStackModalOptions({
      presentation: 'fullScreenModal',
      header: { closeLabel: 'Done' },
      onClose: () => undefined,
    }) as TOptions;

    renderSlot(options.headerRight);

    expect(screen.getByText('Done')).toBeTruthy();
  });

  it('renders a card Close button tinted by the resolved palette', () => {
    const options = getStackModalOptions({
      presentation: 'card',
      header: { variant: 'secondary' },
      onClose: () => undefined,
    }) as TOptions;

    renderSlot(options.headerLeft);

    const button = screen.getByTestId('text-button');
    expect(screen.getByText('Close')).toBeTruthy();
    expect(button.props.color).toBe(headerStyles.secondary.textColor);
    expect(button.props.pressedBackgroundColor).toBe(
      headerStyles.secondary.pressedBackgroundColor,
    );
  });
});
