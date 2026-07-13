/**
 * EAS pre-install hook: resolves "*" deps by replacing them with concrete
 * versions from the workspace root, preserving app-specific dependencies.
 *
 * Yarn resolves "*" independently from the root's version constraints,
 * which causes duplicate native modules (fatal for Expo builds).
 * This matches the old @nx/expo:build executor behavior.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const cwd = process.cwd();
const rootPkgPath = resolve(cwd, '../../package.json');
const appPkgPath = resolve(cwd, 'package.json');

const root = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
const app = JSON.parse(readFileSync(appPkgPath, 'utf-8'));

// Merge root's concrete versions only for "*" deps shared with root.
// App-specific deps (not in root) are kept as-is.
const rootDeps = { ...root.dependencies, ...root.devDependencies };

for (const depType of ['dependencies', 'devDependencies']) {
  if (!app[depType]) continue;
  for (const [name, version] of Object.entries(app[depType])) {
    if (version === '*' && rootDeps[name]) {
      app[depType][name] = rootDeps[name];
    }
  }
}

writeFileSync(appPkgPath, JSON.stringify(app, null, 2) + '\n');
console.log('Resolved * dependencies from workspace root');
