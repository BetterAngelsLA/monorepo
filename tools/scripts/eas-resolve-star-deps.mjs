/**
 * EAS pre-install hook: resolves "*" deps by replacing app dependencies
 * with concrete versions from the workspace root, then resolves tsconfig
 * extends for Metro compatibility.
 *
 * Yarn resolves "*" independently from the root's version constraints,
 * which causes duplicate native modules (fatal for Expo builds).
 * This matches the old @nx/expo:build executor behavior.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const stripComments = (json) => json.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? '' : m);

const cwd = process.cwd();
const rootPkgPath = resolve(cwd, '../../package.json');
const appPkgPath = resolve(cwd, 'package.json');

// Replace app deps/devDeps with root versions (no "*" entries remain)
const root = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
const app = JSON.parse(readFileSync(appPkgPath, 'utf-8'));

app.dependencies = root.dependencies || {};
app.devDependencies = root.devDependencies || {};

writeFileSync(appPkgPath, JSON.stringify(app, null, 2) + '\n');
console.log('Resolved * dependencies from workspace root');

// Resolve tsconfig extends to inline the base config
try {
  const appTsconfigPath = resolve(cwd, 'tsconfig.json');
  const appTsconfig = JSON.parse(stripComments(readFileSync(appTsconfigPath, 'utf-8')));

  if (appTsconfig.extends) {
    const extendsPath = resolve(cwd, appTsconfig.extends);
    const baseConfig = JSON.parse(stripComments(readFileSync(extendsPath, 'utf-8')));

    if (baseConfig.compilerOptions?.paths) {
      appTsconfig.compilerOptions = appTsconfig.compilerOptions || {};
      const adjustedPaths = {};
      for (const [alias, paths] of Object.entries(baseConfig.compilerOptions.paths)) {
        adjustedPaths[alias] = paths.map(p => p.startsWith('./') ? '../../' + p.slice(2) : p);
      }
      appTsconfig.compilerOptions.paths = { ...adjustedPaths, ...appTsconfig.compilerOptions.paths };
    }

    delete appTsconfig.extends;
    writeFileSync(appTsconfigPath, JSON.stringify(appTsconfig, null, 2) + '\n');
    console.log('Resolved tsconfig extends for EAS build');
  }
} catch (e) {
  console.log('Skipped tsconfig resolution:', e.message);
}
