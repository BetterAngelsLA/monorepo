export function hasTypename<TName extends string>(
  obj: unknown,
  typename: TName
): obj is { __typename: TName } {
  return (
    !!obj &&
    typeof obj === 'object' &&
    '__typename' in obj &&
    (obj as any).__typename === typename
  );
}
