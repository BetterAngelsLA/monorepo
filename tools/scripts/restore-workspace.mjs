#!/usr/bin/env node
/**
 * Undo the workspace mutation `copy-lockfile` performs for EAS Build.
 *
 *   node tools/scripts/restore-workspace.mjs [--project betterangels]
 *
 * `eas-build-pre-install.mjs` rewrites the root and app `package.json` so the
 * uploaded archive installs. Restoring the tracked files afterwards keeps that
 * shape from leaking into later steps. It does not un-prune `node_modules`, so
 * anything that installs still has to run after the EAS build.
 */
import { execFileSync } from 'child_process';
import { resolve } from 'path';
import minimist from 'minimist';

import { workspaceMutations } from './workspace-mutation.mjs';

const argv = minimist(process.argv.slice(2));
const project = argv.project ?? 'betterangels';

if (!process.env.CI) {
  console.log('[restore-workspace] Skipping — not in CI.');
  process.exit(0);
}

const paths = workspaceMutations(project);

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
