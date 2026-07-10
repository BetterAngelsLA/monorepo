/**
 * Resolves "*" dependency versions in the app's package.json
 * by copying them from the workspace root package.json,
 * copies the root lockfile to the app directory,
 * and resolves tsconfig extends for Metro compatibility.
 *
 * This runs as an EAS pre-install hook to ensure EAS can resolve
 * all dependencies without needing Yarn workspace support.
 */
import { copyFileSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

// Strip JSON comments for tsconfig parsing (no deps available at pre-install time)
const stripComments = (json) => json.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? '' : m);

const cwd = process.cwd();
const rootPkgPath = resolve(cwd, '../../package.json');
const rootLockPath = resolve(cwd, '../../yarn.lock');
const appPkgPath = resolve(cwd, 'package.json');
const appLockPath = resolve(cwd, 'yarn.lock');

const root = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
const app = JSON.parse(readFileSync(appPkgPath, 'utf-8'));

const merge = (source, dest) => {
  if (!source) return;
  if (!dest) dest = {};
  for (const [key, value] of Object.entries(source)) {
    if (!dest[key] || dest[key] === '*') {
      dest[key] = value;
    }
  }
  return dest;
};

app.dependencies = merge(root.dependencies, app.dependencies) || {};
app.dependencies = merge(root.devDependencies, app.dependencies) || {};
app.devDependencies = merge(root.dependencies, app.devDependencies) || {};
app.devDependencies = merge(root.devDependencies, app.devDependencies) || {};

writeFileSync(appPkgPath, JSON.stringify(app, null, 2) + '\n');
console.log('Resolved * dependencies from root package.json');

// Copy lockfile from root to app directory (same as old @nx/expo:build executor)
copyFileSync(rootLockPath, appLockPath);
console.log('Copied yarn.lock from workspace root');

// Resolve tsconfig extends to inline the base config.
// Metro's file map can't resolve extends that cross project boundaries on EAS.
try {
  const appTsconfigPath = resolve(cwd, 'tsconfig.json');
  const appTsconfig = JSON.parse(stripComments(readFileSync(appTsconfigPath, 'utf-8')));

  if (appTsconfig.extends) {
    const extendsPath = resolve(cwd, appTsconfig.extends);
    const baseConfig = JSON.parse(stripComments(readFileSync(extendsPath, 'utf-8')));

    // Merge paths from base into app tsconfig, adjusting to be relative to app dir
    if (baseConfig.compilerOptions?.paths) {
      appTsconfig.compilerOptions = appTsconfig.compilerOptions || {};
      const adjustedPaths = {};
      for (const [alias, paths] of Object.entries(baseConfig.compilerOptions.paths)) {
        // Adjust paths from workspace-root-relative to app-directory-relative
        adjustedPaths[alias] = paths.map(p => p.startsWith('./') ? '../../' + p.slice(2) : p);
      }
      appTsconfig.compilerOptions.paths = {
        ...adjustedPaths,
        ...appTsconfig.compilerOptions.paths,
      };
    }

    // Remove extends so Metro doesn't need to resolve cross-project paths
    delete appTsconfig.extends;
    writeFileSync(appTsconfigPath, JSON.stringify(appTsconfig, null, 2) + '\n');
    console.log('Resolved tsconfig extends for EAS build');
  }
} catch (e) {
  console.log('Skipped tsconfig resolution:', e.message);
}
