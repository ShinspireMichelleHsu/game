```typescript
import { test, expect } from '@playwright/test';

test('Test Playwright homepage and navigation', async ({ page }) => {
  // 1. 进入首页。
  await page.goto('https://playwright.dev/');

  // 2. 确认标题包含 "Playwright" 字样。
  await expect(page).toHaveTitle(/Playwright/);

  // 3. 点击 "Get started" 按钮。
  await page.getByRole('link', { name: 'Get started' }).click();

  // 4. 确认跳转后的网网址包含 "docs/intro"。
  await expect(page).toHaveURL(/.*docs\/intro/);
});
```