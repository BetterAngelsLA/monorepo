export function isMutationSuccess<T extends { __typename?: string }>(
  result: T | null | undefined,
  expectedTypename: string,
): result is T {
  return result?.__typename === expectedTypename;
}
