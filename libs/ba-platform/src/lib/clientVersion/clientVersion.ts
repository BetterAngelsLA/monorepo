/**
 * The identity of the build this client is running.
 *
 * One process runs exactly one build, so this is a plain module singleton
 * rather than a store with subscribers: it is set once at startup and only
 * read afterwards. It exists in the platform-agnostic package because both the
 * web and native fetch clients tag their requests with it, while only the app
 * knows how to derive it (`expo-updates` on native, a build-time env var on
 * web) — the same split, for the same reason, as `activeOrg`'s storage.
 *
 * Why it matters: a deploy reaches an open tab only when that tab reloads.
 * A request log with `user_agent` alone cannot tell a current bundle from one
 * loaded a week ago, so a report like "the browser version shows a blank
 * screen" is unanswerable after the fact. With this header a request says
 * which build made it.
 */

let clientVersion: string | undefined;

/** Set once at startup. Empty/undefined disables the header. */
export const configureClientVersion = (version?: string | null): void => {
  const trimmed = version?.trim();

  clientVersion = trimmed ? trimmed : undefined;
};

/** The configured build identity, or `undefined` when there isn't one. */
export const getClientVersion = (): string | undefined => clientVersion;

/**
 * Reset for tests. Not exported from the package barrel: nothing in the app
 * should unset the version, and a test that needs to is already importing the
 * module directly.
 */
export const resetClientVersionForTests = (): void => {
  clientVersion = undefined;
};
