/**
 * Resolves "*" dependency versions in the app's package.json
 * by copying them from the workspace root package.json,
 * and copies the root lockfile to the app directory.
 *
 * This runs as an EAS pre-install hook to ensure EAS can resolve
 * all dependencies without needing Yarn workspace support.
 */
import { copyFileSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const cwd = process.cwd();
const rootPkgPath = resolve(cwd, '../../package.json');
const rootLockPath = resolve(cwd, '../../yarn.lock');
const appPkgPath = resolve(cwd, 'package.json');
const appLockPath = resolve(cwd, 'yarn.lock');

const root = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
const app = JSON.parse(readFileSync(appPkgPath, 'utf-8'));

const merge = (source, dest) => {
  if (!source || !dest) return;
  for (const [key, value] of Object.entries(source)) {
    if (dest[key] === '*') {
      dest[key] = value;
    }
  }
};

merge(root.dependencies, app.dependencies);
merge(root.devDependencies, app.dependencies);
merge(root.dependencies, app.devDependencies);
merge(root.devDependencies, app.devDependencies);

writeFileSync(appPkgPath, JSON.stringify(app, null, 2) + '\n');
console.log('Resolved * dependencies from root package.json');

// Copy lockfile from root to app directory (same as old @nx/expo:build executor)
copyFileSync(rootLockPath, appLockPath);
console.log('Copied yarn.lock from workspace root');
