/**
 * Fills star (*) dependencies in an Expo app's package.json by copying
 * resolved versions from the root package.json. This ensures that tools
 * like expo-doctor — which validate package.json directly — see real
 * version numbers instead of * placeholders.
 *
 * Usage: node tools/scripts/fill-star-deps.mjs <workspaceRoot> <appDir>
 *   e.g. node tools/scripts/fill-star-deps.mjs . apps/betterangels
 *
 * Also exports `resolveStarDeps()` for use by other scripts (e.g. EAS
 * pre-install hook).
 */
import { copyFileSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

/**
 * Resolves all `*` dependency versions in the app's package.json to
 * their actual versions from the root package.json. Copies the root
 * lockfile into the app directory.
 *
 * @param {string} workspaceRoot - absolute path to the monorepo root
 * @param {string} appDir - absolute path to the Expo app directory
 * @param {{ silent?: boolean }} [options]
 * @returns {{ appPkg: object, rootPkg: object }} the parsed package.json objects
 */
export function resolveStarDeps(workspaceRoot, appDir, { silent = false } = {}) {
  const log = silent ? () => {} : console.log;

  const rootPkg = JSON.parse(readFileSync(resolve(workspaceRoot, 'package.json'), 'utf-8'));
  const appPkg = JSON.parse(readFileSync(resolve(appDir, 'package.json'), 'utf-8'));

  let resolved = 0;

  for (const [name, version] of Object.entries(appPkg.dependencies ?? {})) {
    if (version === '*' && rootPkg.dependencies?.[name]) {
      appPkg.dependencies[name] = rootPkg.dependencies[name];
      log(`  ✦ ${name}: * → ${rootPkg.dependencies[name]}`);
      resolved++;
    }
  }

  for (const [name, version] of Object.entries(appPkg.devDependencies ?? {})) {
    if (version === '*' && rootPkg.devDependencies?.[name]) {
      appPkg.devDependencies[name] = rootPkg.devDependencies[name];
      log(`  ✦ ${name}: * → ${rootPkg.devDependencies[name]}`);
      resolved++;
    }
  }

  writeFileSync(resolve(appDir, 'package.json'), JSON.stringify(appPkg, null, 2) + '\n');

  const lockfileSrc = resolve(workspaceRoot, 'yarn.lock');
  const lockfileDst = resolve(appDir, 'yarn.lock');
  copyFileSync(lockfileSrc, lockfileDst);

  if (resolved > 0) {
    log(`  ✓ ${resolved} star dep(s) filled in ${appDir}/package.json`);
  }
  log(`  ✓ Lockfile copied to ${appDir}/yarn.lock`);

  return { appPkg, rootPkg };
}

// CLI entry point — runs when invoked directly (not imported)
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [workspaceRoot, projectRoot] = process.argv.slice(2);
  const appDir = resolve(workspaceRoot, projectRoot);
  resolveStarDeps(workspaceRoot, appDir);
}
