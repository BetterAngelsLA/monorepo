/**
 * `find-build` talks to `eas` directly and must read the whole build list.
 *
 * A fake `eas` lets us exercise the transport without the network. The large
 * case is the regression: the old nx executor returned only the first 64 KiB
 * chunk, so a list of this size did not parse as an array.
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'node:test';

const SCRIPT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'find-build.mjs',
);
const BASE = [
  '--project',
  'betterangels',
  '--platform',
  'ios',
  '--profile',
  'preview',
  '--runtime',
  'abc',
  '--json',
];

function withFakeEas(source, args = []) {
  const dir = mkdtempSync(path.join(tmpdir(), 'find-build-'));
  const eas = path.join(dir, 'eas');
  writeFileSync(eas, `#!/usr/bin/env node\n${source}\n`);
  chmodSync(eas, 0o755);
  try {
    return execFileSync(process.execPath, [SCRIPT, ...BASE, ...args], {
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: [dir, path.dirname(process.execPath), process.env.PATH]
          .filter(Boolean)
          .join(path.delimiter),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe(
  'find-build',
  { skip: process.platform === 'win32' && 'requires a POSIX eas shim' },
  () => {
    it('reads a build list larger than the old 64 KiB chunk', () => {
      // 40 builds of ~2 KB make the list larger than 64 KiB, while the one
      // build find-build prints stays small (process.exit can truncate a large
      // stdout write, which is a separate concern).
      const builds = Array.from({ length: 40 }, (_, i) => ({
        id: `b${i}`,
        status: i === 39 ? 'FINISHED' : 'CANCELED',
        message: 'x'.repeat(2_000),
      }));
      const output = withFakeEas(
        `process.stdout.write(JSON.stringify(${JSON.stringify(builds)}));`,
      );

      // Only the last entry is usable, so a truncated list cannot pass.
      assert.equal(JSON.parse(output).id, 'b39');
    });

    it('reports no build for an empty list', () => {
      const output = withFakeEas(`process.stdout.write('[]');`);

      assert.deepEqual(JSON.parse(output), { id: null });
    });

    it('fails loudly when the payload is not an array', () => {
      assert.throws(
        () => withFakeEas(`process.stdout.write('{}');`, ['--attempts', '1']),
        (error) => {
          assert.equal(error.status, 1);
          assert.match(String(error.stderr), /did not return an array/);
          return true;
        },
      );
    });

    it('honours --force without asking eas', () => {
      const output = withFakeEas(`process.exit(99);`, ['--force']);

      assert.deepEqual(JSON.parse(output), { id: null });
    });
  },
);
