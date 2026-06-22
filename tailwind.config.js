const { shcNativeWindTheme } = require('./packages/shc-ui/src/nativewind-theme.cjs');

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/mobile-customer/**/*.{js,jsx,ts,tsx}',
    './apps/mobile-cook/**/*.{js,jsx,ts,tsx}',
    './packages/shc-ui/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: shcNativeWindTheme,
  },
  plugins: [],
};