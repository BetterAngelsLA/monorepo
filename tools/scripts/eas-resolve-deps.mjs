/**
 * Resolves "*" dependencies in the app's package.json using Nx's
 * createPackageJson, which correctly handles peerDependencies,
 * version resolution from the project graph, and section mapping.
 *
 * Run before `eas build` in CI (where Nx and node_modules are available).
 */
import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const project = process.argv[2] || 'betterangels';
const projectDir = resolve(process.cwd(), 'apps', project);
const pkgPath = resolve(projectDir, 'package.json');

console.log(`Resolving dependencies for ${project}...`);

// Bypass Nx package exports — these are internal APIs
const { createPackageJson } = require('../../node_modules/nx/dist/src/plugins/js/package-json/create-package-json.js');
const { readCachedProjectGraph } = require('../../node_modules/nx/dist/src/project-graph/project-graph.js');

const graph = readCachedProjectGraph();
const resolved = createPackageJson(project, graph, { isProduction: false });

writeFileSync(pkgPath, JSON.stringify(resolved, null, 2) + '\n');

console.log(
  `Resolved ${Object.keys(resolved.dependencies || {}).length} deps, ` +
  `${Object.keys(resolved.peerDependencies || {}).length} peerDeps`
);
