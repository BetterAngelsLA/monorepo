// ---------------------------------------------------------------------------
// Which build is this?
//
// Two consumers, one answer:
//   - the `x-client-version` header on every API request, so a report can be
//     tied to a bundle in the server logs (see `@monorepo/ba-platform`);
//   - the web update check, which compares this value against the deployed
//     `version.json` and offers a reload when they differ.
//
// On web, `EXPO_PUBLIC_BUILD_ID` is the commit the export was built from.
// On native, EAS OTA updates are what move a device between bundles, so the
// update id is the meaningful half and is appended when it exists.
// ---------------------------------------------------------------------------
import { configureClientVersion } from '@monorepo/ba-platform';
import * as Updates from 'expo-updates';

/** Commit the bundle was built from; inlined by Metro at build time. */
export const BUILD_ID: string | undefined =
  process.env.EXPO_PUBLIC_BUILD_ID?.trim() || undefined;

/** EAS OTA update id, or undefined on web and on a bare dev build. */
const OTA_UPDATE_ID: string | undefined = Updates.updateId ?? undefined;

const short = (value: string) => value.slice(0, 12);

/**
 * The value reported to the server and compared against `version.json`.
 *
 * Shaped as `<build>` / `<build>+ota:<id>` so a log line says both which commit
 * shipped and, on a device, which update of it is running. `unknown` is a real
 * answer worth seeing in logs: it means the bundle was built without a build id,
 * which is itself the bug when you are trying to identify a stale client.
 */
export const getBundleVersion = (): string => {
  if (BUILD_ID && OTA_UPDATE_ID) return `${short(BUILD_ID)}+ota:${short(OTA_UPDATE_ID)}`;
  if (BUILD_ID) return short(BUILD_ID);
  if (OTA_UPDATE_ID) return `ota:${short(OTA_UPDATE_ID)}`;

  return 'unknown';
};

/** Install the header value. Called once from `init.ts`, before any request. */
export const installClientVersion = (): void => {
  configureClientVersion(getBundleVersion());
};
