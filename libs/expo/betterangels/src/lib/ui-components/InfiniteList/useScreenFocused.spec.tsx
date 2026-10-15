/**
 * Pins `useScreenFocused`, the app's single point of contact with the router for
 * paging. Three things it does are load-bearing and easy to break silently:
 *
 * 1. It imports `useIsFocused` from `expo-router/build/useIsFocused`, NOT from
 *    `expo-router`. The package root reaches the vendored React Navigation elements
 *    barrel, whose asset `require()`s make vitest-native synthesise an ESM asset
 *    module importing `createRequire` from `node:module`; Vitest's vm evaluator
 *    cannot link that, and Node reports it as "request for 'node:module' is from a
 *    module not been linked" (with a misleading `expo-router/src/**` frame from a
 *    source map — that directory is not shipped). This import is the reason no
 *    screen spec has to substitute anything. If a future expo-router moves the
 *    file, this spec and every spec rendering a list fail together, naming the
 *    unresolved path rather than reporting an obscure module-linking error.
 *
 * 2. It passes the router's answer through. Without this the gate could be opened
 *    permanently — a list that never stops paging — and every other spec would
 *    still pass, because they stub this module or render no container at all.
 *
 * 3. It defaults to focused when there is no navigation container. A captured test
 *    has none; the app always does. If that guard is removed, rendering a list in
 *    any spec throws "Couldn't find a navigation object".
 */
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useScreenFocused } from './useScreenFocused';

const mocks = vi.hoisted(() => ({
  isFocused: true,
  throws: false,
  throwsForeign: false,
}));

vi.mock('expo-router/build/useIsFocused', () => ({
  useIsFocused: () => {
    if (mocks.throws) {
      throw new Error(
        "Couldn't find a navigation object. Is your component inside NavigationContainer?",
      );
    }

    if (mocks.throwsForeign) {
      throw new Error('Rendered more hooks than during the previous render.');
    }

    return mocks.isFocused;
  },
}));

function Probe() {
  return <Text>{String(useScreenFocused())}</Text>;
}

const rendered = async () => {
  const { getByText } = await render(<Probe />);

  return (value: string) => expect(getByText(value)).toBeTruthy();
};

describe('useScreenFocused', () => {
  afterEach(() => {
    mocks.isFocused = true;
    mocks.throws = false;
    mocks.throwsForeign = false;
  });

  it('is a hook, imported from a module that loads under the test runner', () => {
    expect(useScreenFocused).toBeTypeOf('function');
  });

  it('reports an unfocused screen, which is what withholds paging', async () => {
    mocks.isFocused = false;

    const expectRendered = await rendered();

    expectRendered('false');
  });

  it('reports a focused screen', async () => {
    mocks.isFocused = true;

    const expectRendered = await rendered();

    expectRendered('true');
  });

  /**
   * The case that keeps every other spec from having to substitute this module:
   * a spec renders a screen containing a list with no container above it.
   */
  it('defaults to focused when nothing provides a container', async () => {
    mocks.throws = true;

    const expectRendered = await rendered();

    expectRendered('true');
  });

  /**
   * The guard is narrowed to the missing-container message on purpose: a bare
   * `catch` would also swallow a React invariant raised from inside the hook —
   * "Rendered more hooks than during the previous render" — and report the screen
   * as focused, quietly reopening the gate this whole change closes.
   */
  it('rethrows anything that is not the missing-container error', async () => {
    mocks.throwsForeign = true;

    await expect(render(<Probe />)).rejects.toThrow(
      'Rendered more hooks than during the previous render.',
    );
  });
});
