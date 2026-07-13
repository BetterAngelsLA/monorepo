/**
 * Resolves package.json for EAS builds by combining:
 * 1. Nx's createPackageJson — correct peerDependencies & categorization
 * 2. Root-based * resolution — replaces "*" with concrete versions from root
 *
 * Run before `eas build` in CI (where Nx and node_modules are available).
 */
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(__dirname, '../..');

const project = process.argv[2] || 'betterangels';
const pkgPath = resolve(workspaceRoot, 'apps', project, 'package.json');
const rootPkgPath = resolve(workspaceRoot, 'package.json');

console.log(`Resolving dependencies for ${project}...`);

// Step 1: Use Nx to get correct deps + peerDeps + categorization
const { createPackageJson } = require(
  resolve(workspaceRoot, 'node_modules/nx/dist/src/plugins/js/package-json/create-package-json.js')
);
const { readCachedProjectGraph } = require(
  resolve(workspaceRoot, 'node_modules/nx/dist/src/project-graph/project-graph.js')
);

const graph = readCachedProjectGraph();
const resolved = createPackageJson(project, graph, { isProduction: false });

// Step 2: Resolve remaining "*" versions from root package.json
// (Nx's createPackageJson only checks project's own package.json for apps)
const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
const rootDeps = { ...rootPkg.dependencies, ...rootPkg.devDependencies };

for (const section of ['dependencies', 'devDependencies', 'peerDependencies']) {
  if (!resolved[section]) continue;
  for (const [name, version] of Object.entries(resolved[section])) {
    if (version === '*' && rootDeps[name]) {
      resolved[section][name] = rootDeps[name];
    }
  }
}

writeFileSync(pkgPath, JSON.stringify(resolved, null, 2) + '\n');

const starLeft = Object.values(resolved.dependencies || {}).filter(v => v === '*').length;
console.log(
  `Resolved ${Object.keys(resolved.dependencies || {}).length} deps` +
  (starLeft ? ` (${starLeft} still *, app-specific)` : '') +
  `, ${Object.keys(resolved.peerDependencies || {}).length} peerDeps`
);
