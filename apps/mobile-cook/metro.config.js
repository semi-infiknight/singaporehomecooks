const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { FileStore } = require('metro-cache');
const path = require('path');
const fs = require('fs');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');
const appModules = path.resolve(projectRoot, 'node_modules');
const rootModules = path.resolve(monorepoRoot, 'node_modules');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);

config.watchFolders = [monorepoRoot];
config.resolver.nodeModulesPaths = [appModules, rootModules];

// Prefer each app's node_modules to prevent duplicate React / react-native-svg native registrations.
const pinnedModules = ['react', 'react-dom', '@tanstack/react-query'];
const pinnedPaths = Object.fromEntries(
  pinnedModules.map((name) => {
    const local = path.join(appModules, name);
    return [name, fs.existsSync(local) ? local : path.join(rootModules, name)];
  })
);

config.resolver.extraNodeModules = new Proxy(
  pinnedPaths,
  {
    get: (target, name) => {
      if (name in target) return target[name];
      const local = path.join(appModules, String(name));
      if (fs.existsSync(local)) return local;
      return path.join(rootModules, String(name));
    },
  }
);

config.server.unstable_serverRoot = projectRoot;

// Isolate from customer Metro (default cache is shared under os.tmpdir()/metro-cache).
const cacheDir = path.join(projectRoot, '.metro-cache');
fs.mkdirSync(cacheDir, { recursive: true });
config.cacheStores = [new FileStore({ root: cacheDir })];
config.cacheVersion = 'mobile-cook';

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, realModuleName, platform, moduleName) => {
  if (
    typeof realModuleName === 'string' &&
    (realModuleName.includes('expo-router/entry') || realModuleName.includes('expo-router@'))
  ) {
    return context.resolveRequest(context, 'expo-router/entry', platform, moduleName);
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, realModuleName, platform, moduleName);
  }
  return context.resolveRequest(context, realModuleName, platform, moduleName);
};

module.exports = withNativeWind(config, {
  input: './global.css',
  configPath: path.resolve(monorepoRoot, 'tailwind.config.js'),
});