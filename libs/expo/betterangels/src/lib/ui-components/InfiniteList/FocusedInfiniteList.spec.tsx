/**
 * Pins the app's focus gate: the shared list takes `isFocused` as a prop, and this
 * adapter is the single place that supplies it from the router. If this wiring
 * breaks, every list in the app silently stops gating and a covered list drains its
 * dataset again — the reported bug — so it is asserted here rather than left to the
 * runtime probes in the PR description.
 *
 * Imports the module directly, the same path a call site uses — the app's
 * `ui-components` barrel pulls in native-backed components (expo-updates, camera)
 * that cannot load here, which is why app specs stub the design system barrel.
 */
import { render } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FocusedInfiniteList } from './FocusedInfiniteList';

const mocks = vi.hoisted(() => ({
  isFocused: true,
  received: undefined as
    | {
        isFocused?: boolean;
        data?: unknown;
        renderItem?: unknown;
        keyExtractor?: unknown;
        totalItems?: number;
      }
    | undefined,
}));

vi.mock('./useScreenFocused', () => ({
  useScreenFocused: () => mocks.isFocused,
}));

// Records what the adapter forwards; the real list is covered in the design system.
vi.mock('@monorepo/expo/shared/ui-components', () => ({
  InfiniteList: (props: Record<string, unknown>) => {
    mocks.received = props;

    return null;
  },
}));

const list = () => (
  <FocusedInfiniteList
    data={[{ id: '1' }]}
    renderItem={() => null}
    keyExtractor={(item) => item.id}
    totalItems={100}
  />
);

describe('app focus aware list', () => {
  beforeEach(() => {
    mocks.isFocused = true;
    mocks.received = undefined;
  });

  /**
   * The gate is an added prop, not a replacement: everything the caller passed
   * still has to reach the list. Dropping the spread while forwarding `isFocused`
   * is a plausible edit and renders an empty list, so assert the pass-through.
   */
  it('forwards the caller props to the list, not just the gate', async () => {
    await render(list());

    expect(mocks.received?.totalItems).toBe(100);
    expect(mocks.received?.data).toEqual([{ id: '1' }]);
    expect(mocks.received?.renderItem).toBeTypeOf('function');
    expect(mocks.received?.keyExtractor).toBeTypeOf('function');
  });

  it('passes the router focus state through to the list', async () => {
    await render(list());

    expect(mocks.received?.isFocused).toBe(true);
  });

  it('withholds paging when the screen is elsewhere', async () => {
    mocks.isFocused = false;

    await render(list());

    expect(mocks.received?.isFocused).toBe(false);
  });

  /**
   * Covers re-attaching the handler, which is all a stubbed list can show. That the
   * real FlashList then *fires* depends on its end latch, which a stub has none of —
   * see the note on the same case in the design system's `InfiniteList.spec.tsx`.
   */
  it('reattaches paging when the screen comes back', async () => {
    mocks.isFocused = false;
    const view = await render(list());

    expect(mocks.received?.isFocused).toBe(false);

    mocks.isFocused = true;
    await view.rerender(list());

    expect(mocks.received?.isFocused).toBe(true);
  });
});
