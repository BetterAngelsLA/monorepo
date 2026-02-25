/**
 * Asserts that a defined value exists at a specified path within a value.
 *
 * Resolves `path` against `source` and checks that the resolved value is not
 * `undefined`. Paths that exist but resolve to `undefined` are treated as
 * invalid.
 *
 * @param props.source
 * The value from which the path is resolved. May be any JavaScript value.
 *
 * @param props.path
 * A path describing where the expected value should exist within `source`.
 * May be provided as a dot-separated string or an array of path segments.
 *
 * @example
 * assertValueAtPath({
 *   source: { items: { results: [1, 2, 3] } },
 *   path: "items.results",
 * });
 *
 * @param props.shouldThrow
 * When `true`, throws an Error if the path does not resolve to a defined value.
 * When `false` or omitted, logs the error instead.
 *
 * @throws Error
 * Thrown only when `shouldThrow` is `true` and the resolved value is `undefined`.
 */

import { readAtPath } from '../../../utils';

function valueDefinedAtPath(
  source: unknown,
  path: string | readonly string[]
): boolean {
  const value = readAtPath(source, path);

  return value !== undefined;
}

type TProps = {
  source: unknown;
  path: string | readonly string[];
  shouldThrow?: boolean;
};

export function assertValueAtPath(props: TProps): void {
  const { source, path, shouldThrow } = props;

  const valueExists = valueDefinedAtPath(source, path);

  if (!valueExists) {
    const msg = `[assertValueAtPath] Could not find value at path ${JSON.stringify(
      path
    )}`;

    const err = new Error(msg);

    if (shouldThrow) {
      throw err;
    }

    console.error(err);
  }

  return;
}
