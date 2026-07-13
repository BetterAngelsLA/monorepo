/**
 * ============================================================================
 * WHY THIS FILE EXISTS
 * ============================================================================
 *
 * In this Nx monorepo, Expo apps declare dependencies as "*" (managed by
 * @nx/expo:sync-deps). Yarn resolves "*" independently from the root's version
 * constraints, which can install different versions of native modules than the
 * rest of the workspace — causing duplicate native libraries fatal to Expo
 * builds (e.g. two copies of react-native-reanimated).
 *
 * The old @nx/expo:build executor handled this by running Nx's internal
 * createPackageJson before EAS build. In Nx 23.x, @nx/expo:build is deprecated
 * and replaced with a plain `eas build` command — the * resolution is gone.
 *
 * This script replaces that missing piece. It runs in CI before `eas build`
 * (where Nx and node_modules are available) and:
 *
 *   1. Calls Nx's createPackageJson — adds peerDependencies and correctly
 *      categorizes deps vs devDeps based on the project graph.
 *   2. Resolves remaining "*" versions to concrete versions from root
 *      package.json — closing the gap createPackageJson leaves for apps.
 *
 * The output is identical to what the old @nx/expo:build executor produced.
 * ============================================================================
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

// Step 2: Resolve "*" versions from root package.json.
// Nx's createPackageJson only looks at the project's own package.json for
// versions (which has "*"), so it leaves 92+ deps unresolved for apps.
// We fill that gap by checking root's concrete versions.
const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
const rootDeps = { ...rootPkg.devDependencies, ...rootPkg.dependencies };

const SECTIONS = ['dependencies', 'devDependencies', 'peerDependencies'];

/**
 * Pipeline: find every "*" dependency across all sections.
 *
 *   sections → filter to existing → for each, get entries →
 *   keep only * versions → shape as { section, name }
 *
 * This separates "finding what needs fixing" from "applying the fix."
 */
const starEntries = R.pipe(
  SECTIONS,                                       // ['dependencies', 'devDependencies', 'peerDependencies']
  R.filter(s => resolved[s]),                     // skip sections the app doesn't have
  R.flatMap(s =>                                   // for each section, flatten into a single list
    R.pipe(
      Object.entries(resolved[s]),                 //   [['react', '*'], ['expo', '*'], ...]
      R.filter(([, v]) => v === '*'),              //   keep only unresolved deps
      R.map(([name]) => ({ section: s, name }))    //   shape: { section: 'dependencies', name: 'react' }
    )
  )
);

// Split into deps we can resolve (in root) vs app-specific (not in root)
const [resolvable, unresolvable] = R.pipe(
  starEntries,
  R.partition(({ name }) => rootDeps[name] !== undefined)
);

// Apply root's concrete versions
for (const { section, name } of resolvable) {
  resolved[section][name] = rootDeps[name];
}

// Collect unresolved for the warning
const unresolved = unresolvable.map(({ section, name }) => `${section}.${name}`);

writeFileSync(pkgPath, JSON.stringify(resolved, null, 2) + '\n');

const totalDeps = Object.keys(resolved.dependencies || {}).length;
const totalPeer = Object.keys(resolved.peerDependencies || {}).length;
console.log(
  `Resolved ${totalDeps} deps, ${totalPeer} peerDeps` +
  (unresolved.length ? ` (${unresolved.length} still *, app-specific)` : '')
);
