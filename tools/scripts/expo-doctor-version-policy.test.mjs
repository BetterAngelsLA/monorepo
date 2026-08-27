/**
 * Tests for expo-doctor-version-policy.mjs
 *
 * Runs with Node's built-in test runner (no deps, no config):
 *   node --test tools/scripts/expo-doctor-version-policy.test.mjs
 *   (or `node --test "tools/scripts/*.test.mjs"` from the repo root)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  BUCKETS,
  coerceVersion,
  classifyMismatch,
  parseInstallCheckJson,
  evaluateVersionPolicy,
  formatMismatchSections,
} from './expo-doctor-version-policy.mjs';

// ---------------------------------------------------------------------------
// coerceVersion
// ---------------------------------------------------------------------------

describe('coerceVersion', () => {
  it('coerces a tilde range to its base version', () => {
    assert.deepEqual(coerceVersion('~57.0.11'), {
      major: 57,
      minor: 0,
      patch: 11,
    });
  });

  it('coerces a caret range to its base version', () => {
    assert.deepEqual(coerceVersion('^2.32.0'), {
      major: 2,
      minor: 32,
      patch: 0,
    });
  });

  it('coerces a bare semver', () => {
    assert.deepEqual(coerceVersion('3.1.0'), { major: 3, minor: 1, patch: 0 });
    assert.deepEqual(coerceVersion('0.86.2'), {
      major: 0,
      minor: 86,
      patch: 2,
    });
  });

  it('coerces a leading-v version', () => {
    assert.deepEqual(coerceVersion('v1.2.3'), { major: 1, minor: 2, patch: 3 });
  });

  it('zero-fills partial versions', () => {
    assert.deepEqual(coerceVersion('1.2'), { major: 1, minor: 2, patch: 0 });
    assert.deepEqual(coerceVersion('1'), { major: 1, minor: 0, patch: 0 });
  });

  it('ignores prerelease/build metadata (like semver.coerce)', () => {
    assert.deepEqual(coerceVersion('57.0.9-canary.1'), {
      major: 57,
      minor: 0,
      patch: 9,
    });
  });

  it('returns null for uncoercible input', () => {
    assert.equal(coerceVersion('abc'), null);
    assert.equal(coerceVersion(''), null);
    assert.equal(coerceVersion(undefined), null);
    assert.equal(coerceVersion(null), null);
    assert.equal(coerceVersion('latest'), null);
  });
});

// ---------------------------------------------------------------------------
// classifyMismatch
// ---------------------------------------------------------------------------

describe('classifyMismatch', () => {
  it('buckets a major version mismatch (the gesture-handler CI failure)', () => {
    assert.equal(
      classifyMismatch({
        expectedVersionOrRange: '~3.1.0',
        actualVersion: '2.32.0',
      }),
      BUCKETS.MAJOR,
    );
  });

  it('buckets a minor version mismatch', () => {
    assert.equal(
      classifyMismatch({
        expectedVersionOrRange: '~57.1.0',
        actualVersion: '57.0.9',
      }),
      BUCKETS.MINOR,
    );
  });

  it('buckets a patch version mismatch (expo released a new patch)', () => {
    assert.equal(
      classifyMismatch({
        expectedVersionOrRange: '~57.0.11',
        actualVersion: '57.0.10',
      }),
      BUCKETS.PATCH,
    );
  });

  it('returns null when versions match (defensive; should not appear in output)', () => {
    assert.equal(
      classifyMismatch({
        expectedVersionOrRange: '~57.0.9',
        actualVersion: '57.0.9',
      }),
      null,
    );
  });

  it('buckets uncoercible versions as unknown', () => {
    assert.equal(
      classifyMismatch({
        expectedVersionOrRange: '~57.0.9',
        actualVersion: 'not-a-version',
      }),
      BUCKETS.UNKNOWN,
    );
  });
});

// ---------------------------------------------------------------------------
// parseInstallCheckJson
// ---------------------------------------------------------------------------

describe('parseInstallCheckJson', () => {
  it('parses the up-to-date payload', () => {
    const result = parseInstallCheckJson('{"dependencies":[],"upToDate":true}');
    assert.equal(result.upToDate, true);
    assert.deepEqual(result.mismatches, []);
  });

  it('parses a mismatch payload and buckets each dependency', () => {
    const stdout = JSON.stringify({
      upToDate: false,
      dependencies: [
        {
          packageName: 'react-native-gesture-handler',
          packageType: 'dependencies',
          expectedVersionOrRange: '~3.1.0',
          actualVersion: '2.32.0',
        },
        {
          packageName: 'expo',
          packageType: 'dependencies',
          expectedVersionOrRange: '~57.0.11',
          actualVersion: '57.0.10',
        },
      ],
    });

    const result = parseInstallCheckJson(stdout);
    assert.equal(result.upToDate, false);
    assert.equal(result.mismatches.length, 2);
    assert.deepEqual(result.mismatches[0], {
      packageName: 'react-native-gesture-handler',
      packageType: 'dependencies',
      expectedVersionOrRange: '~3.1.0',
      actualVersion: '2.32.0',
      bucket: BUCKETS.MAJOR,
    });
    assert.equal(result.mismatches[1].bucket, BUCKETS.PATCH);
  });

  it('tolerates non-JSON noise before the JSON payload', () => {
    const stdout = `npm warn some@noise
{"dependencies":[],"upToDate":true}`;
    const result = parseInstallCheckJson(stdout);
    assert.equal(result.upToDate, true);
    assert.deepEqual(result.mismatches, []);
  });

  it('tolerates expo env-loading noise that itself contains braces', () => {
    // Real output observed from `npx expo install --check --json` in CI:
    // the "injected env ... { override: true }" line breaks naive
    // first-{-to-last-} extraction.
    const stdout = `env: load .env
env: export EXPO_PUBLIC_API_URL EXPO_PUBLIC_DEMO_API_URL
◇ injected env (0) from .env // tip: ⌘ override existing { override: true }
{"dependencies":[],"upToDate":true}`;
    const result = parseInstallCheckJson(stdout);
    assert.equal(result.upToDate, true);
    assert.deepEqual(result.mismatches, []);
  });

  it('parses a nested mismatch payload even with brace-containing noise before it', () => {
    const stdout = `◇ injected env (0) from .env // tip: ⌘ override existing { override: true }
{"upToDate":false,"dependencies":[{"packageName":"expo","packageType":"dependencies","expectedVersionOrRange":"~57.0.11","actualVersion":"57.0.10"}]}`;
    const result = parseInstallCheckJson(stdout);
    assert.equal(result.upToDate, false);
    assert.equal(result.mismatches.length, 1);
    assert.equal(result.mismatches[0].packageName, 'expo');
    assert.equal(result.mismatches[0].bucket, BUCKETS.PATCH);
  });

  it('throws on invalid JSON (fail closed)', () => {
    assert.throws(() => parseInstallCheckJson('this is not json'));
    assert.throws(() => parseInstallCheckJson(''));
  });

  it('throws when the payload has no dependencies array (fail closed)', () => {
    assert.throws(() => parseInstallCheckJson('{"upToDate":true}'));
  });
});

// ---------------------------------------------------------------------------
// evaluateVersionPolicy
// ---------------------------------------------------------------------------

describe('evaluateVersionPolicy', () => {
  const mismatch = (packageName, bucket) => ({
    packageName,
    expectedVersionOrRange: '~1.0.0',
    actualVersion: '1.0.0',
    bucket,
  });

  it('fails on major mismatches only', () => {
    const { fail, warn } = evaluateVersionPolicy([
      mismatch('a', BUCKETS.MAJOR),
    ]);
    assert.equal(fail.length, 1);
    assert.equal(fail[0].packageName, 'a');
    assert.deepEqual(warn, []);
  });

  it('warns (does not fail) on minor/patch/unknown mismatches', () => {
    const { fail, warn } = evaluateVersionPolicy([
      mismatch('minor-pkg', BUCKETS.MINOR),
      mismatch('patch-pkg', BUCKETS.PATCH),
      mismatch('unknown-pkg', BUCKETS.UNKNOWN),
    ]);
    assert.deepEqual(fail, []);
    assert.deepEqual(
      warn.map((m) => m.packageName),
      ['minor-pkg', 'patch-pkg', 'unknown-pkg'],
    );
  });

  it('separates fail and warn for a mixed payload', () => {
    const { fail, warn } = evaluateVersionPolicy([
      mismatch('drifted', BUCKETS.MAJOR),
      mismatch('out-of-date', BUCKETS.PATCH),
    ]);
    assert.deepEqual(
      fail.map((m) => m.packageName),
      ['drifted'],
    );
    assert.deepEqual(
      warn.map((m) => m.packageName),
      ['out-of-date'],
    );
  });

  it('returns empty lists for no mismatches', () => {
    const { fail, warn } = evaluateVersionPolicy([]);
    assert.deepEqual(fail, []);
    assert.deepEqual(warn, []);
  });

  it('flags the real CI failure (gesture-handler major) as a failure', () => {
    const payload = parseInstallCheckJson(
      JSON.stringify({
        upToDate: false,
        dependencies: [
          {
            packageName: 'react-native-gesture-handler',
            packageType: 'dependencies',
            expectedVersionOrRange: '~3.1.0',
            actualVersion: '2.32.0',
          },
        ],
      }),
    );
    const { fail } = evaluateVersionPolicy(payload.mismatches);
    assert.equal(fail.length, 1);
    assert.equal(fail[0].packageName, 'react-native-gesture-handler');
  });
});

// ---------------------------------------------------------------------------
// formatMismatchSections
// ---------------------------------------------------------------------------

describe('formatMismatchSections', () => {
  const mismatch = (
    packageName,
    bucket,
    expected = '~1.0.0',
    actual = '1.0.0',
  ) => ({
    packageName,
    expectedVersionOrRange: expected,
    actualVersion: actual,
    bucket,
  });

  it('formats a patch mismatch section with icon, header and table', () => {
    const out = formatMismatchSections([
      mismatch('expo', BUCKETS.PATCH, '~57.0.11', '57.0.10'),
    ]);
    assert.ok(out.includes('🔧 Patch version mismatches'));
    assert.ok(out.includes('expo'));
    assert.ok(out.includes('~57.0.11'));
    assert.ok(out.includes('57.0.10'));
  });

  it('groups sections by bucket in major→minor→patch→unknown order', () => {
    const out = formatMismatchSections([
      mismatch('expo', BUCKETS.PATCH),
      mismatch('gesture', BUCKETS.MAJOR, '~3.1.0', '2.32.0'),
    ]);
    const majorIdx = out.indexOf('❗ Major version mismatches');
    const patchIdx = out.indexOf('🔧 Patch version mismatches');
    assert.ok(majorIdx >= 0 && patchIdx >= 0);
    assert.ok(majorIdx < patchIdx);
  });

  it('returns an empty string for no mismatches', () => {
    assert.equal(formatMismatchSections([]), '');
  });
});
