module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      '@babel/plugin-transform-class-static-block',
      // Reanimated 4 bundles react-native-worklets; do not add worklets/plugin separately.
      'react-native-reanimated/plugin',
    ],
  };
};
