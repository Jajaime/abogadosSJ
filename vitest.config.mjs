import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vitest/config';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'server-only': path.resolve(
        __dirname,
        'tests/stubs/server-only.ts'
      ),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    restoreMocks: true,
    clearMocks: true,
  },
});
