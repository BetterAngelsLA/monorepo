export function deepCloneWeak<T extends object>(
  input: T,
  cloneMap = new WeakMap<object, object>()
): T {
  // Handle primitives and null/undefined
  if (input === null || typeof input !== 'object') {
    return input;
  }

  // If we've already cloned this object (handles cycles / repeated refs)
  if (cloneMap.has(input)) {
    return cloneMap.get(input) as T;
  }

  // Create the right kind of empty container
  const clone = Array.isArray(input)
    ? ([] as unknown[])
    : ({} as Record<PropertyKey, unknown>);

  cloneMap.set(input, clone);

  // Clone each property recursively
  for (const key of Object.keys(input) as (keyof T)[]) {
    const value = input[key];

    (clone as any)[key] =
      typeof value === 'object' && value !== null
        ? deepCloneWeak(value as object, cloneMap)
        : value;
  }

  return clone as T;
}
