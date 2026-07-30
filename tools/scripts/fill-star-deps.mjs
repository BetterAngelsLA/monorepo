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
  const lockfilePath = resolve(workspaceRoot, 'yarn.lock');

  // Cache lockfile version lookups (parsed lazily)
  let _lockfileVersions = null;
  const getVersionFromLockfile = (name) => {
    if (_lockfileVersions === null) {
      _lockfileVersions = {};
      try {
        const text = readFileSync(lockfilePath, 'utf-8');
        // Yarn v4 lockfile format: "pkg@npm:range"\n  version: x.y.z
        const re = /"(@?[^@]+)@npm:[^"]*"[\s\S]*?version: (\S+)/g;
        let m;
        while ((m = re.exec(text)) !== null) {
          _lockfileVersions[m[1]] = m[2];
        }
      } catch { /* lockfile not available */ }
    }
    return _lockfileVersions[name];
  };

  let resolved = 0;
  let unresolved = [];

  // Resolve a single star dep — checks root deps, root devDeps, then lockfile
  const resolveOne = (name, target) => {
    const fromDeps = rootPkg.dependencies?.[name];
    const fromDev = rootPkg.devDependencies?.[name];
    const version = fromDeps ?? fromDev;
    if (version) {
      target[name] = version;
      const from = fromDeps ? 'deps' : 'devDeps';
      log(`  ✦ ${name}: * → ${version}  (root ${from})`);
      return 1;
    }
    // Fallback: read from lockfile (for transitive deps like expo-file-system)
    const lockVersion = getVersionFromLockfile(name, lockfilePath);
    if (lockVersion) {
      target[name] = lockVersion;
      log(`  ✦ ${name}: * → ${lockVersion}  (lockfile)`);
      return 1;
    }
    unresolved.push(name);
    log(`  ⚠ ${name}: * → unresolved (not in root or lockfile)`);
    return 0;
  };

  for (const [name, version] of Object.entries(appPkg.dependencies ?? {})) {
    if (version === '*') resolved += resolveOne(name, appPkg.dependencies);
  }
  for (const [name, version] of Object.entries(appPkg.devDependencies ?? {})) {
    if (version === '*') resolved += resolveOne(name, appPkg.devDependencies);
  }

  writeFileSync(resolve(appDir, 'package.json'), JSON.stringify(appPkg, null, 2) + '\n');

  const lockfileSrc = resolve(workspaceRoot, 'yarn.lock');
  const lockfileDst = resolve(appDir, 'yarn.lock');
  copyFileSync(lockfileSrc, lockfileDst);

  if (resolved > 0) {
    log(`  ✓ ${resolved} star dep(s) filled in ${appDir}/package.json`);
  }
  if (unresolved.length > 0) {
    log(`  ⚠ ${unresolved.length} star dep(s) could not be resolved: ${unresolved.join(', ')}`);
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
