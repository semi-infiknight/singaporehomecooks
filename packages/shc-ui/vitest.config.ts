import path from 'node:path';
import { createRequire } from 'node:module';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const root = path.resolve(__dirname);
const req = createRequire(import.meta.url);
const reactDir = path.dirname(req.resolve('react/package.json'));
const reactDomDir = path.dirname(req.resolve('react-dom/package.json'));
const mobileOrderPage = path.resolve(root, '../../apps/mobile-customer/app/(customer)/orders/[id].tsx');
const webOrderPage = path.resolve(root, '../../apps/web/app/orders/[id]/page.tsx');

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom', '@tanstack/react-query'],
    alias: {
      react: reactDir,
      'react-dom': reactDomDir,
      'react-native': path.resolve(root, 'src/test-shims/react-native.ts'),
      '@expo/vector-icons': path.resolve(root, 'src/test-shims/expo-vector-icons.ts'),
      'expo-router': path.resolve(root, 'src/test-shims/expo-router.ts'),
      'react-native-safe-area-context': path.resolve(root, 'src/test-shims/safe-area-context.tsx'),
      'next/navigation': path.resolve(root, 'src/test-shims/next-navigation.ts'),
      'next/link': path.resolve(root, 'src/test-shims/next-link.tsx'),
      'next/image': path.resolve(root, 'src/test-shims/next-image.tsx'),
      'lucide-react': path.resolve(root, 'src/test-shims/lucide-react.tsx'),
      '@shc-mobile-order-page': mobileOrderPage,
      '@shc-web-order-page': webOrderPage,
    },
  },
  server: {
    fs: { allow: ['..', '../..', '../../..'] },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
});