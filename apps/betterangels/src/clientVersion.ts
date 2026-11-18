// ---------------------------------------------------------------------------
// Which build is this?
//
// Two consumers, one answer:
//   - the `x-client-version` header on every API request, so a report can be
//     tied to a bundle in the server logs (see `@monorepo/ba-platform`);
//   - the web update check, which compares this against the deployed
//     `version.json` and offers a reload when they differ.
//
// They need different strings. The header wants everything that distinguishes a
// running bundle, including the OTA update id on a device. The comparison wants
// the commit alone — an OTA id would never appear in `version.json`. That is why
// the screen passes the raw `BUILD_ID` to `WebUpdatePrompt` and only the header
// gets `getBundleVersion()`.
//
// On web `EXPO_PUBLIC_BUILD_ID` is the commit the export was built from. On
// native, EAS OTA updates are what move a device between bundles, so the update
// id is the meaningful half; a build with neither falls back to the runtime
// version, which is the fingerprint of the native binary — still enough to tell
// two different binaries apart in a log.
// ---------------------------------------------------------------------------
import { configureClientVersion } from '@monorepo/ba-platform';
import * as Updates from 'expo-updates';

/** Commit the bundle was built from; inlined by Metro at build time. */
export const BUILD_ID: string | undefined =
  process.env.EXPO_PUBLIC_BUILD_ID?.trim() || undefined;

/** EAS OTA update id, or undefined on web and on a bare dev build. */
const OTA_UPDATE_ID: string | undefined = Updates.updateId ?? undefined;

/** Fingerprint of the native binary; undefined on web. */
const RUNTIME_VERSION: string | undefined = Updates.runtimeVersion ?? undefined;

const short = (value: string) => value.slice(0, 12);

/**
 * The value reported to the server.
 *
 * Shaped as `<build>` / `<build>+ota:<id>` so a log line says both which commit
 * shipped and, on a device, which update of it is running. The fallbacks exist
 * because `unknown` is the one answer that helps nobody: `rt:<fingerprint>`
 * still distinguishes two native binaries, and `unknown` is reserved for a build
 * with no identity at all — which is itself worth seeing, since it means the
 * build env was misconfigured.
 */
export const getBundleVersion = (): string => {
  const identity = BUILD_ID ? short(BUILD_ID) : undefined;

  if (identity && OTA_UPDATE_ID) return `${identity}+ota:${short(OTA_UPDATE_ID)}`;
  if (identity) return identity;
  if (OTA_UPDATE_ID) return `ota:${short(OTA_UPDATE_ID)}`;
  if (RUNTIME_VERSION) return `rt:${short(RUNTIME_VERSION)}`;

  return 'unknown';
};

/** Install the header value. Called once from `init.ts`, before any request. */
export const installClientVersion = (): void => {
  configureClientVersion(getBundleVersion());
};
