/**
 * AGENT: Cook Metro :8082 — separate cache from customer :8081. entry = expo-router/entry only.
 * AppDelegate rewrites :8081→:8082 for deep links. blueprint/10-mobile/10-mobile.md
 */
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

function resolvePackageRoot(name) {
  for (const modulesDir of [appModules, rootModules]) {
    try {
      return path.dirname(require.resolve(`${name}/package.json`, { paths: [modulesDir] }));
    } catch {
      /* try next */
    }
  }
  return null;
}

const pinnedModules = [
  'react',
  'react-dom',
  'react-native',
  '@expo/vector-icons',
  'expo',
  'expo-modules-core',
  '@expo/metro-runtime',
  '@tanstack/react-query',
  'expo-asset',
  '@react-native/assets-registry',
  'react-native-reanimated',
  'react-native-gesture-handler',
  'react-native-safe-area-context',
  'react-native-screens',
  'react-native-svg',
  'react-native-maps',
  'react-native-worklets',
  'react-native-css-interop',
  'nativewind',
  'moti',
  '@shopify/react-native-skia',
  // Single instance — dual @shc/ui breaks TrayContext (useSHCTray outside provider)
  '@shc/ui',
  '@shc/utils',
  '@shc/types',
  '@shc/api-client',
];
const pinnedPaths = Object.fromEntries(
  pinnedModules.map((name) => {
    const resolved = resolvePackageRoot(name);
    if (resolved) return [name, resolved];
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

const cacheDir = path.join(projectRoot, '.metro-cache');
fs.mkdirSync(cacheDir, { recursive: true });
config.cacheStores = [new FileStore({ root: cacheDir })];
config.cacheVersion = 'mobile-customer-v36-bottom-pad-fix';

function isExpoRouterEntryRequest(name) {
  if (typeof name !== 'string') return false;
  if (name === 'expo-router/entry') return true;
  return /(?:^|\/)expo-router\/entry(?:\.js)?$/.test(name) || /expo-router@[^/]+\/node_modules\/expo-router\/entry(?:\.js)?$/.test(name);
}

const expoRouterEntry = (() => {
  try {
    return require.resolve('expo-router/entry', { paths: [projectRoot] });
  } catch {
    return null;
  }
})();

function resolveFromApp(name) {
  try {
    const filePath = require.resolve(name, { paths: [appModules] });
    return { type: 'sourceFile', filePath };
  } catch {
    return null;
  }
}

function matchesPinnedModule(name) {
  if (typeof name !== 'string') return false;
  return pinnedModules.some((mod) => name === mod || name.startsWith(`${mod}/`));
}

const fuseboxShim = path.join(projectRoot, 'fusebox-shim.js');

const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, realModuleName, platform, moduleName) => {
  if (
    typeof realModuleName === 'string' &&
    realModuleName.includes('setUpFuseboxReactDevToolsDispatcher')
  ) {
    return { type: 'sourceFile', filePath: fuseboxShim };
  }
  if (matchesPinnedModule(realModuleName)) {
    const resolved = resolveFromApp(realModuleName);
    if (resolved) return resolved;
  }
  if (isExpoRouterEntryRequest(realModuleName) && expoRouterEntry) {
    return { type: 'sourceFile', filePath: expoRouterEntry };
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
