import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './e2e', workers: 1, timeout: 60000,
  outputDir: './e2e-results/artifacts',
  reporter: [['list'], ['json', { outputFile: './e2e-results/report.json' }]],
  use: { browserName: 'chromium', baseURL: 'http://127.0.0.1:5173', viewport: { width: 1440, height: 1100 } },
  webServer: { command: 'python3 ../scripts/demo-local.py --no-open', url: 'http://127.0.0.1:5173/demo/index.html', reuseExistingServer: false, timeout: 60000 },
})
