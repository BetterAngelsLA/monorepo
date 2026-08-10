/**
 * Pure policy logic for the repo's expo-doctor CI wrapper.
 *
 * `expo-doctor` treats EVERY SDK dependency-version mismatch — major, minor,
 * patch, prerelease — as a hard failure, even when the mismatch is just "Expo
 * shipped a new patch, your pinned version is now one patch behind." That makes
 * CI (and the merge queue) flaky whenever Expo releases an update mid-PR.
 *
 * This module re-implements expo-doctor's bucketing of `expo install --check
 * --json` output and applies the repo's policy:
 *
 *   - ❗ major mismatches  -> FAIL  (unexpected version drift — e.g. a package
 *                                    pinned to a different major than the SDK
 *                                    expects)
 *   - ⚠️ minor / 🔧 patch / ➿ other -> WARN (usually "Expo released an update";
 *                                    must not fail CI)
 *
 * Pure module: no child_process, no fs, no deps. Tested with `node --test`.
 */
export const BUCKETS = Object.freeze({
  MAJOR: 'major',
  MINOR: 'minor',
  PATCH: 'patch',
  UNKNOWN: 'unknown',
});

/** Buckets that fail CI. Everything else is a warning. */
export const FAIL_BUCKETS = Object.freeze(new Set([BUCKETS.MAJOR]));
export const WARN_BUCKETS = Object.freeze(
  new Set([BUCKETS.MINOR, BUCKETS.PATCH, BUCKETS.UNKNOWN])
);

const BUCKET_META = Object.freeze({
  [BUCKETS.MAJOR]: { icon: '❗', title: 'Major version mismatches' },
  [BUCKETS.MINOR]: { icon: '⚠️', title: 'Minor version mismatches' },
  [BUCKETS.PATCH]: { icon: '🔧', title: 'Patch version mismatches' },
  [BUCKETS.UNKNOWN]: { icon: '➿', title: 'Other/prerelease mismatches' },
});

const BUCKET_ORDER = [BUCKETS.MAJOR, BUCKETS.MINOR, BUCKETS.PATCH, BUCKETS.UNKNOWN];

/**
 * Minimal subset of `semver.coerce`: extract the leading x.y.z (or x.y / x)
 * from a version/range string and zero-fill. Prerelease/build metadata is
 * ignored (matching semver.coerce behavior).
 *
 * @param {string | null | undefined} value
 * @returns {{ major: number, minor: number, patch: number } | null}
 */
export function coerceVersion(value) {
  if (typeof value !== 'string') return null;
  const match = value.match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2] ?? 0),
    patch: Number(match[3] ?? 0),
  };
}

/**
 * Bucket a single dependency from `expo install --check --json`, mirroring
 * expo-doctor's classify logic:
 *
 *   - null    -> versions match (defensive; such deps shouldn't be listed)
 *   - 'major' -> different major
 *   - 'minor' -> same major, different minor
 *   - 'patch' -> same major/minor, different patch
 *   - 'unknown' -> either version could not be coerced
 *
 * @param {{ expectedVersionOrRange?: string, actualVersion?: string }} dep
 * @returns {string | null}
 */
export function classifyMismatch(dep) {
  const expected = coerceVersion(dep?.expectedVersionOrRange);
  const actual = coerceVersion(dep?.actualVersion);
  if (!expected || !actual) return BUCKETS.UNKNOWN;
  if (
    expected.major === actual.major &&
    expected.minor === actual.minor &&
    expected.patch === actual.patch
  ) {
    return null;
  }
  if (expected.major !== actual.major) return BUCKETS.MAJOR;
  if (expected.minor !== actual.minor) return BUCKETS.MINOR;
  return BUCKETS.PATCH;
}

/**
 * Parse the stdout of `npx expo install --check --json` into a normalized
 * shape, adding a `bucket` to each dependency.
 *
 * Fail-closed: throws on unparseable output or a payload without a
 * `dependencies` array, so a broken version check can never silently pass.
 *
 * @param {string} stdout
 * @returns {{ upToDate: boolean, mismatches: Array<object> }}
 */
export function parseInstallCheckJson(stdout) {
  if (typeof stdout !== 'string' || !stdout.trim()) {
    throw new Error('expo install --check --json produced no output');
  }

  let output;
  try {
    output = extractJsonPayload(stdout);
  } catch {
    throw new Error('Could not parse JSON from expo install --check --json output');
  }

  if (!Array.isArray(output?.dependencies)) {
    throw new Error('expo install --check --json output is missing the dependencies array');
  }

  const mismatches = output.dependencies
    .map((dep) => {
      const bucket = classifyMismatch(dep);
      return bucket ? { ...dep, bucket } : null;
    })
    .filter(Boolean);

  return { upToDate: Boolean(output.upToDate), mismatches };
}

/**
 * Extract a JSON object from command output, tolerating leading/trailing
 * non-JSON lines (env-loading or npm warnings) — even when those lines
 * themselves contain braces, e.g.:
 *
 *   ◇ injected env (0) from .env // tip: ⌘ override existing { override: true }
 *   {"dependencies":[],"upToDate":true}
 *
 * @param {string} stdout
 * @returns {object}
 */
function extractJsonPayload(stdout) {
  const trimmed = stdout.trim();
  if (trimmed.startsWith('{')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      // fall through to brace scanning
    }
  }

  const lastClose = stdout.lastIndexOf('}');
  for (let i = 0; i < stdout.length; i++) {
    if (stdout[i] === '{' && lastClose > i) {
      try {
        return JSON.parse(stdout.slice(i, lastClose + 1));
      } catch {
        // keep scanning for the next '{'
      }
    }
  }

  throw new Error('no JSON object found');
}

/**
 * Apply the repo policy: major mismatches fail, everything else warns.
 *
 * @param {Array<object>} mismatches
 * @returns {{ fail: Array<object>, warn: Array<object> }}
 */
export function evaluateVersionPolicy(mismatches) {
  const fail = [];
  const warn = [];
  for (const mismatch of mismatches) {
    if (FAIL_BUCKETS.has(mismatch.bucket)) fail.push(mismatch);
    else if (WARN_BUCKETS.has(mismatch.bucket)) warn.push(mismatch);
  }
  return { fail, warn };
}

/**
 * Render mismatches as expo-doctor-style sections (icon + header + table),
 * grouped by bucket in display order.
 *
 * @param {Array<object>} mismatches
 * @returns {string}
 */
export function formatMismatchSections(mismatches) {
  const grouped = new Map();
  for (const mismatch of mismatches) {
    const rows = grouped.get(mismatch.bucket) ?? [];
    rows.push(mismatch);
    grouped.set(mismatch.bucket, rows);
  }

  const pad = (value, width) => String(value).padEnd(width, ' ');
  const parts = [];

  for (const bucket of BUCKET_ORDER) {
    const rows = grouped.get(bucket);
    if (!rows?.length) continue;

    const nameWidth = Math.max('package'.length, ...rows.map((r) => String(r.packageName).length));
    const expectedWidth = Math.max(
      'expected'.length,
      ...rows.map((r) => String(r.expectedVersionOrRange ?? '').length)
    );
    const foundWidth = Math.max(
      'found'.length,
      ...rows.map((r) => String(r.actualVersion ?? '').length)
    );

    const meta = BUCKET_META[bucket];
    const table = [
      `${pad('package', nameWidth)}${pad('expected', expectedWidth)}${pad('found', foundWidth)}`,
      ...rows.map(
        (r) =>
          `${pad(r.packageName, nameWidth)}${pad(
            r.expectedVersionOrRange ?? '',
            expectedWidth
          )}${pad(r.actualVersion ?? '', foundWidth)}`
      ),
    ];

    parts.push(`${meta.icon} ${meta.title}\n${table.join('\n')}`);
  }

  return parts.join('\n\n');
}
