/**
 * EAS pre-install hook: replaces "*" dependency versions with concrete
 * versions from the workspace root package.json.
 *
 * Yarn resolves "*" independently from root's version constraints
 * (e.g. root says "react-native-reanimated": "4.3.1" but lockfile
 * resolves "*" to 4.5.1). This causes duplicate native modules
 * which are fatal for Expo builds.
 */
const { readFileSync, writeFileSync } = require('fs');
const { resolve } = require('path');

const root = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'));
const app = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'));
const rootDeps = { ...root.devDependencies, ...root.dependencies };

for (const section of ['dependencies', 'devDependencies']) {
  if (!app[section]) continue;
  for (const [name, version] of Object.entries(app[section])) {
    if (version === '*' && rootDeps[name]) {
      app[section][name] = rootDeps[name];
    }
  }
}

writeFileSync(resolve(__dirname, 'package.json'), JSON.stringify(app, null, 2) + '\n');
