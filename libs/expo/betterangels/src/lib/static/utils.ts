export function createEnumMapper<
  TStringEnum extends Record<string, string>,
  TIntEnum extends Record<string, number>
>(stringEnum: TStringEnum, intEnum: TIntEnum) {
  // string to int
  const forward = Object.fromEntries(
    Object.entries(stringEnum).map(([key, strVal]) => [
      strVal,
      intEnum[key as keyof TIntEnum],
    ])
  ) as Record<TStringEnum[keyof TStringEnum], TIntEnum[keyof TIntEnum]>;

  // int to string
  const reverse = Object.fromEntries(
    Object.entries(forward).map(([strVal, intVal]) => [intVal, strVal])
  ) as Record<TIntEnum[keyof TIntEnum], TStringEnum[keyof TStringEnum]>;

  return {
    toInt(
      value?: TStringEnum[keyof TStringEnum] | ''
    ): TIntEnum[keyof TIntEnum] | null {
      return value ? forward[value] ?? null : null;
    },
    fromInt(
      value?: TIntEnum[keyof TIntEnum] | null
    ): TStringEnum[keyof TStringEnum] | '' {
      return value ? reverse[value] ?? '' : '';
    },
    forward,
    reverse,
  };
}
