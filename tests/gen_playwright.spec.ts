```typescript
import { test, expect, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';

// =========================================================================
// 設定區塊：請根據您的實際應用程式環境調整
// =========================================================================

// 您的應用程式基礎 URL
const BASE_URL = 'http://localhost:3000'; 

// 預設登入頁面路徑 (如果登入頁面不是根目錄)
const LOGIN_PAGE_PATH = '/login'; 
// 預設註冊頁面路徑 (如果註冊頁面不是從首頁點擊，可直接進入)
const REGISTER_PAGE_PATH = '/register'; 
// 預設首頁路徑 (登入成功後導向的頁面)
const HOME_PAGE_PATH = '/home'; 
// 預設信箱驗證成功頁面路徑 (假設點擊驗證信件後會導向此頁面)
const EMAIL_VERIFY_SUCCESS_PATH = '/email-verify-success'; 
// 預設忘記密碼頁面路徑 (假設點擊忘記密碼後會導向此頁面或顯示彈窗)
const FORGOT_PASSWORD_PAGE_PATH = '/forgot-password'; 

// =========================================================================
// 輔助函數與通用測試資料
// =========================================================================

/**
 * 產生一個符合「8-16位英文字母與數字混和」且包含特殊字元的密碼。
 * 實際應用中請根據您的密碼規則調整。
 */
const generateStrongPassword = (): string => {
  // 確保密碼包含大小寫字母、數字和特殊字元，並符合長度要求
  const password = faker.internet.password({
    length: 12, // 確保至少8位，這裡設12位
    pattern: /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])/, // 確保有大小寫、數字、特殊字元
  });
  return password;
};

// 儲存一個預先註冊的會員帳號資訊，供後續需要登入或測試重複性場景使用
let registeredUserEmail: string;
const registeredUserPassword = generateStrongPassword(); 
const registeredUserName = faker.person.fullName();
const registeredUserId = faker.string.numeric(10); // 10位數字身分證字號
const registeredUserDob = '1990-01-01'; // 預設出生日期

// =========================================================================
// 測試套件
// =========================================================================

test.describe('會員帳號與認證功能測試', () => {

  /**
   * 測試前置準備：註冊一個會員帳號，供後續需登入或重複 Email 等測試案例使用。
   * 此步驟會在所有 '會員帳號與認證功能測試' 執行前僅執行一次。
   *
   * 注意：在實際的 E2E 測試框架中，通常會透過 API 呼叫來建立測試資料
   * (例如：呼叫後端註冊 API)，而非透過 UI 互動，因為 API 建立資料更快、更穩定。
   * 此處為了完整演示 UI 互動流程，故仍採用模擬 UI 註冊的方式。
   */
  test.beforeAll('建立一個預設會員帳號供後續測試使用', async ({ page }) => {
    // 使用 page 實例來執行一次性註冊
    registeredUserEmail = faker.internet.email();

    await page.goto(`${BASE_URL}${REGISTER_PAGE_PATH}`);

    // 填寫註冊表單
    await page.getByLabel('帳號 (E-mail)').fill(registeredUserEmail);
    await page.getByLabel('密碼', { exact: true }).fill(registeredUserPassword);
    await page.getByLabel('確認密碼').fill(registeredUserPassword);
    await page.getByLabel('姓名').fill(registeredUserName);
    await page.getByLabel('本國國籍 CITIZEN').check(); // 選擇 '本國國籍'
    await page.getByLabel('身分證字號').fill(registeredUserId);
    await page.getByLabel('男').check(); // 選擇 '男'
    await page.getByLabel('出生日期').fill(registeredUserDob);
    await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();
    await page.getByRole('button', { name: '立即註冊' }).click();

    // 驗證註冊成功訊息 (與 TC-M-001 預期結果相同)
    await expect(page.getByText('系統顯示註冊成功訊息')).toBeVisible();
    await expect(page.getByText('驗證電子信箱')).toBeVisible();

    console.log(`[Setup] 已預先註冊會員: ${registeredUserEmail} / ${registeredUserPassword}`);
  });


  // --- TC-M-001：會員註冊 — 正常流程 ---
  test('TC-M-001: 會員以有效資料完成帳號註冊', async ({ page }) => {
    const userEmail = faker.internet.email();
    const password = generateStrongPassword();
    const userName = faker.person.fullName();
    const userId = faker.string.numeric(10); // 10位數字身分證字號
    const userDob = '1990-05-15'; // 範例出生日期

    await page.goto(BASE_URL); // 開啟會員入口首頁
    await page.getByRole('button', { name: '註冊' }).click(); // 點擊右上角「註冊」按鈕

    // 驗證頁面標題和副標題
    await expect(page.getByRole('heading', { name: '建立帳號' })).toBeVisible();
    await expect(page.getByText('加入競賽咖，開始您的賽事之旅')).toBeVisible();

    // 依序填寫所有必填欄位
    await page.getByLabel('帳號 (E-mail)').fill(userEmail);
    await page.getByLabel('密碼', { exact: true }).fill(password); // exact: true 避免與確認密碼混淆
    await page.getByLabel('確認密碼').fill(password);
    await page.getByLabel('姓名').fill(userName);
    await page.getByLabel('本國國籍 CITIZEN').check(); // 選擇 '本國國籍'
    await page.getByLabel('身分證字號').fill(userId);
    await page.getByLabel('男').check(); // 選擇 '男'
    await page.getByLabel('出生日期').fill(userDob); // 使用 fill 填寫日期輸入框
    await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check(); // 勾選 checkbox

    await page.getByRole('button', { name: '立即註冊' }).click(); // 點擊「立即註冊」按鈕

    // 預期結果驗證
    await expect(page.getByText('系統顯示註冊成功訊息')).toBeVisible();
    await expect(page.getByText('驗證電子信箱')).toBeVisible();
  });


  // --- TC-M-002：會員註冊 — 密碼不一致 ---
  test('TC-M-002: 會員註冊時密碼與確認密碼不一致', async ({ page }) => {
    const userEmail = faker.internet.email();
    const userName = faker.person.fullName();

    await page.goto(`${BASE_URL}${REGISTER_PAGE_PATH}`); // 直接進入「建立帳號」註冊頁面

    // 填寫帳號 (E-mail)、姓名等必填欄位
    await page.getByLabel('帳號 (E-mail)').fill(userEmail);
    await page.getByLabel('姓名').fill(userName);

    // 「密碼」欄位輸入「Password123」，「確認密碼」欄位輸入「Password456」
    await page.getByLabel('密碼', { exact: true }).fill('Password123');
    await page.getByLabel('確認密碼').fill('Password456'); // 密碼不一致

    // 填寫其他必填欄位以確保能觸發密碼驗證
    await page.getByLabel('本國國籍 CITIZEN').check();
    await page.getByLabel('身分證字號').fill(faker.string.numeric(10));
    await page.getByLabel('男').check();
    await page.getByLabel('出生日期').fill('1990-01-01');

    await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check(); // 勾選服務條款 checkbox
    await page.getByRole('button', { name: '立即註冊' }).click(); // 點擊「立即註冊」按鈕

    // 預期結果驗證
    await expect(page.getByText('密碼不一致')).toBeVisible(); // 系統顯示「密碼不一致」錯誤提示
    await expect(page.getByRole('heading', { name: '建立帳號' })).toBeVisible(); // 頁面保留在註冊頁
  });


  // --- TC-M-003：會員註冊 — 重複 Email ---
  test('TC-M-003: 會員使用已註冊的 Email 進行註冊', async ({ page }) => {
    const password = generateStrongPassword();
    const userName = faker.person.fullName();
    const userId = faker.string.numeric(10);
    const userDob = '1995-11-22';

    await page.goto(`${BASE_URL}${REGISTER_PAGE_PATH}`); // 開啟「建立帳號」註冊頁面

    // 在「帳號 (E-mail)」欄位輸入一個已註冊的 Email (使用 beforeAll 建立的會員)
    await page.getByLabel('帳號 (E-mail)').fill(registeredUserEmail);
    await page.getByLabel('密碼', { exact: true }).fill(password);
    await page.getByLabel('確認密碼').fill(password);
    await page.getByLabel('姓名').fill(userName);
    await page.getByLabel('本國國籍 CITIZEN').check();
    await page.getByLabel('身分證字號').fill(userId);
    await page.getByLabel('女').check();
    await page.getByLabel('出生日期').fill(userDob);
    await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check(); // 勾選服務條款 checkbox

    await page.getByRole('button', { name: '立即註冊' }).click(); // 點擊「立即註冊」按鈕

    // 預期結果驗證
    await expect(page.getByText('此 Email 已被註冊')).toBeVisible(); // 系統顯示「此 Email 已被註冊」錯誤訊息
    await expect(page.getByRole('heading', { name: '建立帳號' })).toBeVisible(); // 不建立新帳號，頁面保留在註冊頁
  });


  // --- TC-M-004：會員登入 — 正常流程 ---
  test('TC-M-004: 會員以正確帳密登入', async ({ page }) => {
    await page.goto(`${BASE_URL}${LOGIN_PAGE_PATH}`); // 開啟會員登入頁面

    // 驗證頁面標題和副標題
    await expect(page.getByRole('heading', { name: '歡迎回來' })).toBeVisible();
    await expect(page.getByText('請登入您的帳號以繼續使用')).toBeVisible();

    // 在「Email」欄位輸入已註冊的 Email
    await page.getByPlaceholder('請輸入 Email 或帳號').fill(registeredUserEmail);
    // 在「密碼」欄位輸入正確密碼
    await page.getByLabel('密碼', { exact: true }).fill(registeredUserPassword);

    // 可選擇勾選「記住我」checkbox (此處不勾選)
    // await page.getByLabel('記住我').check();

    await page.getByRole('button', { name: '登入' }).click(); // 點擊「登入」按鈕

    // 預期結果驗證
    await expect(page).toHaveURL(`${BASE_URL}${HOME_PAGE_PATH}`); // 系統導向首頁 (假設路徑為 /home)
    // 頁面 Header 顯示會員名稱與頭像下拉選單
    await expect(page.locator('header').getByText(registeredUserName.split(' ')[0])).toBeVisible(); // 假設 Header 顯示會員名 (取 firstName)
    await expect(page.locator('header').getByRole('img', { name: '會員頭像' })).toBeVisible(); // 假設 Header 顯示會員頭像
  });


  // --- TC-M-005：會員登入 — 錯誤密碼 ---
  test('TC-M-005: 會員以錯誤密碼登入', async ({ page }) => {
    await page.goto(`${BASE_URL}${LOGIN_PAGE_PATH}`); // 開啟「歡迎回來」登入頁面

    // 在「Email」欄位輸入正確的 Email
    await page.getByPlaceholder('請輸入 Email 或帳號').fill(registeredUserEmail);
    // 在「密碼」欄位輸入錯誤的密碼
    await page.getByLabel('密碼', { exact: true }).fill('WrongPassword123!'); 

    await page.getByRole('button', { name: '登入' }).click(); // 點擊「登入」按鈕

    // 預期結果驗證
    await expect(page.getByText('帳號或密碼錯誤')).toBeVisible(); // 系統顯示「帳號或密碼錯誤」訊息
    await expect(page.getByRole('heading', { name: '歡迎回來' })).toBeVisible(); // 保留在登入頁
  });


  // --- TC-M-006：信箱驗證 ---
  test('TC-M-006: 會員透過驗證連結完成信箱驗證', async ({ page }) => {
    // 說明：
    // 在真實的 E2E 測試中，要完全測試信箱驗證流程，通常需要：
    // 1. 完成會員註冊 (如 TC-M-001 或 beforeAll 中所示)。
    // 2. 整合一個測試用的電子郵件服務 (例如：Mailosaur, Ethereal.email, Mailtrap 等)，
    //    用來攔截應用程式寄出的驗證郵件。
    // 3. 從測試郵件服務中取出驗證連結 URL。
    // 4. 使用 Playwright 導航至該驗證連結 URL。

    // 由於 Playwright 本身無法直接存取外部電子郵件，此處採取簡化方式：
    // 假設點擊驗證連結後，系統會導向一個特定的「信箱驗證成功」頁面。
    // 您需要將 `EMAIL_VERIFY_SUCCESS_PATH` 替換為實際的成功頁面路徑。

    await page.goto(`${BASE_URL}${EMAIL_VERIFY_SUCCESS_PATH}`); // 模擬導航至信箱驗證成功頁面

    // 預期結果驗證
    await expect(page.getByText('信箱驗證成功')).toBeVisible(); // 系統顯示「信箱驗證成功」訊息
    // 實際應用中，您可能還會想驗證會員帳號狀態是否已更新 (例如：嘗試登入，並檢查是否不再提示驗證信箱)
  });


  // --- TC-M-007：忘記密碼 ---
  test('TC-M-007: 會員透過忘記密碼流程重設密碼', async ({ page }) => {
    await page.goto(`${BASE_URL}${LOGIN_PAGE_PATH}`); // 在登入頁面

    // 點擊「忘記密碼？」連結 (假設連結位於「記住我」checkbox 右側)
    await page.getByRole('link', { name: '忘記密碼？' }).click();

    // 假設點擊後會導向一個忘記密碼頁面或彈出一個模態框
    await expect(page.getByRole('heading', { name: '重設您的密碼' })).toBeVisible(); // 驗證忘記密碼頁面的標題

    // 輸入已註冊的 Email
    await page.getByLabel('Email').fill(registeredUserEmail); 

    await page.getByRole('button', { name: '送出' }).click(); // 點擊「送出」按鈕

    // 預期結果驗證
    await expect(page.getByText('重設密碼郵件已發送')).toBeVisible(); // 系統顯示「重設密碼郵件已發送」訊息
    // 實際應用中，後續步驟會涉及電子郵件的處理，這部分類似 TC-M-006，需要整合外部服務。
  });

});
```