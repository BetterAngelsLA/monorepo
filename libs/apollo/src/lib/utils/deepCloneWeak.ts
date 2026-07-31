/**
 * deepCloneWeak
 *
 * A lightweight, cycle-safe deep clone function designed specifically for
 * situations where you need a **mutable copy** of an object that may contain:
 *   • nested objects or arrays
 *   • repeated references
 *   • circular references
 *   • frozen objects (e.g., from Apollo cache)
 *
 * Unlike `structuredClone()` or JSON-based cloning, `deepCloneWeak`:
 *   • does *not* throw on unsupported types
 *   • uses a WeakMap to safely handle cycles
 *   • only clones plain objects and arrays
 *   • keeps primitives and non-plain objects as-is
 *   • produces a minimal deep clone sufficient for safe mutation
 *
 * ---------------------------------------------------------------------------
 * Motivation
 * ---------------------------------------------------------------------------
 * Apollo Client often freezes the incoming data passed into merge functions
 * (`FieldMergeFunction`) to prevent accidental mutations within the cache.
 *
 * For example:
 *   const result = Object.freeze({ results: [...], totalCount: 10 });
 *
 * When merging paginated data, we need to **modify** this object:
 *   - write merged items into the `results` array
 *   - update `totalCount`
 *
 * Mutating a frozen object throws an error, so we need a *writable* clone.
 *
 * `structuredClone()` is too strict (throws on unserializable types, breaks
 * referential identity, and can be expensive). `deepCloneWeak` provides a
 * safe, pragmatic alternative.
 *
 * ---------------------------------------------------------------------------
 * When to Use
 * ---------------------------------------------------------------------------
 * Use `deepCloneWeak` when you:
 *   • need a writable deep clone of data coming from Apollo cache
 *   • want to avoid errors caused by frozen or readonly objects
 *   • want a safe clone even if the input has cycles or repeated references
 *   • want cloning that is “just deep enough” without the overhead or strict
 *     rules of `structuredClone()`
 *
 * It is *not* meant to be a general-purpose serialization clone.
 * It intentionally preserves non-plain objects as-is.
 *
 * ---------------------------------------------------------------------------
 * Example
 * ---------------------------------------------------------------------------
 * ```ts
 * const incoming = Object.freeze({
 *   results: [{ id: 1 }],
 *   totalCount: 1
 * });
 *
 * const clone = deepCloneWeak(incoming);
 * clone.results.push({ id: 2 }); // safe, writable
 * ```
 *
 * ---------------------------------------------------------------------------
 * Notes
 * ---------------------------------------------------------------------------
 * • Only plain objects and arrays are deeply cloned.
 * • Class instances, Dates, Maps, Sets, etc. are copied by reference.
 * • This is intentional — the goal is *safe mutation*, not structural equality.
 */

export function deepCloneWeak<T extends object>(
  input: T,
  cloneMap = new WeakMap<object, object>(),
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

    (clone as Record<PropertyKey, unknown>)[key] =
      typeof value === 'object' && value !== null
        ? deepCloneWeak(value as object, cloneMap)
        : value;
  }

  return clone as T;
}
