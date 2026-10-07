/**
 * Stubs for the shared Expo barrels, for use from vi.mock factories.
 *
 * `@monorepo/expo/shared/ui-components` and `.../icons` re-export every
 * native-backed component in the design system (maps, PDF viewers, pickers), so
 * importing even `TextBold` loads chains whose native halves do not exist under
 * test. Component tests stub the barrels instead, the same approach the Docs
 * specs use.
 *
 * `@monorepo/expo/shared/static` is deliberately absent: it is plain constants,
 * and tests assert against the real colour values.
 *
 * Lives under src/__mocks__/ because tsconfig.lib.json already excludes that
 * directory from the library build.
 */
import { cloneElement, ReactNode, ReactElement, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = Record<string, unknown> & { children?: ReactNode };

const asText = ({ children }: Props) => <Text>{children}</Text>;

// Forwards accessibility props so getByLabelText / getByRole still resolve, and
// stays pressable so fireEvent.press works on it.
const asPressable = ({ children, ...rest }: Props) => (
  <Pressable {...rest}>{children}</Pressable>
);

/**
 * Mirrors the real DiscardModal's two-step contract: the trigger only opens the
 * confirmation, and `onDiscard` runs when the modal's own Discard action is
 * pressed. An earlier version ran `onDiscard` on the trigger, which let specs
 * pass while a mis-wired or missing confirmation shipped.
 *
 * The confirm/cancel testIDs match the real component
 * (libs/expo/shared/ui-components/src/lib/DiscardModal/index.tsx).
 */
const DiscardModalStub = ({
  button,
  title,
  body,
  onDiscard,
}: {
  button?: ReactElement<{ onPress?: () => void }>;
  title?: string;
  body?: string;
  onDiscard?: () => void;
}) => {
  const [visible, setVisible] = useState(false);

  return (
    <>
      {button
        ? cloneElement(button, {
            onPress: () => {
              button.props.onPress?.();
              setVisible(true);
            },
          })
        : null}
      {visible ? (
        <View>
          {title ? <Text>{title}</Text> : null}
          {body ? <Text>{body}</Text> : null}
          <Pressable
            testID="discard-modal-cancel"
            accessibilityRole="button"
            onPress={() => setVisible(false)}
          >
            <Text>Keep Editing</Text>
          </Pressable>
          <Pressable
            testID="discard-modal-confirm"
            accessibilityRole="button"
            onPress={() => {
              onDiscard?.();
              setVisible(false);
            }}
          >
            <Text>Discard</Text>
          </Pressable>
        </View>
      ) : null}
    </>
  );
};

export const uiComponents = () => ({
  TextBold: asText,
  TextRegular: asText,
  TextMedium: asText,
  IconButton: asPressable,
  Button: asPressable,
  Avatar: () => <View />,
  Loading: () => <View />,
  InfiniteList: InfiniteListStub,
  DiscardModal: DiscardModalStub,
});

// Renders items synchronously; virtualization itself is FlashList's job and is
// not under test here. Keeps header/empty/footer rendering observable.
type InfiniteListStubProps = {
  data?: readonly unknown[];
  renderItem?: (item: never) => ReactNode;
  keyExtractor?: (item: never) => string;
  ListHeaderComponent?: ReactNode;
  ListEmptyComponent?: ReactNode | (() => ReactNode);
  ListFooterComponent?: ReactNode;
};

const InfiniteListStub = ({
  data = [],
  renderItem,
  keyExtractor,
  ListHeaderComponent,
  ListEmptyComponent,
  ListFooterComponent,
}: InfiniteListStubProps) => (
  <View>
    {ListHeaderComponent}
    {data.length === 0
      ? typeof ListEmptyComponent === 'function'
        ? ListEmptyComponent()
        : ListEmptyComponent
      : data.map((item, index) => (
          <View key={keyExtractor?.(item as never) ?? index}>
            {renderItem?.(item as never)}
          </View>
        ))}
    {ListFooterComponent}
  </View>
);

// Listed explicitly rather than proxied: Vitest validates a mock's exports
// statically, so a Proxy's `get` trap is not enough — it reports the export as
// missing. Add a name here when a screen under test starts using another icon.
const stubIcon = () => <View />;

export const icons = () => ({
  ExternalLinkOutlinedIcon: stubIcon,
  InfoIcon: stubIcon,
  PlusIcon: stubIcon,
  ArrowLeftIcon: stubIcon,
  ChevronLeftIcon: stubIcon,
  CloseIcon: stubIcon,
});

export const svg = () => ({
  __esModule: true,
  default: ({ children }: Props) => <View>{children}</View>,
  Svg: ({ children }: Props) => <View>{children}</View>,
  Ellipse: () => <View />,
  Path: () => <View />,
  Circle: () => <View />,
  Rect: () => <View />,
  G: ({ children }: Props) => <View>{children}</View>,
});
