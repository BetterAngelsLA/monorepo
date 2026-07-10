/**
 * EAS pre-install hook: resolves tsconfig extends for Metro compatibility.
 *
 * Workspace deps ("*") are resolved natively by Yarn workspaces.
 * The lockfile is managed by Yarn at the workspace root.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const stripComments = (json) => json.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (m, g) => g ? '' : m);

const cwd = process.cwd();

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
