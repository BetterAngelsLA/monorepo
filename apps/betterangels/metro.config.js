const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(__dirname, {
  watchFolders: [workspaceRoot],
});

// Map workspace package names to their source directories for Metro resolution
function getWorkspacePackages() {
  const packages = {};
  const libsDir = path.join(workspaceRoot, 'libs');
  if (fs.existsSync(libsDir)) {
    for (const scope of fs.readdirSync(libsDir)) {
      const scopeDir = path.join(libsDir, scope);
      if (!fs.statSync(scopeDir).isDirectory()) continue;
      for (const pkg of fs.readdirSync(scopeDir)) {
        const pkgDir = path.join(scopeDir, pkg);
        const pkgJson = path.join(pkgDir, 'package.json');
        if (fs.existsSync(pkgJson)) {
          const name = JSON.parse(fs.readFileSync(pkgJson, 'utf-8')).name;
          if (name) packages[name] = pkgDir;
        }
      }
    }
  }
  return packages;
}

// Remove console.logs in production
config.transformer.minifierConfig.compress.drop_console = true;

const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...resolver,
  extraNodeModules: getWorkspacePackages(),
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
};

module.exports = config;
