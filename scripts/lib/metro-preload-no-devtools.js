/**
 * NODE_OPTIONS=-r this file (SHC_HEADLESS_METRO=1) before Expo/Metro start.
 * Blocks /open-debugger + no-ops browser launcher. Works with pnpm nested paths.
 */
if (process.env.SHC_HEADLESS_METRO !== '1') {
  return;
}

const Module = require('module');
const _load = Module._load;

function isOpenDebuggerRequest(req) {
  const path = req.url?.split('?')[0] ?? '';
  const original = req.originalUrl?.split('?')[0] ?? '';
  return (
    path === '/open-debugger' ||
    original === '/open-debugger' ||
    // connect mounts /open-debugger → inner handler sees url as / or ?
    (req.method === 'POST' && (path === '/' || path === '' || path === '?'))
  );
}

const noopLauncher = {
  launchDebuggerAppWindow: async () => {},
  unstable_showFuseboxShell: async () => {},
};

function wrapDefaultExport(exported, wrapper) {
  if (!exported || typeof exported !== 'object') return;
  if (typeof exported.default === 'function') {
    exported.default = wrapper(exported.default);
  }
}

Module._load = function shcLoad(request, parent, isMain) {
  const exported = _load.apply(this, arguments);

  if (typeof request !== 'string') {
    return exported;
  }

  if (request.includes('DefaultBrowserLauncher')) {
    patchLauncherExport(exported);
  }

  if (request.includes('openDebuggerMiddleware')) {
    wrapDefaultExport(exported, (orig) => (...args) => {
      const inner = orig(...args);
      return async (req, res, next) => {
        if (isOpenDebuggerRequest(req)) {
          res.writeHead(204);
          res.end();
          return;
        }
        return inner(req, res, next);
      };
    });
  }

  if (request.includes('createDevMiddleware')) {
    wrapDefaultExport(exported, (orig) => (opts = {}) =>
      orig({
        ...opts,
        unstable_browserLauncher: noopLauncher,
      })
    );
  }

  if (request.includes('createDebugMiddleware')) {
    wrapDefaultExport(exported, (orig) => (...args) => {
      const result = orig(...args);
      const origDebug = result.debugMiddleware;
      result.debugMiddleware = (req, res, next) => {
        if (isOpenDebuggerRequest(req)) {
          res.writeHead(204);
          res.end();
          return;
        }
        return origDebug(req, res, next);
      };
      return result;
    });
  }

  if (request === 'open' && typeof exported === 'function') {
    return async (url, options) => {
      if (typeof url === 'string' && url.includes('debugger-frontend')) {
        return { cmd: 'noop' };
      }
      return exported(url, options);
    };
  }

  return exported;
};

function patchLauncherExport(exported) {
  if (!exported || typeof exported !== 'object') return;
  const launcher = exported.default ?? exported;
  if (!launcher || typeof launcher !== 'object') return;
  launcher.launchDebuggerAppWindow = noopLauncher.launchDebuggerAppWindow;
  launcher.unstable_showFuseboxShell = noopLauncher.unstable_showFuseboxShell;
}
