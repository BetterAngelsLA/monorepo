/**
 * Run with: node --test tools/scripts/cli-json.test.mjs
 * (the `tools-scripts:test` target globs `tools/scripts/*.test.mjs`).
 *
 * These pin the three shapes the EAS/nx/expo CLIs actually print around their
 * `--json` payload: notices before it, an nx summary after it, and ANSI styling.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseJsonOutput, updateGroups } from './cli-json.mjs';

describe('parseJsonOutput', () => {
  it('skips notices before an array payload', () => {
    const raw = `eas-cli is now available.
[{"id":"a"},{"id":"b"}]`;

    assert.deepEqual(parseJsonOutput(raw), [{ id: 'a' }, { id: 'b' }]);
  });

  it('tolerates an nx summary after the payload', () => {
    const raw = `[{"id":"a"}]

 NX   Successfully ran target build:list for project betterangels`;

    assert.deepEqual(parseJsonOutput(raw), [{ id: 'a' }]);
  });

  it('strips ANSI styling around the payload', () => {
    const raw = `\u001B[32m✔\u001B[0m listed builds\n\u001B[1m[{"id":"a"}]\u001B[0m\n`;

    assert.deepEqual(parseJsonOutput(raw), [{ id: 'a' }]);
  });

  it('skips noise that itself contains braces', () => {
    const raw = `◇ injected env (0) from .env // tip: ⌘ override existing { override: true }
{"dependencies":[],"upToDate":true}`;

    assert.deepEqual(parseJsonOutput(raw), {
      dependencies: [],
      upToDate: true,
    });
  });

  it('returns the object payload of a single build', () => {
    assert.deepEqual(parseJsonOutput('{"id":"a","status":"FINISHED"}'), {
      id: 'a',
      status: 'FINISHED',
    });
  });

  it('fails loudly when there is no JSON', () => {
    assert.throws(
      () => parseJsonOutput('no payload here'),
      /No JSON in output/,
    );
  });
});

describe('updateGroups', () => {
  it('unwraps the branch wrapper eas update:list prints', () => {
    // `{ name, id, currentPage: [...] }` — the wrapper, not the array.
    const payload = parseJsonOutput(
      '{"name":"b","id":"1","currentPage":[{"group":"g1"},{"group":"g2"}]}',
    );

    assert.deepEqual(updateGroups(payload), [{ group: 'g1' }, { group: 'g2' }]);
  });

  it('passes an array through, and tolerates nothing', () => {
    assert.deepEqual(updateGroups([{ group: 'g1' }]), [{ group: 'g1' }]);
    assert.deepEqual(updateGroups(undefined), []);
  });
});
