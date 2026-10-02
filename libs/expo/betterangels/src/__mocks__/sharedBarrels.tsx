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
import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = Record<string, unknown> & { children?: ReactNode };

const asText = ({ children }: Props) => <Text>{children}</Text>;

// Forwards accessibility props so getByLabelText / getByRole still resolve, and
// stays pressable so fireEvent.press works on it.
const asPressable = ({ children, ...rest }: Props) => (
  <Pressable {...rest}>{children}</Pressable>
);

export const uiComponents = () => ({
  TextBold: asText,
  TextRegular: asText,
  TextMedium: asText,
  IconButton: asPressable,
  Button: asPressable,
  Avatar: () => <View />,
  Loading: () => <View />,
});

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

/**
 * Stateful in-memory MMKV, keyed by scopeId.
 *
 * The shared test-setup.ts registers a react-native-mmkv factory and then calls
 * `vi.mock('react-native-mmkv')` again with no factory, which replaces it with an
 * automock whose `createMMKV()` returns undefined. Anything touching the draft
 * store therefore fails on `undefined.getString`. It also models the v2/v3 API
 * (`delete`) while MMKV v4 — the version in package.json — uses `remove()`.
 *
 * Tests that exercise persistence supply this instead.
 */
export const mmkv = (stores: Map<string, Map<string, string>>) => () => ({
  MMKV: vi.fn(),
  createMMKV: vi.fn((config?: { id?: string }) => {
    const id = config?.id ?? 'default';
    if (!stores.has(id)) stores.set(id, new Map<string, string>());
    const store = stores.get(id) as Map<string, string>;
    return {
      getString: (k: string) => store.get(k),
      set: (k: string, v: string) => void store.set(k, v),
      remove: (k: string) => void store.delete(k),
      clearAll: () => store.clear(),
      getAllKeys: () => Array.from(store.keys()),
    };
  }),
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
