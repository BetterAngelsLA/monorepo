/**
 * Fills star (*) dependencies in an Expo app's package.json by copying
 * resolved versions from the root package.json. This ensures that tools
 * like expo-doctor — which validate package.json directly — see real
 * version numbers instead of * placeholders.
 *
 * Usage: node tools/scripts/fill-star-deps.mjs <workspaceRoot> <appDir>
 *   e.g. node tools/scripts/fill-star-deps.mjs . apps/betterangels
 */
import { copyFileSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const [workspaceRoot, projectRoot] = process.argv.slice(2);
const appDir = resolve(workspaceRoot, projectRoot);

const rootPkg = JSON.parse(readFileSync(resolve(workspaceRoot, 'package.json'), 'utf-8'));
const appPkg = JSON.parse(readFileSync(resolve(appDir, 'package.json'), 'utf-8'));

// Resolve * deps from root dependencies
for (const [name, version] of Object.entries(appPkg.dependencies ?? {})) {
  if (version === '*' && rootPkg.dependencies?.[name]) {
    appPkg.dependencies[name] = rootPkg.dependencies[name];
    console.log(`  ✦ ${name}: * → ${rootPkg.dependencies[name]}`);
  }
}

// Resolve * devDeps from root devDependencies
for (const [name, version] of Object.entries(appPkg.devDependencies ?? {})) {
  if (version === '*' && rootPkg.devDependencies?.[name]) {
    appPkg.devDependencies[name] = rootPkg.devDependencies[name];
    console.log(`  ✦ ${name}: * → ${rootPkg.devDependencies[name]}`);
  }
}

writeFileSync(resolve(appDir, 'package.json'), JSON.stringify(appPkg, null, 2) + '\n');

// Copy lockfile so tools like expo-doctor can find it
const lockfileSrc = resolve(workspaceRoot, 'yarn.lock');
const lockfileDst = resolve(appDir, 'yarn.lock');
copyFileSync(lockfileSrc, lockfileDst);

console.log(`  ✓ Star deps filled in ${projectRoot}/package.json`);
console.log(`  ✓ Lockfile copied to ${projectRoot}/yarn.lock`);
