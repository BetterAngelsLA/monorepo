#!/usr/bin/env node
/**
 * Undo the workspace mutation `copy-lockfile` performs.
 *
 * Usage:
 *   node tools/scripts/restore-workspace.mjs [--project betterangels]
 *
 * `tools/scripts/eas-build-pre-install.mjs` rewrites the root `package.json`
 * (narrowing `workspaces` to the app) and both `package.json`s' EAS-only fields,
 * because EAS Build needs that shape in the uploaded archive. In CI it runs
 * before the EAS calls, and until now the workflow relied on the mobile step
 * being last so nothing downstream saw the mutated workspace. That is an
 * ordering invariant held only by a comment: one appended step that runs
 * `yarn install` (which `sync-deps` triggers) prunes every other project's
 * dependencies and the next web export dies with `ENOENT`.
 *
 * Running this in an `always()` step restores the tracked files, so a later
 * step no longer sees an EAS-shaped workspace. Note what it does *not* undo:
 * the pruned `node_modules` tree. `yarn install` after the mutation removes
 * other workspaces' packages, and restoring the manifests does not reinstall
 * them — that is why the mobile work still runs after the web export. The
 * difference is that this failure is now a missing-install reinstall rather
 * than silent corruption of tracked files.
 *
 * CI-only, like the script it reverses: outside CI that script is a no-op, so
 * there is nothing to restore, and `git checkout --` on a developer's tree
 * would discard real edits.
 */
import { execFileSync } from 'child_process';
import { resolve } from 'path';
import minimist from 'minimist';

const argv = minimist(process.argv.slice(2));
const project = argv.project ?? 'betterangels';

if (!process.env.CI) {
  console.log('[restore-workspace] Skipping — not in CI.');
  process.exit(0);
}

const paths = [
  'package.json',
  'yarn.lock',
  `apps/${project}/package.json`,
  `apps/${project}/yarn.lock`,
];

const git = (args) =>
  execFileSync('git', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

let dirty;
try {
  dirty = new Set(
    git(['status', '--porcelain', '--', ...paths])
      .split('\n')
      .map((line) => line.slice(3).trim())
      .filter(Boolean),
  );
} catch (error) {
  console.error(
    `[restore-workspace] git status failed: ${error?.stderr?.toString().trim() || error.message}`,
  );
  process.exit(1);
}

const changed = paths.filter((path) => dirty.has(path));
if (changed.length === 0) {
  console.log('[restore-workspace] Workspace is already clean.');
  process.exit(0);
}

git(['checkout', '--', ...changed]);
console.log(`[restore-workspace] Restored ${changed.join(', ')}.`);
