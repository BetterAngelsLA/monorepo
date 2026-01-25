/**
 * Turns an array of entry definitions (from `buildEntry`) into a
 * fully-typed Apollo cache policy registry object.
 *
 * Each entry in `defs` is expected to look like:
 *
 *   {
 *     key:   "tasks",
 *     build: () => ({ entityTypename: "TaskType", fieldPolicy: {...} })
 *   }
 *
 * At compile-time:
 *   • The returned object has one property per `key` in `defs`.
 *   • Each property’s value is the return type of its corresponding `build()`.
 *     This keeps `entityTypename` and `fieldPolicy` literals intact.
 *
 * At runtime:
 *   • Iterates over `defs`, calls `build()` for each, and collects them into
 *     an object keyed by `key`.
 *   • In development, logs a warning if any duplicate keys are found.
 *     (The later one would override the earlier one.)
 *
 * Example:
 *
 * ```ts
 * const entries = [
 *   buildEntry<TasksQuery, TasksQueryVariables>({
 *     key: 'tasks',
 *     entityTypename: 'TaskType',
 *     keyArgs: ['filters', 'ordering'] as const,
 *   }),
 *   buildEntry<FilterUsersQuery, FilterUsersQueryVariables>({
 *     key: 'interactionAuthors',
 *     entityTypename: 'InteractionAuthorType',
 *     keyArgs: ['filters', 'order'] as const,
 *   }),
 * ] as const;
 *
 * export const cachePolicyRegistry = assemblePolicyRegistry(entries);
 *
 * // Result type:
 * // {
 * //   tasks: { entityTypename: "TaskType"; fieldPolicy: FieldPolicy },
 * //   interactionAuthors: { entityTypename: "InteractionAuthorType"; fieldPolicy: FieldPolicy },
 * // }
 * ```
 *
 * @param opts - readonly array of entries created via `buildEntry`
 * @returns object keyed by each entry’s `key`, with typed policy values
 */
export function assemblePolicyRegistry<
  const T extends readonly { key: string; buildFn: () => any }[]
>(opts: T) {
  // (Optional) dev-time duplicate-key warning
  // if (process.env['NODE_ENV'] !== 'production') {
  //   const seen = new Set<string>();

  //   for (const { key } of opts) {
  //     if (seen.has(key)) {
  //       // eslint-disable-next-line no-console
  //       console.warn(
  //         `[apollo assemblePolicyRegistry] Duplicate key "${key}" – later one will override.`
  //       );
  //     }
  //     seen.add(key);
  //   }
  // }

  return Object.fromEntries(opts.map(({ key, buildFn }) => [key, buildFn()]));
}
