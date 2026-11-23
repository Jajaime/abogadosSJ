import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3104';

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.ts',
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: 'list',

  use: {
    ...devices['Desktop Chrome'],
    baseURL,
    trace: 'retain-on-failure',
  },

  webServer: {
    command:
      'npm run dev -- --hostname 127.0.0.1 --port 3104',
    url: `${baseURL}/auth/login`,
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
});
