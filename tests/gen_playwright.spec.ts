```typescript
import { test, expect } from '@playwright/test';

test('Navigate to Playwright documentation from homepage', async ({ page }) => {
  // 1. 進入首頁。
  await page.goto('https://playwright.dev/');

  // 2. 確認標題包含 "Playwright" 字樣。
  await expect(page).toHaveTitle(/Playwright/);

  // 3. 點擊 "Get started" 按鈕。
  await page.getByRole('link', { name: 'Get started' }).click();

  // 4. 確認跳轉後的網址包含 "docs/intro"。
  await expect(page).toHaveURL(/docs\/intro/);
});
```