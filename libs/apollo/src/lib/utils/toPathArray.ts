/**
 * Normalize a path into an array of string segments.
 * Accepts either a dot-delimited string or an array of strings.
 *
 * Examples:
 *   normalizePath('meta.totalCount') → ['meta', 'totalCount']
 *   normalizePath(['meta', 'totalCount']) → ['meta', 'totalCount']
 */
export function toPathArray(
  path?: string | ReadonlyArray<string>
): string[] | undefined {
  if (!path) {
    return undefined;
  }

  if (typeof path === 'string') {
    return path.split('.');
  }

  if (Array.isArray(path)) {
    return [...path];
  }

  return undefined;
}

export function toPathArrayStrict(
  path?: string | ReadonlyArray<string>
): string[] {
  const result = toPathArray(path);

  if (!result?.length) {
    throw new Error(
      `[toPathArrayStrict] Expected a non-empty string or string[]. Received invalid path input: [${path}].`
    );
  }

  return result;
}
