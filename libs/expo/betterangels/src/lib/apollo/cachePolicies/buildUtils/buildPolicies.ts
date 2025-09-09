// Builds the registry object from a readonly tuple of entries.
// Avoids "string key" widening by using fromEntries + a precise mapped type.
export function buildPolicies<
  const T extends readonly { key: string; build: () => any }[]
>(defs: T) {
  type Out = {
    [I in T[number] as I['key']]: ReturnType<I['build']>;
  };

  // (Optional) dev-time duplicate-key warning
  if (process.env.NODE_ENV !== 'production') {
    const seen = new Set<string>();

    for (const d of defs) {
      if (seen.has(d.key)) {
        // eslint-disable-next-line no-console
        console.warn(
          `[apollo buildPolicies] Duplicate key "${d.key}" – later one will override.`
        );
      }

      seen.add(d.key);
    }
  }

  return Object.fromEntries(defs.map((d) => [d.key, d.build()])) as Out;
}
