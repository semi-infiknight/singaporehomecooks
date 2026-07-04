/**
 * Idempotent Fusebox stub — duplicate react-native copies in pnpm monorepo would
 * otherwise throw when setUpFuseboxReactDevToolsDispatcher runs twice.
 */
const KEY = '__FUSEBOX_REACT_DEVTOOLS_DISPATCHER__';

class FuseboxReactDevToolsDispatcher {
  static BINDING_NAME = '__CHROME_DEVTOOLS_FRONTEND_BINDING__';
  static onDomainInitialization = {
    addEventListener() {},
    removeEventListener() {},
    emit() {},
  };

  static initializeDomain(domainName) {
    return {
      name: domainName,
      onMessage: {
        addEventListener() {},
        removeEventListener() {},
        emit() {},
      },
      sendMessage() {},
    };
  }

  static sendMessage() {}
}

if (global[KEY] == null) {
  try {
    Object.defineProperty(global, KEY, {
      value: FuseboxReactDevToolsDispatcher,
      configurable: false,
      enumerable: false,
      writable: false,
    });
  } catch {
    global[KEY] = FuseboxReactDevToolsDispatcher;
  }
}

module.exports = {};