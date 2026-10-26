/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@dualfee/sdk': fileURLToPath(new URL('./packages/sdk/src/index.ts', import.meta.url)) },
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: { manualChunks: { polkadot: ['@polkadot/api'] } },
    },
  },
  test: {
    include: ['packages/sdk/test/**/*.test.ts'],
    environment: 'node',
  },
});
