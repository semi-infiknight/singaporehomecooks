/**
 * Dev-only: stop RN 0.81 Fusebox from opening DevTools (LogBox banner / native openDebugger).
 * Maestro taps the bottom tab bar; the "Open debugger to view warnings" toast overlaps it.
 */
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  try {
    const { LogBox, NativeModules } = require('react-native');
    LogBox.ignoreLogs([/Codegen didn't run/, /Open debugger to view warnings/]);

    const devSettings = NativeModules.DevSettings;
    if (devSettings && typeof devSettings.openDebugger === 'function') {
      devSettings.openDebugger = () => {};
    }
  } catch {
    /* ignore */
  }
}
