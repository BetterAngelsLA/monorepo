export function disableControls(propNames: string[]) {
  return Object.fromEntries(
    propNames.map((name) => [
      name,
      { control: false, table: { disable: true } },
    ])
  );
}
