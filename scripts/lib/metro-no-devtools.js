/**
 * Metro config helpers — inject devtools-guard before app entry + mark headless mode.
 */
const path = require('path');

function withNoDevToolsLaunch(config, projectRoot) {
  if (process.env.SHC_HEADLESS_METRO !== '1') {
    return config;
  }

  const guardPath = path.join(projectRoot, 'lib/devtools-guard.js');
  const prevRunBefore =
    config.serializer?.getModulesRunBeforeMainModulePath ?? (() => []);

  config.serializer = {
    ...config.serializer,
    getModulesRunBeforeMainModulePath: () => {
      const before = prevRunBefore();
      if (before.includes(guardPath)) return before;
      return [...before, guardPath];
    },
  };

  return config;
}

module.exports = { withNoDevToolsLaunch };
