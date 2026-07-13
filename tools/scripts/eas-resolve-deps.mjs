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
const R = require('remeda');
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

// Step 2: Resolve "*" versions from root, collect unresolved
// (Nx's createPackageJson only checks project's own package.json for apps)
const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
const rootDeps = { ...rootPkg.devDependencies, ...rootPkg.dependencies };

const SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies'];

const starEntries = R.pipe(
  SECTIONS,
  R.filter(s => resolved[s]),
  R.flatMap(s =>
    R.pipe(
      Object.entries(resolved[s]),
      R.filter(([, v]) => v === '*'),
      R.map(([name]) => ({ section: s, name }))
    )
  )
);

const unresolved = [];
for (const { section, name } of starEntries) {
  if (rootDeps[name]) {
    resolved[section][name] = rootDeps[name];
  } else {
    unresolved.push(`${section}.${name}`);
  }
}

writeFileSync(pkgPath, JSON.stringify(resolved, null, 2) + '\n');

const totalDeps = Object.keys(resolved.dependencies || {}).length;
const totalPeer = Object.keys(resolved.peerDependencies || {}).length;
console.log(
  `Resolved ${totalDeps} deps, ${totalPeer} peerDeps` +
  (unresolved.length ? ` (${unresolved.length} still *, app-specific)` : '')
);
