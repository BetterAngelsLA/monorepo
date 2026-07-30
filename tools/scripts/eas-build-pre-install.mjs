/**
 * EAS pre-install hook — resolves star (*) deps for EAS Build.
 *
 * EAS Build runs `yarn install` from the app directory and doesn't
 * understand Yarn workspaces, so `*` placeholders must be resolved to
 * real versions. Uses the same canonical star-resolution logic as
 * expo-doctor (fill-star-deps.mjs), plus copies EAS-required fields
 * (packageManager, resolutions/overrides) and configures the root
 * package.json as a single-package workspace.
 *
 * No-op outside CI — `sync-deps` handles local resolution.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { resolveStarDeps } from './fill-star-deps.mjs';

if (!process.env.CI) {
  console.log('[eas-build-pre-install] Skipping — not in CI.');
  process.exit(0);
}

const [workspaceRoot, projectRoot] = process.argv.slice(2);
const appDir = resolve(workspaceRoot, projectRoot);
const rootPkg = JSON.parse(readFileSync(join(workspaceRoot, 'package.json'), 'utf-8'));

// Resolve * deps using the canonical implementation (shared with expo-doctor)
const { unresolved } = resolveStarDeps(workspaceRoot, appDir);

if (unresolved.length > 0) {
  console.error(`[eas-build-pre-install] ERROR: ${unresolved.length} star dep(s) could not be resolved: ${unresolved.join(', ')}`);
  console.error('Add them to root package.json dependencies or devDependencies.');
  process.exit(1);
}

// EAS-specific extras: copy packageManager and resolutions so EAS Build
// uses the same package manager version and dependency resolution as local
const appPkg = JSON.parse(readFileSync(join(appDir, 'package.json'), 'utf-8'));

if (rootPkg.packageManager) appPkg.packageManager = rootPkg.packageManager;
if (rootPkg.overrides) appPkg.overrides = rootPkg.overrides;
else if (rootPkg.resolutions) appPkg.resolutions = rootPkg.resolutions;

writeFileSync(join(appDir, 'package.json'), JSON.stringify(appPkg, null, 2) + '\n');

// Tell EAS this is a Yarn workspace so it runs install from root
rootPkg.workspaces = [projectRoot];
writeFileSync(join(workspaceRoot, 'package.json'), JSON.stringify(rootPkg, null, 2) + '\n');

console.log('[eas-build-pre-install] Star deps resolved + EAS config applied.');
