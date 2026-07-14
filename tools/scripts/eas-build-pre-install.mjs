/**
 * EAS pre-install hook — exact replica of @nx/expo:build's `copyPackageJsonAndLock`
 * for non-workspace setups.
 */
import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join, resolve } from 'path';

const [workspaceRoot, projectRoot] = process.argv.slice(2);
const appDir = resolve(workspaceRoot, projectRoot);

const rootPkg = JSON.parse(readFileSync(join(workspaceRoot, 'package.json'), 'utf-8'));
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