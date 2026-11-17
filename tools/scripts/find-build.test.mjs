/**
 * `find-build` talks to `eas` directly and asks for one build for the fingerprint.
 *
 * A fake `eas` lets us exercise the lookup without the network:
 * - the newest build is reused when it is finished or in progress;
 * - a dead newest build fails loudly so the caller does not queue a duplicate;
 * - no build queues one.
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
    it('asks for one build by fingerprint', () => {
      const output = withFakeEas(`
        const args = process.argv.slice(2);
        const limit = args[args.indexOf('--limit') + 1];
        if (!args.includes('--fingerprint-hash') || limit !== '1') {
          process.exit(7);
        }
        process.stdout.write(JSON.stringify([{ id: 'latest', status: 'FINISHED' }]));
      `);

      assert.equal(JSON.parse(output).id, 'latest');
    });

    it('reuses an in-progress build instead of queueing another', () => {
      const output = withFakeEas(
        `process.stdout.write(JSON.stringify([{ id: 'running', status: 'IN_PROGRESS' }]));`,
      );

      assert.equal(JSON.parse(output).id, 'running');
    });

    it('fails when the newest build is dead', () => {
      assert.throws(
        () =>
          withFakeEas(
            `process.stdout.write(JSON.stringify([{ id: 'dead', status: 'CANCELED' }]));`,
          ),
        (error) => {
          assert.equal(error.status, 1);
          assert.match(String(error.stderr), /is CANCELED/);
          return true;
        },
      );
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
