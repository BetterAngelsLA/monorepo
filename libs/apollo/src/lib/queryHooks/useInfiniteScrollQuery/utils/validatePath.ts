import { readAtPath } from '../../../utils';

export function isValidPath(
  source: unknown,
  path: string | readonly string[]
): boolean {
  const value = readAtPath(source, path);

  return value !== undefined;
}

export function validatePathOrThrow(
  source: unknown,
  path: string | readonly string[]
): void {
  const valid = isValidPath(source, path);

  if (!valid) {
    const msg = `[validatePathOrThrow] Could not find value at path ${JSON.stringify(
      path
    )}`;

    throw new Error(msg);
  }

  return;
}
