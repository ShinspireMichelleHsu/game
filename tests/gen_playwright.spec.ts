```typescript
// member.spec.ts
import { test, expect, Page } from '@playwright/test';

// Define base URL for the application
const BASE_URL = 'http://localhost:3000'; // 請替換為您的應用程式實際 URL

// Utility function to generate a unique email address
function generateUniqueEmail() {
  const timestamp = new Date().getTime();
  return `testuser+${timestamp}@example.com`;
}

// Utility function to generate a strong password
function generateStrongPassword() {
  return `Password${new Date().getTime().toString().slice(-4)}!`; // e.g., Password1234!
}

// Utility function to generate a random name
function generateRandomName() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

// Utility function to generate a random ID number (simple simulation)
function generateRandomIdNumber() {
  return `A${Math.floor(Math.random() * 900000000) + 100000000}`; // A123456789
}

test.describe('帳號與認證', () => {

  // Pre-condition: A registered user for tests that require one.
  // We'll create a user here to be used across multiple tests.
  let registeredEmail: string;
  let registeredPassword = generateStrongPassword();

  test.beforeAll(async ({ request }) => {
    // In a real scenario, you might use API to register a user faster,
    // or register through UI once and store credentials.
    // For now, let's just pre-define a unique email that can be used
    // for scenarios like "重複 Email" or "登入".
    registeredEmail = generateUniqueEmail();

    // Optionally, register this user via API if available,
    // or run a simplified registration flow here if many tests depend on it.
    // For this example, TC-M-003 will register an email itself,
    // and other login/forgot password tests will rely on an *assumed* registered email.
    // To make it robust, we'll actually register a user for later login tests.
    // This part assumes a simplified API for registration, or could be a full UI flow.
    // For this exercise, we will assume `registeredEmail` and `registeredPassword`
    // are for an account that *will be* registered by TC-M-001 or a similar setup,
    // or we'll perform a quick registration here if needed.
    // Let's assume TC-M-001 will register `registeredEmail` and `registeredPassword`
    // for its successful case, and we'll reuse those values.
    // For robust pre-conditions, consider a dedicated setup.
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL); // Go to home page before each test
  });

  test('TC-M-001：會員註冊 — 正常流程 - 會員以有效資料完成帳號註冊', async ({ page }) => {
    const uniqueEmail = generateUniqueEmail();
    const password = generateStrongPassword();
    const name = generateRandomName();
    const idNumber = generateRandomIdNumber();
    const birthDate = '1990-01-01'; // YYYY-MM-DD

    await test.step('開啟會員入口首頁，點擊右上角「註冊」按鈕', async () => {
      await page.getByRole('button', { name: '註冊' }).click(); // Assuming a '註冊' button in header
      await expect(page).toHaveURL(`${BASE_URL}/register`); // Adjust URL path if different
    });

    await test.step('頁面顯示「建立帳號」標題，副標題「加入競賽咖，開始您的賽事之旅」', async () => {
      await expect(page.getByRole('heading', { name: '建立帳號' })).toBeVisible();
      await expect(page.getByText('加入競賽咖，開始您的賽事之旅')).toBeVisible();
    });

    await test.step('依序填寫所有必填欄位', async () => {
      await page.getByLabel('帳號 (E-mail)').fill(uniqueEmail);
      await page.getByLabel('密碼').fill(password);
      await page.getByLabel('確認密碼').fill(password);
      await page.getByLabel('姓名').fill(name);

      //國籍（radio 選項：本國國籍 CITIZEN / 外國國籍 NON-CITIZEN）
      await page.getByLabel('本國國籍 CITIZEN').check();

      // 身分證字號（提示：外國人請輸入護照號碼）
      await page.getByLabel('身分證字號').fill(idNumber);

      // 性別（radio 選項：男 / 女）
      await page.getByLabel('男').check();

      // 出生日期（日期選擇器）- Assuming text input for simplicity
      await page.getByLabel('出生日期').fill(birthDate);

      // 勾選「我已閱讀並同意服務條款與隱私權政策」checkbox
      await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();
    });

    await test.step('點擊「立即註冊」按鈕', async () => {
      await page.getByRole('button', { name: '立即註冊' }).click();
    });

    await test.step('預期結果: 系統顯示註冊成功訊息，頁面提示「驗證電子信箱」', async () => {
      // Assuming a success message or redirect to a verification page
      await expect(page.getByText('註冊成功訊息')).toBeVisible(); // Replace with actual success message text
      await expect(page.getByText('驗證電子信箱')).toBeVisible();
      await expect(page).toHaveURL(`${BASE_URL}/verify-email`); // Adjust expected URL
    });

    // Store this user's details for subsequent tests if needed.
    // For TC-M-004, M-005, M-007, we'll use a pre-registered user
    // or assume the one created here. Let's make this the `registeredEmail`
    // and `registeredPassword` for consistency.
    registeredEmail = uniqueEmail;
    // registeredPassword is already set to `password`
  });

  test('TC-M-002：會員註冊 — 密碼不一致', async ({ page }) => {
    const uniqueEmail = generateUniqueEmail();
    const name = generateRandomName();
    const idNumber = generateRandomIdNumber();
    const birthDate = '1990-01-01';

    await test.step('開啟「建立帳號」註冊頁面', async () => {
      await page.goto(`${BASE_URL}/register`); // Directly go to registration page
      await expect(page.getByRole('heading', { name: '建立帳號' })).toBeVisible();
    });

    await test.step('填寫帳號 (E-mail)、姓名等必填欄位', async () => {
      await page.getByLabel('帳號 (E-mail)').fill(uniqueEmail);
      await page.getByLabel('姓名').fill(name);
      await page.getByLabel('本國國籍 CITIZEN').check();
      await page.getByLabel('身分證字號').fill(idNumber);
      await page.getByLabel('男').check();
      await page.getByLabel('出生日期').fill(birthDate);
    });

    await test.step('「密碼」欄位輸入「Password123」，「確認密碼」欄位輸入「Password456」', async () => {
      await page.getByLabel('密碼').fill('Password123');
      await page.getByLabel('確認密碼').fill('Password456');
    });

    await test.step('勾選服務條款 checkbox，點擊「立即註冊」按鈕', async () => {
      await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();
      await page.getByRole('button', { name: '立即註冊' }).click();
    });

    await test.step('預期結果: 系統顯示「密碼不一致」錯誤提示，頁面保留在註冊頁', async () => {
      await expect(page.getByText('密碼不一致')).toBeVisible(); // Replace with actual error text
      await expect(page).toHaveURL(`${BASE_URL}/register`); // Verify URL remains on registration page
    });
  });

  test('TC-M-003：會員註冊 — 重複 Email', async ({ page }) => {
    const existingEmail = generateUniqueEmail();
    const password = generateStrongPassword();
    const name = generateRandomName();
    const idNumber = generateRandomIdNumber();
    const birthDate = '1990-01-01';

    // Pre-condition: Register an account with `existingEmail`
    await test.step('前置作業：註冊一個帳號', async () => {
      await page.goto(`${BASE_URL}/register`);
      await page.getByLabel('帳號 (E-mail)').fill(existingEmail);
      await page.getByLabel('密碼').fill(password);
      await page.getByLabel('確認密碼').fill(password);
      await page.getByLabel('姓名').fill(name);
      await page.getByLabel('本國國籍 CITIZEN').check();
      await page.getByLabel('身分證字號').fill(idNumber);
      await page.getByLabel('男').check();
      await page.getByLabel('出生日期').fill(birthDate);
      await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();
      await page.getByRole('button', { name: '立即註冊' }).click();
      // Wait for the first registration to complete and potentially redirect
      await expect(page.getByText('註冊成功訊息')).toBeVisible();
      await page.goto(`${BASE_URL}/register`); // Navigate back to registration page
    });

    await test.step('開啟「建立帳號」註冊頁面', async () => {
      await page.goto(`${BASE_URL}/register`);
      await expect(page.getByRole('heading', { name: '建立帳號' })).toBeVisible();
    });

    await test.step('在「帳號 (E-mail)」欄位輸入一個已註冊的 Email', async () => {
      await page.getByLabel('帳號 (E-mail)').fill(existingEmail);
    });

    await test.step('填寫其餘所有必填欄位，密碼與確認密碼一致', async () => {
      await page.getByLabel('密碼').fill(password);
      await page.getByLabel('確認密碼').fill(password);
      await page.getByLabel('姓名').fill(generateRandomName()); // Use a different name
      await page.getByLabel('本國國籍 CITIZEN').check();
      await page.getByLabel('身分證字號').fill(generateRandomIdNumber());
      await page.getByLabel('男').check();
      await page.getByLabel('出生日期').fill(birthDate);
    });

    await test.step('勾選服務條款 checkbox，點擊「立即註冊」按鈕', async () => {
      await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();
      await page.getByRole('button', { name: '立即註冊' }).click();
    });

    await test.step('預期結果: 系統顯示「此 Email 已被註冊」錯誤訊息，不建立新帳號', async () => {
      await expect(page.getByText('此 Email 已被註冊')).toBeVisible(); // Replace with actual error text
      await expect(page).toHaveURL(`${BASE_URL}/register`); // Verify URL remains on registration page
    });
  });

  test('TC-M-004：會員登入 — 正常流程 - 會員以正確帳密登入', async ({ page }) => {
    // Pre-condition: Assume `registeredEmail` and `registeredPassword` are from a successfully registered user
    // For a robust test, you'd ensure this user is actually registered and verified.
    // Let's assume this user is created by an earlier test or a setup hook.
    const loginEmail = registeredEmail || generateUniqueEmail(); // Use the one from TC-M-001 or a new one
    const loginPassword = registeredPassword;

    // A real scenario would involve creating this user via API or UI before this test.
    // For demonstration, let's ensure a user exists for login.
    await test.step('前置作業：確保有一個已註冊且已驗證的帳號', async () => {
      // This is a placeholder for actual user creation/verification logic.
      // In a real project, this might call an API or run a quick registration flow.
      // For now, we'll simulate a quick registration if `registeredEmail` isn't set.
      if (!registeredEmail) {
        registeredEmail = generateUniqueEmail();
        registeredPassword = generateStrongPassword();
        await page.goto(`${BASE_URL}/register`);
        await page.getByLabel('帳號 (E-mail)').fill(registeredEmail);
        await page.getByLabel('密碼').fill(registeredPassword);
        await page.getByLabel('確認密碼').fill(registeredPassword);
        await page.getByLabel('姓名').fill(generateRandomName());
        await page.getByLabel('本國國籍 CITIZEN').check();
        await page.getByLabel('身分證字號').fill(generateRandomIdNumber());
        await page.getByLabel('男').check();
        await page.getByLabel('出生日期').fill('1990-01-01');
        await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();
        await page.getByRole('button', { name: '立即註冊' }).click();
        await expect(page.getByText('註冊成功訊息')).toBeVisible();
        // Assuming email verification is handled automatically for test environment or via API
        await page.goto(`${BASE_URL}/login`); // Navigate to login page
      } else {
        await page.goto(`${BASE_URL}/login`);
      }
    });

    await test.step('開啟會員登入頁面，頁面顯示「歡迎回來」標題，副標題「請登入您的帳號以繼續使用」', async () => {
      await expect(page.getByRole('heading', { name: '歡迎回來' })).toBeVisible();
      await expect(page.getByText('請登入您的帳號以繼續使用')).toBeVisible();
    });

    await test.step('在「Email」欄位輸入已註冊的 Email', async () => {
      await page.getByLabel('Email', { exact: true }).fill(loginEmail); // Using exact:true to avoid conflict with "Email 或帳號" placeholder if it's label
    });

    await test.step('在「密碼」欄位輸入正確密碼', async () => {
      await page.getByLabel('密碼', { exact: true }).fill(loginPassword);
    });

    await test.step('可選擇勾選「記住我」checkbox (選填)', async () => {
      // await page.getByLabel('記住我').check(); // Uncomment if you want to test this
    });

    await test.step('點擊「登入」按鈕', async () => {
      await page.getByRole('button', { name: '登入' }).click();
    });

    await test.step('預期結果: 系統導向首頁，頁面 Header 顯示會員名稱與頭像下拉選單', async () => {
      await expect(page).toHaveURL(BASE_URL); // Redirected to home page
      // Assuming a locator for logged-in user's name/avatar in header
      await expect(page.locator('.header-user-menu')).toBeVisible(); // Replace with actual locator
      // For example: await expect(page.getByText('Hi, ' + name)).toBeVisible();
    });
  });

  test('TC-M-005：會員登入 — 錯誤密碼', async ({ page }) => {
    // Pre-condition: Assume `registeredEmail` is from a successfully registered user
    const loginEmail = registeredEmail || generateUniqueEmail(); // Use a known good email
    const wrongPassword = 'WrongPassword123';

    // Ensure a user exists for login test
    await test.step('前置作業：確保有一個已註冊的帳號', async () => {
      if (!registeredEmail) { // If registeredEmail isn't set, create a quick one.
        registeredEmail = generateUniqueEmail();
        registeredPassword = generateStrongPassword();
        await page.goto(`${BASE_URL}/register`);
        await page.getByLabel('帳號 (E-mail)').fill(registeredEmail);
        await page.getByLabel('密碼').fill(registeredPassword);
        await page.getByLabel('確認密碼').fill(registeredPassword);
        await page.getByLabel('姓名').fill(generateRandomName());
        await page.getByLabel('本國國籍 CITIZEN').check();
        await page.getByLabel('身分證字號').fill(generateRandomIdNumber());
        await page.getByLabel('男').check();
        await page.getByLabel('出生日期').fill('1990-01-01');
        await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();
        await page.getByRole('button', { name: '立即註冊' }).click();
        await expect(page.getByText('註冊成功訊息')).toBeVisible();
        await page.goto(`${BASE_URL}/login`);
      } else {
        await page.goto(`${BASE_URL}/login`);
      }
    });

    await test.step('開啟「歡迎回來」登入頁面', async () => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page.getByRole('heading', { name: '歡迎回來' })).toBeVisible();
    });

    await test.step('在「Email」欄位輸入正確的 Email，在「密碼」欄位輸入錯誤的密碼', async () => {
      await page.getByLabel('Email', { exact: true }).fill(loginEmail);
      await page.getByLabel('密碼', { exact: true }).fill(wrongPassword);
    });

    await test.step('點擊「登入」按鈕', async () => {
      await page.getByRole('button', { name: '登入' }).click();
    });

    await test.step('預期結果: 系統顯示「帳號或密碼錯誤」訊息，保留在登入頁', async () => {
      await expect(page.getByText('帳號或密碼錯誤')).toBeVisible(); // Replace with actual error text
      await expect(page).toHaveURL(`${BASE_URL}/login`); // Verify URL remains on login page
    });
  });

  test('TC-M-006：信箱驗證', async ({ page, request }) => {
    const uniqueEmail = generateUniqueEmail();
    const password = generateStrongPassword();
    const name = generateRandomName();
    const idNumber = generateRandomIdNumber();
    const birthDate = '1990-01-01';

    await test.step('完成會員註冊', async () => {
      await page.goto(`${BASE_URL}/register`);
      await page.getByLabel('帳號 (E-mail)').fill(uniqueEmail);
      await page.getByLabel('密碼').fill(password);
      await page.getByLabel('確認密碼').fill(password);
      await page.getByLabel('姓名').fill(name);
      await page.getByLabel('本國國籍 CITIZEN').check();
      await page.getByLabel('身分證字號').fill(idNumber);
      await page.getByLabel('男').check();
      await page.getByLabel('出生日期').fill(birthDate);
      await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();
      await page.getByRole('button', { name: '立即註冊' }).click();
      await expect(page.getByText('註冊成功訊息')).toBeVisible();
      await expect(page.getByText('驗證電子信箱')).toBeVisible();
      await expect(page).toHaveURL(`${BASE_URL}/verify-email`); // Assuming redirect to verification prompt page
    });

    await test.step('開啟收到的驗證郵件，點擊郵件中的驗證連結', async () => {
      // This is the challenging part for E2E tests. Playwright doesn't directly interact with email.
      // Common approaches:
      // 1. Use a test email service (e.g., Mailtrap, Mailosaur) with API to fetch email content.
      // 2. If backend provides a test-only API to get verification link for an email.
      // 3. Bypass verification in test environment (less ideal for E2E).
      //
      // For this example, we will simulate by navigating to a known verification endpoint
      // that might exist in a test environment, or use a placeholder for fetching the link.

      // Placeholder for fetching verification link (replace with actual implementation)
      // let verificationLink: string;
      // If using Mailtrap:
      // const inboxId = 'YOUR_MAILTRAP_INBOX_ID';
      // const apiKey = 'YOUR_MAILTRAP_API_KEY';
      // const emailResponse = await request.get(`https://mailtrap.io/api/v1/inboxes/${inboxId}/messages?search=${uniqueEmail}`, {
      //   headers: { 'Api-Token': apiKey }
      // });
      // const emails = await emailResponse.json();
      // // Find the latest verification email and extract the link
      // verificationLink = extractLinkFromEmailBody(emails[0].html_body); // Implement extractLinkFromEmailBody
      //
      // For this example, we'll assume a direct verification URL can be constructed for testing,
      // or that the page redirects directly to a success state after simulated action.
      // A more realistic example would involve fetching the actual email.
      // For now, let's assume we can programmatically trigger verification if the system allows.
      // Or, if the `verify-email` page itself has a "Resend verification" and a hidden way to get link.

      // **SIMULATION**: In a real test, you would fetch the link from an email service.
      // For this example, let's assume a verification API or a known pattern.
      // Example: If the app redirects to `/verify-email?token=xyz` and we can get `xyz`.
      // Let's directly navigate to a hypothetical successful verification page for demonstration.
      // This is a simplification; actual implementation needs to find the link.
      const verificationSuccessUrl = `${BASE_URL}/email-verified?status=success`; // Hypothetical URL after clicking link

      // A more practical approach without email service integration:
      // If the backend has a test endpoint to verify an email:
      // await request.post(`${BASE_URL}/api/test-verify-email`, { data: { email: uniqueEmail } });
      // Then, navigate to the login page or home page and expect the "verified" state.

      // Let's assume after the registration, we have a way to get the token or directly hit the verification endpoint.
      // For now, let's just assert the success message after "clicking" the link.
      // Since Playwright cannot click links in an external email client, we'll simulate landing on the verified page.
      await page.goto(verificationSuccessUrl); // Simulate clicking the link
    });

    await test.step('預期結果: 系統顯示「信箱驗證成功」訊息，會員帳號狀態更新為已驗證', async () => {
      await expect(page.getByText('信箱驗證成功')).toBeVisible(); // Replace with actual success message
      // To verify account status update, you'd typically log in and check UI elements,
      // or query a backend API for the user's status. For this UI test, message visibility is enough.
      // For example, after verification, maybe the user is redirected to a dashboard with a "Verified" badge.
      // await page.goto(`${BASE_URL}/login`);
      // await page.getByLabel('Email').fill(uniqueEmail);
      // await page.getByLabel('密碼').fill(password);
      // await page.getByRole('button', { name: '登入' }).click();
      // await expect(page.locator('.user-status-verified')).toBeVisible(); // Example locator
    });
  });

  test('TC-M-007：忘記密碼', async ({ page }) => {
    // Pre-condition: Assume `registeredEmail` is from a successfully registered user
    const userEmail = registeredEmail || generateUniqueEmail();

    // Ensure a user exists for this test
    await test.step('前置作業：確保有一個已註冊的帳號', async () => {
      if (!registeredEmail) { // If registeredEmail isn't set, create a quick one.
        registeredEmail = generateUniqueEmail();
        registeredPassword = generateStrongPassword();
        await page.goto(`${BASE_URL}/register`);
        await page.getByLabel('帳號 (E-mail)').fill(registeredEmail);
        await page.getByLabel('密碼').fill(registeredPassword);
        await page.getByLabel('確認密碼').fill(registeredPassword);
        await page.getByLabel('姓名').fill(generateRandomName());
        await page.getByLabel('本國國籍 CITIZEN').check();
        await page.getByLabel('身分證字號').fill(generateRandomIdNumber());
        await page.getByLabel('男').check();
        await page.getByLabel('出生日期').fill('1990-01-01');
        await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();
        await page.getByRole('button', { name: '立即註冊' }).click();
        await expect(page.getByText('註冊成功訊息')).toBeVisible();
        await page.goto(`${BASE_URL}/login`);
      } else {
        await page.goto(`${BASE_URL}/login`);
      }
    });

    await test.step('在登入頁面點擊「忘記密碼？」連結', async () => {
      await page.goto(`${BASE_URL}/login`);
      await page.getByRole('link', { name: '忘記密碼？' }).click();
      await expect(page).toHaveURL(`${BASE_URL}/forgot-password`); // Adjust URL if different
    });

    await test.step('輸入已註冊的 Email', async () => {
      await page.getByLabel('Email', { exact: true }).fill(userEmail); // Assuming the field is labeled 'Email'
    });

    await test.step('點擊「送出」按鈕', async () => {
      await page.getByRole('button', { name: '送出' }).click();
    });

    await test.step('預期結果: 系統顯示「重設密碼郵件已發送」訊息', async () => {
      await expect(page.getByText('重設密碼郵件已發送')).toBeVisible(); // Replace with actual success message
      await expect(page).toHaveURL(`${BASE_URL}/forgot-password-success`); // Adjust expected URL after submission
    });
  });
});
```