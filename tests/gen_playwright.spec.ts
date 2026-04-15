```typescript
// tests/member.spec.ts
import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker'; // 引入 faker-js 用於生成測試資料

// 設定應用程式的基礎 URL。請將此替換為您的實際應用程式 URL。
test.use({
  baseURL: 'http://localhost:3000', 
});

// 輔助函數：生成唯一的電子郵件地址
const generateUniqueEmail = () => faker.internet.email({ provider: 'example.com' });

// 介面：定義已註冊使用者夾具的結構
interface RegisteredUserFixture {
  registeredEmail: string;
  registeredPassword: string;
}

// 擴展 Playwright 的 test 物件，以包含一個 'registeredUser' 夾具。
// 這個夾具會在測試運行前註冊一個使用者，並提供其憑證給需要它的測試。
const testWithRegisteredUser = test.extend<{ registeredUser: RegisteredUserFixture }>({
  registeredUser: async ({ page }, use) => {
    const email = generateUniqueEmail();
    const password = 'Password123!'; // 測試帳戶使用的固定且強壯密碼

    // 執行註冊步驟
    await page.goto('/register');
    await expect(page.locator('h1')).toHaveText('建立帳號');

    await page.getByLabel('帳號 (E-mail)').fill(email);
    await page.getByLabel('密碼', { exact: true }).fill(password);
    await page.getByLabel('確認密碼').fill(password);
    await page.getByLabel('姓名').fill(faker.person.fullName());
    await page.getByLabel('本國國籍 CITIZEN').check(); // 選擇「本國國籍」
    await page.getByLabel('身分證字號').fill('A123456789'); // 填寫有效的身份證字號
    await page.getByLabel('男').check(); // 選擇「男」
    
    // 填寫出生日期。假設日期選擇器可以直接輸入或有簡單的互動方式。
    // 如果日期選擇器是複雜的 UI，需要更多互動（例如點擊月份/年份導航箭頭，然後點擊日期單元格）。
    await page.getByPlaceholder('請選擇日期').fill('2000-01-01');
    await page.keyboard.press('Escape'); // 關閉日期選擇器以避免遮擋其他元素

    await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();
    await page.getByRole('button', { name: '立即註冊' }).click();

    // 斷言註冊成功訊息和頁面跳轉
    // 重要：請將 '.success-message' 和 'h1' 的選擇器替換為您的應用程式中實際的元素選擇器。
    await expect(page.locator('.success-message')).toHaveText('系統顯示註冊成功訊息');
    await expect(page.locator('h1')).toHaveText('驗證電子信箱');

    // 將註冊的使用者憑證提供給依賴此夾具的測試
    await use({ registeredEmail: email, registeredPassword: password });
  },
});

// 測試套件：帳號與認證相關測試
test.describe('帳號與認證', () => {

  // 在每個測試運行前執行，確保測試環境的乾淨狀態 (清除 cookie 和 localStorage)。
  test.beforeEach(async ({ page }) => {
    await page.goto('/'); // 導航到一個已知頁面以確保上下文已載入
    await page.evaluate(() => localStorage.clear()); // 清除 localStorage
    await page.context().clearCookies(); // 清除 cookie
  });

  // TC-M-001：會員註冊 — 正常流程
  test('TC-M-001: 會員以有效資料完成帳號註冊', async ({ page }) => {
    const email = generateUniqueEmail();
    const password = 'Password123!';

    // 步驟 1: 開啟會員入口首頁，點擊右上角「註冊」按鈕
    await page.goto('/');
    // 重要：請將 'button', { name: '註冊' } 替換為您的註冊按鈕的實際選擇器 (例如 data-testid, class)。
    await page.getByRole('button', { name: '註冊' }).click();

    // 步驟 2: 頁面顯示「建立帳號」標題，副標題「加入競賽咖，開始您的賽事之旅」
    await expect(page.locator('h1')).toHaveText('建立帳號');
    await expect(page.locator('h2')).toHaveText('加入競賽咖，開始您的賽事之旅'); // 假設副標題是 h2

    // 步驟 3: 依序填寫所有必填欄位
    await page.getByLabel('帳號 (E-mail)').fill(email);
    // 密碼強度計量條的視覺反饋在此處不會直接斷言，但填寫欄位會觸發它。
    await page.getByLabel('密碼', { exact: true }).fill(password);
    await page.getByLabel('確認密碼').fill(password);
    await page.getByLabel('姓名').fill(faker.person.fullName());
    await page.getByLabel('本國國籍 CITIZEN').check();
    await page.getByLabel('身分證字號').fill('A123456789');
    await page.getByLabel('男').check();
    await page.getByPlaceholder('請選擇日期').fill('2000-01-01');
    await page.keyboard.press('Escape'); // 關閉日期選擇器

    // 步驟 4: 勾選「我已閱讀並同意服務條款與隱私權政策」checkbox
    await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();

    // 步驟 5: 點擊「立即註冊」按鈕
    await page.getByRole('button', { name: '立即註冊' }).click();

    // 預期結果:
    // 系統顯示註冊成功訊息
    // 重要：請將 '.success-message' 替換為您的成功訊息的實際 CSS 選擇器。
    await expect(page.locator('.success-message')).toHaveText('系統顯示註冊成功訊息');
    // 系統發送驗證郵件至填寫的 Email，頁面提示「驗證電子信箱」
    // 重要：請將 'h1' 替換為「驗證電子信箱」頁面標題的實際選擇器。
    await expect(page.locator('h1')).toHaveText('驗證電子信箱');
    await expect(page).toHaveURL(/.*\/verify-email/); // 斷言 URL 已跳轉到電子郵件驗證頁面
  });

  // TC-M-002：會員註冊 — 密碼不一致
  test('TC-M-002: 會員註冊時密碼與確認密碼不一致', async ({ page }) => {
    // 步驟 1: 開啟「建立帳號」註冊頁面
    await page.goto('/register');
    await expect(page.locator('h1')).toHaveText('建立帳號');

    // 步驟 2: 填寫帳號 (E-mail)、姓名等必填欄位
    await page.getByLabel('帳號 (E-mail)').fill(generateUniqueEmail());
    await page.getByLabel('姓名').fill(faker.person.fullName());
    await page.getByLabel('本國國籍 CITIZEN').check();
    await page.getByLabel('身分證字號').fill('A123456789');
    await page.getByLabel('男').check();
    await page.getByPlaceholder('請選擇日期').fill('2000-01-01');
    await page.keyboard.press('Escape');

    // 步驟 3: 「密碼」欄位輸入「Password123」，「確認密碼」欄位輸入「Password456」
    await page.getByLabel('密碼', { exact: true }).fill('Password123');
    await page.getByLabel('確認密碼').fill('Password456'); // 密碼不一致

    // 步驟 4: 勾選服務條款 checkbox，點擊「立即註冊」按鈕
    await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();
    await page.getByRole('button', { name: '立即註冊' }).click();

    // 預期結果:
    // 系統顯示「密碼不一致」錯誤提示
    // 重要：請將 '.error-message-password-confirm' 替換為您的錯誤提示的實際 CSS 選擇器。
    await expect(page.locator('.error-message-password-confirm')).toHaveText('密碼不一致');
    // 頁面保留在註冊頁，不進行註冊
    await expect(page.locator('h1')).toHaveText('建立帳號');
    await expect(page).toHaveURL(/.*\/register/); // 斷言 URL 仍在註冊頁面
  });

  // TC-M-003：會員註冊 — 重複 Email
  testWithRegisteredUser('TC-M-003: 會員使用已註冊的 Email 進行註冊', async ({ page, registeredUser }) => {
    // 步驟 1: 開啟「建立帳號」註冊頁面
    await page.goto('/register');
    await expect(page.locator('h1')).toHaveText('建立帳號');

    // 步驟 2: 在「帳號 (E-mail)」欄位輸入一個已註冊的 Email
    await page.getByLabel('帳號 (E-mail)').fill(registeredUser.registeredEmail); // 使用夾具中已註冊的電子郵件
    // 步驟 3: 填寫其餘所有必填欄位，密碼與確認密碼一致
    await page.getByLabel('密碼', { exact: true }).fill(registeredUser.registeredPassword);
    await page.getByLabel('確認密碼').fill(registeredUser.registeredPassword);
    await page.getByLabel('姓名').fill(faker.person.fullName());
    await page.getByLabel('本國國籍 CITIZEN').check();
    await page.getByLabel('身分證字號').fill('A123456789');
    await page.getByLabel('男').check();
    await page.getByPlaceholder('請選擇日期').fill('2000-01-01');
    await page.keyboard.press('Escape');

    // 步驟 4: 勾選服務條款 checkbox，點擊「立即註冊」按鈕
    await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();
    await page.getByRole('button', { name: '立即註冊' }).click();

    // 預期結果:
    // 系統顯示「此 Email 已被註冊」錯誤訊息
    // 重要：請將 '.error-message-email' 替換為您的錯誤提示的實際 CSS 選擇器。
    await expect(page.locator('.error-message-email')).toHaveText('此 Email 已被註冊');
    // 不建立新帳號 (頁面停留在註冊頁並顯示錯誤)
    await expect(page.locator('h1')).toHaveText('建立帳號');
    await expect(page).toHaveURL(/.*\/register/);
  });

  // TC-M-004：會員登入 — 正常流程
  testWithRegisteredUser('TC-M-004: 會員以正確帳密登入', async ({ page, registeredUser }) => {
    // 步驟 1: 開啟會員登入頁面
    await page.goto('/login');
    await expect(page.locator('h1')).toHaveText('歡迎回來');
    await expect(page.locator('h2')).toHaveText('請登入您的帳號以繼續使用'); // 假設副標題是 h2

    // 步驟 2: 在「Email」欄位輸入已註冊的 Email
    await page.getByLabel('Email', { exact: true }).fill(registeredUser.registeredEmail);
    // 步驟 3: 在「密碼」欄位輸入正確密碼
    await page.getByLabel('密碼', { exact: true }).fill(registeredUser.registeredPassword);
    // 步驟 4 (可選): 勾選「記住我」checkbox
    // await page.getByLabel('記住我').check();
    // 步驟 5: 點擊「登入」按鈕
    await page.getByRole('button', { name: '登入' }).click();

    // 預期結果:
    // 系統導向首頁
    await expect(page).toHaveURL(/.*\/$/); // 斷言 URL 跳轉到首頁
    // 頁面 Header 顯示會員名稱與頭像下拉選單
    // 重要：請將 '.header-user-name' 和 '.header-user-avatar' 替換為您的頁面 header 中實際的元素選擇器。
    await expect(page.locator('.header-user-name')).toBeVisible();
    await expect(page.locator('.header-user-avatar')).toBeVisible();
  });

  // TC-M-005：會員登入 — 錯誤密碼
  testWithRegisteredUser('TC-M-005: 會員以錯誤密碼登入', async ({ page, registeredUser }) => {
    // 步驟 1: 開啟「歡迎回來」登入頁面
    await page.goto('/login');
    await expect(page.locator('h1')).toHaveText('歡迎回來');

    // 步驟 2: 在「Email」欄位輸入正確的 Email，在「密碼」欄位輸入錯誤的密碼
    await page.getByLabel('Email', { exact: true }).fill(registeredUser.registeredEmail);
    await page.getByLabel('密碼', { exact: true }).fill('WrongPassword123!'); // 錯誤密碼
    // 步驟 3: 點擊「登入」按鈕
    await page.getByRole('button', { name: '登入' }).click();

    // 預期結果:
    // 系統顯示「帳號或密碼錯誤」訊息
    // 重要：請將 '.error-message-login' 替換為您的錯誤提示的實際 CSS 選擇器。
    await expect(page.locator('.error-message-login')).toHaveText('帳號或密碼錯誤');
    // 保留在登入頁
    await expect(page.locator('h1')).toHaveText('歡迎回來');
    await expect(page).toHaveURL(/.*\/login/);
  });

  // TC-M-006：信箱驗證
  testWithRegisteredUser('TC-M-006: 會員透過驗證連結完成信箱驗證', async ({ page, registeredUser }) => {
    // 重要提示：此測試模擬點擊驗證連結。在實際情境中，您需要：
    // 1. 攔截外發電子郵件 (例如，使用 Mailosaur/Mailtrap 等測試電子郵件服務，或本地 SMTP 伺服器)。
    // 2. 從電子郵件內容中提取實際的驗證連結。
    // 3. 導航到該提取的連結。
    // 在此範例中，我們假設一個已知的驗證 URL 結構並模擬一個 token。
    // 健壯的解決方案需要您的測試環境提供一個 API 端點，以獲取特定已註冊電子郵件的 token，或者實際的電子郵件互動。
    const verificationToken = 'mock-verification-token-for-' + registeredUser.registeredEmail;

    // 步驟 1: (已由 'registeredUser' 夾具處理)
    // 步驟 2: (模擬開啟收到的驗證郵件，點擊郵件中的驗證連結)
    // 直接導航到預期的驗證 URL 來模擬點擊連結。
    // 重要：請將 '/verify-email?token=' 替換為您實際的驗證端點和參數。
    await page.goto(`/verify-email?token=${verificationToken}`);

    // 預期結果:
    // 系統顯示「信箱驗證成功」訊息
    // 重要：請將 '.success-message-email-verification' 替換為您的成功訊息的實際 CSS 選擇器。
    await expect(page.locator('.success-message-email-verification')).toHaveText('信箱驗證成功');
    // 會員帳號狀態更新為已驗證 (這是內部狀態，E2E 測試主要驗證 UI 反饋)
    // 可選：斷言頁面跳轉到成功頁面或登入頁面。
    await expect(page).toHaveURL(/.*\/verification-success/); // 假設跳轉到成功頁面
  });

  // TC-M-007：忘記密碼
  testWithRegisteredUser('TC-M-007: 會員透過忘記密碼流程重設密碼', async ({ page, registeredUser }) => {
    // 步驟 1: 在登入頁面點擊「忘記密碼？」連結
    await page.goto('/login');
    await expect(page.locator('h1')).toHaveText('歡迎回來');

    // 重要：請將 'link', { name: '忘記密碼？' } 替換為您的忘記密碼連結的實際選擇器。
    await page.getByRole('link', { name: '忘記密碼？' }).click();
    // 假設跳轉到忘記密碼頁面並顯示特定標題
    await expect(page.locator('h1')).toHaveText('重設密碼'); // 假設頁面標題變為「重設密碼」

    // 步驟 2: 輸入已註冊的 Email
    await page.getByLabel('Email').fill(registeredUser.registeredEmail);
    // 步驟 3: 點擊「送出」按鈕
    await page.getByRole('button', { name: '送出' }).click();

    // 預期結果:
    // 系統顯示「重設密碼郵件已發送」訊息
    // 重要：請將 '.success-message-forgot-password' 替換為您的成功訊息的實際 CSS 選擇器。
    await expect(page.locator('.success-message-forgot-password')).toHaveText('重設密碼郵件已發送');
    // 可選：斷言頁面跳轉到確認頁面。
    await expect(page).toHaveURL(/.*\/forgot-password-success/); // 假設跳轉到一個成功頁面
  });
});
```