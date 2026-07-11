/**
 * EAS pre-install hook: resolves "*" deps by replacing app dependencies
 * with concrete versions from the workspace root.
 *
 * Yarn resolves "*" independently from the root's version constraints,
 * which causes duplicate native modules (fatal for Expo builds).
 * This matches the old @nx/expo:build executor behavior.
 *
 * Tsconfig extends resolution is no longer needed — Expo SDK 52+
 * auto-configures Metro for monorepos, including watchFolders and
 * module resolution across project boundaries.
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const cwd = process.cwd();
const rootPkgPath = resolve(cwd, '../../package.json');
const appPkgPath = resolve(cwd, 'package.json');

const root = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
const app = JSON.parse(readFileSync(appPkgPath, 'utf-8'));

app.dependencies = root.dependencies || {};
app.devDependencies = root.devDependencies || {};

writeFileSync(appPkgPath, JSON.stringify(app, null, 2) + '\n');
console.log('Resolved * dependencies from workspace root');
