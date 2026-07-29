/**
 * EAS pre-install hook — CI-only replica of @nx/expo:build's `copyPackageJsonAndLock`.
 * Resolves * deps from root, copies lockfile, configures Yarn workspace.
 * No-op outside CI — sync-deps handles local resolution.
 */
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, resolve } from 'path';

if (!process.env.CI) {
  console.log('[eas-build-pre-install] Skipping — not in CI.');
  process.exit(0);
}

const [workspaceRoot, projectRoot] = process.argv.slice(2);
const appDir = resolve(workspaceRoot, projectRoot);

const rootPkg = JSON.parse(readFileSync(join(workspaceRoot, 'package.json'), 'utf-8'));

// If workspaces are already enabled, Yarn resolves * deps natively — skip
if (rootPkg.workspaces && rootPkg.workspaces.length > 0) {
  console.log('[eas-build-pre-install] Workspaces already configured, skipping.');
  process.exit(0);
}

const appPkg = JSON.parse(readFileSync(join(appDir, 'package.json'), 'utf-8'));

appPkg.dependencies = rootPkg.dependencies;
appPkg.devDependencies = rootPkg.devDependencies;
if (rootPkg.packageManager) appPkg.packageManager = rootPkg.packageManager;
if (rootPkg.overrides) appPkg.overrides = rootPkg.overrides;
else if (rootPkg.resolutions) appPkg.resolutions = rootPkg.resolutions;

// Tell EAS this is a Yarn workspace so it runs install from root
rootPkg.workspaces = [projectRoot];

writeFileSync(join(appDir, 'package.json'), JSON.stringify(appPkg, null, 2) + '\n');
writeFileSync(join(workspaceRoot, 'package.json'), JSON.stringify(rootPkg, null, 2) + '\n');
copyFileSync(join(workspaceRoot, 'yarn.lock'), join(appDir, 'yarn.lock'));
console.log('[eas-build-pre-install] Copied root deps + lockfile.');
