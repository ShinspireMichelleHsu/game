```typescript
// tests/auth/TC-M-001_memberRegistrationNormalFlow.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

// Base URL for the application (replace with your actual application URL)
const BASE_URL = 'http://localhost:3000'; 

test.describe('TC-M-001: 會員註冊 — 正常流程', () => {
  test('會員以有效資料完成帳號註冊', async ({ page }) => {
    await test.step('開啟會員入口首頁，點擊右上角「註冊」按鈕', async () => {
      await page.goto(BASE_URL);
      await page.getByRole('button', { name: '註冊' }).click(); // Assuming '註冊' button is in the header
      await page.waitForURL(`${BASE_URL}/register`);
    });

    await test.step('頁面顯示「建立帳號」標題，副標題「加入競賽咖，開始您的賽事之旅」', async () => {
      await expect(page.getByRole('heading', { name: '建立帳號' })).toBeVisible();
      await expect(page.getByText('加入競賽咖，開始您的賽事之旅')).toBeVisible();
    });

    const email = faker.internet.email().toLowerCase();
    const password = faker.internet.password({ length: 10, pattern: /[A-Za-z0-9]/, memorable: false }) + '1A'; // Ensure mix of chars and nums
    const name = faker.person.fullName();
    const nationalId = faker.string.numeric(10); // Placeholder for ID
    const birthDate = faker.date.past({ years: 20, refDate: new Date() });
    const formattedBirthDate = birthDate.toISOString().split('T')[0]; // YYYY-MM-DD

    await test.step('依序填寫所有必填欄位', async () => {
      await page.getByLabel('帳號 (E-mail)').fill(email);
      await page.getByLabel('密碼', { exact: true }).fill(password);
      await page.getByLabel('確認密碼').fill(password);
      await page.getByLabel('姓名').fill(name);

      // Select '本國國籍 CITIZEN' radio option
      await page.getByLabel('本國國籍 CITIZEN').check();

      await page.getByLabel('身分證字號').fill(nationalId);

      // Select '男' radio option
      await page.getByLabel('男', { exact: true }).check();

      // Fill birth date using date input. Assuming a standard input[type="date"]
      await page.getByLabel('出生日期').fill(formattedBirthDate);

      // Check '我已閱讀並同意服務條款與隱私權政策' checkbox
      await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();
    });

    await test.step('點擊「立即註冊」按鈕', async () => {
      await page.getByRole('button', { name: '立即註冊' }).click();
    });

    await test.step('預期結果: 系統顯示註冊成功訊息，並提示「驗證電子信箱」', async () => {
      // Assuming a toast message or an inline success message appears briefly
      await expect(page.getByText('註冊成功！請檢查您的信箱以完成驗證。', { exact: true })).toBeVisible(); // Adjust text as per actual implementation

      // Assuming the page navigates to a verification prompt page
      await page.waitForURL(`${BASE_URL}/verify-email`); // Adjust URL as per actual implementation
      await expect(page.getByRole('heading', { name: '驗證電子信箱' })).toBeVisible();
      await expect(page.getByText(`我們已將驗證信發送至 ${email}`, { exact: false })).toBeVisible();
    });
  });
});
```
```typescript
// tests/auth/TC-M-002_memberRegistrationPasswordMismatch.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-002: 會員註冊 — 密碼不一致', () => {
  test('會員註冊時密碼與確認密碼不一致', async ({ page }) => {
    await test.step('開啟「建立帳號」註冊頁面', async () => {
      await page.goto(`${BASE_URL}/register`); // Directly navigate to registration page
      await expect(page.getByRole('heading', { name: '建立帳號' })).toBeVisible();
    });

    const email = faker.internet.email().toLowerCase();
    const name = faker.person.fullName();
    const nationalId = faker.string.numeric(10);
    const birthDate = faker.date.past({ years: 20, refDate: new Date() }).toISOString().split('T')[0];

    await test.step('填寫帳號 (E-mail)、姓名等必填欄位', async () => {
      await page.getByLabel('帳號 (E-mail)').fill(email);
      await page.getByLabel('姓名').fill(name);
      await page.getByLabel('本國國籍 CITIZEN').check();
      await page.getByLabel('身分證字號').fill(nationalId);
      await page.getByLabel('男', { exact: true }).check();
      await page.getByLabel('出生日期').fill(birthDate);
    });

    await test.step('「密碼」欄位輸入「Password123」，「確認密碼」欄位輸入「Password456」', async () => {
      await page.getByLabel('密碼', { exact: true }).fill('Password123');
      await page.getByLabel('確認密碼').fill('Password456');
    });

    await test.step('勾選服務條款 checkbox，點擊「立即註冊」按鈕', async () => {
      await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();
      await page.getByRole('button', { name: '立即註冊' }).click();
    });

    await test.step('預期結果: 系統顯示「密碼不一致」錯誤提示', async () => {
      // Assuming an error message appears next to the '確認密碼' field or as a toast
      await expect(page.getByText('密碼不一致', { exact: true })).toBeVisible();
      // Ensure the page remains on the registration page
      await expect(page).toHaveURL(`${BASE_URL}/register`);
    });
  });
});
```
```typescript
// tests/auth/TC-M-003_memberRegistrationDuplicateEmail.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-003: 會員註冊 — 重複 Email', () => {
  // Pre-condition: Assume this email already exists in the system.
  // In a real scenario, this would involve a setup fixture or an API call to register a user.
  const existingEmail = 'test_existing@example.com'; 
  const password = 'Password123A';

  test.beforeAll(async ({ request }) => {
    // Optional: Programmatically create a user if not using a fixed dummy account
    // For this example, we assume 'test_existing@example.com' is pre-registered.
    // In a real project, this might look like:
    // const response = await request.post(`${BASE_URL}/api/register`, {
    //   data: { email: existingEmail, password: password, ...otherRequiredFields }
    // });
    // expect(response.ok()).toBeTruthy();
  });

  test('會員使用已註冊的 Email 進行註冊', async ({ page }) => {
    await test.step('開啟「建立帳號」註冊頁面', async () => {
      await page.goto(`${BASE_URL}/register`);
      await expect(page.getByRole('heading', { name: '建立帳號' })).toBeVisible();
    });

    const name = faker.person.fullName();
    const nationalId = faker.string.numeric(10);
    const birthDate = faker.date.past({ years: 20, refDate: new Date() }).toISOString().split('T')[0];

    await test.step('在「帳號 (E-mail)」欄位輸入一個已註冊的 Email', async () => {
      await page.getByLabel('帳號 (E-mail)').fill(existingEmail);
    });

    await test.step('填寫其餘所有必填欄位，密碼與確認密碼一致', async () => {
      await page.getByLabel('密碼', { exact: true }).fill(password);
      await page.getByLabel('確認密碼').fill(password);
      await page.getByLabel('姓名').fill(name);
      await page.getByLabel('本國國籍 CITIZEN').check();
      await page.getByLabel('身分證字號').fill(nationalId);
      await page.getByLabel('男', { exact: true }).check();
      await page.getByLabel('出生日期').fill(birthDate);
    });

    await test.step('勾選服務條款 checkbox，點擊「立即註冊」按鈕', async () => {
      await page.getByLabel('我已閱讀並同意服務條款與隱私權政策').check();
      await page.getByRole('button', { name: '立即註冊' }).click();
    });

    await test.step('預期結果: 系統顯示「此 Email 已被註冊」錯誤訊息', async () => {
      // Assuming a toast message or an inline error message appears
      await expect(page.getByText('此 Email 已被註冊', { exact: true })).toBeVisible();
      // Ensure the page remains on the registration page
      await expect(page).toHaveURL(`${BASE_URL}/register`);
    });
  });
});
```
```typescript
// tests/auth/TC-M-004_memberLoginNormalFlow.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-004: 會員登入 — 正常流程', () => {
  // Pre-condition: A valid registered user.
  // In a real project, this user would be created via a setup fixture or API.
  const registeredEmail = 'test_user@example.com'; // Use an actual registered email
  const correctPassword = 'Password123A';

  test.beforeAll(async ({ request }) => {
    // Optional: Programmatically create a user if not using a fixed dummy account
    // For this example, we assume 'test_user@example.com' is pre-registered.
    // In a real project, this might look like:
    // const response = await request.post(`${BASE_URL}/api/register`, {
    //   data: { email: registeredEmail, password: correctPassword, ...otherRequiredFields }
    // });
    // expect(response.ok()).toBeTruthy();
  });

  test('會員以正確帳密登入', async ({ page }) => {
    await test.step('開啟會員登入頁面，頁面顯示「歡迎回來」標題，副標題「請登入您的帳號以繼續使用」', async () => {
      await page.goto(`${BASE_URL}/login`); // Adjust login URL if different
      await expect(page.getByRole('heading', { name: '歡迎回來' })).toBeVisible();
      await expect(page.getByText('請登入您的帳號以繼續使用')).toBeVisible();
    });

    await test.step('在「Email」欄位輸入已註冊的 Email', async () => {
      await page.getByPlaceholder('請輸入 Email 或帳號').fill(registeredEmail);
    });

    await test.step('在「密碼」欄位輸入正確密碼', async () => {
      await page.getByLabel('密碼').fill(correctPassword);
    });

    await test.step('可選擇勾選「記住我」checkbox (本步驟可選，不執行勾選)', async () => {
      // For this test, we'll skip checking "記住我" for simplicity.
      // If needed, await page.getByLabel('記住我').check();
    });

    await test.step('點擊「登入」按鈕', async () => {
      await page.getByRole('button', { name: '登入' }).click();
    });

    await test.step('預期結果: 系統導向首頁', async () => {
      await page.waitForURL(BASE_URL); // Assumes successful login redirects to BASE_URL
      await expect(page).toHaveURL(BASE_URL);
    });

    await test.step('預期結果: 頁面 Header 顯示會員名稱與頭像下拉選單', async () => {
      // Assuming a specific element indicates login status, e.g., a user icon or name
      await expect(page.getByLabel('會員選單', { exact: false }).first()).toBeVisible(); // Adjust locator based on actual header
      // Example: await expect(page.getByText('Hi, TestUser')).toBeVisible();
      // Example: await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    });
  });
});
```
```typescript
// tests/auth/TC-M-005_memberLoginWrongPassword.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-005: 會員登入 — 錯誤密碼', () => {
  // Pre-condition: A valid registered user.
  const registeredEmail = 'test_user@example.com'; // Use an actual registered email
  const wrongPassword = 'WrongPassword123';

  test.beforeAll(async ({ request }) => {
    // Optional: Programmatically ensure 'test_user@example.com' exists with a correct password.
  });

  test('會員以錯誤密碼登入', async ({ page }) => {
    await test.step('開啟「歡迎回來」登入頁面', async () => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page.getByRole('heading', { name: '歡迎回來' })).toBeVisible();
    });

    await test.step('在「Email」欄位輸入正確的 Email，在「密碼」欄位輸入錯誤的密碼', async () => {
      await page.getByPlaceholder('請輸入 Email 或帳號').fill(registeredEmail);
      await page.getByLabel('密碼').fill(wrongPassword);
    });

    await test.step('點擊「登入」按鈕', async () => {
      await page.getByRole('button', { name: '登入' }).click();
    });

    await test.step('預期結果: 系統顯示「帳號或密碼錯誤」訊息', async () => {
      // Assuming an error message appears (e.g., toast, or inline below fields)
      await expect(page.getByText('帳號或密碼錯誤', { exact: true })).toBeVisible();
    });

    await test.step('預期結果: 保留在登入頁', async () => {
      await expect(page).toHaveURL(`${BASE_URL}/login`);
      await expect(page.getByRole('heading', { name: '歡迎回來' })).toBeVisible(); // Still on login page
    });
  });
});
```
```typescript
// tests/auth/TC-M-006_emailVerification.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-006: 信箱驗證', () => {
  // Pre-condition: A user has registered and received a verification email.
  // In a real test, this would involve:
  // 1. Registering a new user.
  // 2. Interacting with an email testing service (e.g., Mailosaur, Mailtrap) to get the verification link.
  // 3. Navigating to that verification link.
  // For this script, we will simulate by directly navigating to a hypothetical verification success page
  // or a mock verification endpoint if such a direct URL is available for testing.

  let verificationLink: string;
  let registeredEmail: string;
  let registeredPassword: string;

  test.beforeAll(async ({ request }) => {
    // Step 1: Complete membership registration (simulate or use API)
    registeredEmail = faker.internet.email().toLowerCase();
    registeredPassword = faker.internet.password({ length: 10, pattern: /[A-Za-z0-9]/, memorable: false }) + '1A';

    // Simulate user registration via API or direct DB insertion for setup
    // This part is highly dependent on your backend/setup.
    // For demonstration, we'll assume a verification link is known or can be constructed.
    // A placeholder for a successful verification link.
    // In a real scenario, you'd parse this from an email body.
    verificationLink = `${BASE_URL}/verify?token=mock_verification_token_123`;

    // Optionally, if your system needs a user to actually be registered before attempting verification:
    // await request.post(`${BASE_URL}/api/register`, {
    //   data: {
    //     email: registeredEmail,
    //     password: registeredPassword,
    //     confirmPassword: registeredPassword,
    //     name: faker.person.fullName(),
    //     nationality: 'CITIZEN',
    //     nationalId: faker.string.numeric(10),
    //     gender: 'MALE',
    //     birthDate: faker.date.past({ years: 20 }).toISOString().split('T')[0],
    //     agreeTerms: true
    //   }
    // });
    // Then you'd use a service to fetch the email and extract the link.
  });

  test('會員透過驗證連結完成信箱驗證', async ({ page }) => {
    await test.step('完成會員註冊 (前置條件已完成)', async () => {
      // Assumed done in beforeAll or via a preceding registration test.
      // For this test, we are focusing on the verification link click.
    });

    await test.step('開啟收到的驗證郵件 (模擬點擊連結)', async () => {
      // In a real scenario, this would involve:
      // 1. Using an email client API to fetch emails for `registeredEmail`.
      // 2. Parsing the email body to find the verification URL.
      // For this Playwright script, we directly navigate to the assumed verification URL.
      await page.goto(verificationLink);
    });

    await test.step('預期結果: 系統顯示「信箱驗證成功」訊息', async () => {
      // Assuming successful verification redirects to a success page or shows a toast.
      await page.waitForURL(`${BASE_URL}/verification-success`); // Adjust URL as per actual implementation
      await expect(page.getByRole('heading', { name: '信箱驗證成功' })).toBeVisible();
      await expect(page.getByText('您的電子信箱已成功驗證！您現在可以登入系統。')).toBeVisible(); // Adjust text as needed
    });

    await test.step('預期結果: 會員帳號狀態更新為已驗證 (可透過登入驗證)', async () => {
      // This step implicitly verifies by attempting to log in and checking for an "unverified" state,
      // or directly checking a UI element that indicates verification status post-login.
      // For a standalone test, we can assume the success message is sufficient.
      // In a more integrated test, we might log in and check if an "email not verified" banner is gone.
      await page.goto(`${BASE_URL}/login`);
      await page.getByPlaceholder('請輸入 Email 或帳號').fill(registeredEmail);
      await page.getByLabel('密碼').fill(registeredPassword);
      await page.getByRole('button', { name: '登入' }).click();
      await page.waitForURL(BASE_URL); // Redirected to home after successful login of a verified user
      // Assert no "please verify email" banner is present
      await expect(page.getByText('您的信箱尚未驗證', { exact: false })).not.toBeVisible();
    });
  });
});
```
```typescript
// tests/auth/TC-M-007_forgotPassword.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-007: 忘記密碼', () => {
  // Pre-condition: A valid registered user whose email exists in the system.
  const registeredEmail = 'test_forgot_password@example.com'; 
  const password = 'Password123A';

  test.beforeAll(async ({ request }) => {
    // Ensure the email exists in the system.
    // In a real project, this would involve registering the user via API or a setup fixture.
    // Example:
    // await request.post(`${BASE_URL}/api/register`, {
    //   data: { email: registeredEmail, password: password, ...otherRequiredFields }
    // });
  });

  test('會員透過忘記密碼流程重設密碼', async ({ page }) => {
    await test.step('在登入頁面點擊「忘記密碼？」連結', async () => {
      await page.goto(`${BASE_URL}/login`);
      await expect(page.getByRole('heading', { name: '歡迎回來' })).toBeVisible();
      await page.getByRole('link', { name: '忘記密碼？' }).click();
      await page.waitForURL(`${BASE_URL}/forgot-password`); // Adjust URL if different
    });

    await test.step('輸入已註冊的 Email', async () => {
      await expect(page.getByRole('heading', { name: '忘記密碼' })).toBeVisible();
      await page.getByLabel('電子信箱').fill(registeredEmail); // Assuming the label is '電子信箱'
    });

    await test.step('點擊「送出」按鈕', async () => {
      await page.getByRole('button', { name: '送出' }).click();
    });

    await test.step('預期結果: 系統顯示「重設密碼郵件已發送」訊息', async () => {
      // Assuming a success message or toast appears, and possibly redirection.
      await expect(page.getByText('重設密碼郵件已發送，請檢查您的信箱。')).toBeVisible(); // Adjust text as per actual implementation
      // Optionally, check for redirection to a confirmation page or back to login
      await page.waitForURL(`${BASE_URL}/login?message=reset_password_sent`); // Example URL after sending reset email
    });
  });
});
```
```typescript
// tests/event/TC-M-010_eventListNormalLoad.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-010: 賽事列表 — 正常載入', () => {
  test('會員瀏覽賽事列表頁', async ({ page }) => {
    await test.step('點擊 Header 導覽列「賽事列表」連結', async () => {
      await page.goto(BASE_URL); // Start from homepage
      await page.getByRole('link', { name: '賽事列表' }).click(); // Assuming '賽事列表' is a link in the header
      await page.waitForURL(`${BASE_URL}/events`); // Adjust URL as per actual implementation
    });

    await test.step('頁面顯示「賽事列表」標題', async () => {
      await expect(page.getByRole('heading', { name: '賽事列表' })).toBeVisible();
    });

    await test.step('頂部篩選區域包含「關鍵字搜尋」、「賽事類別」、「賽事狀態」、「地區」下拉選單和「搜尋」按鈕', async () => {
      await expect(page.getByPlaceholder('搜尋賽事名稱、主辦方...')).toBeVisible();
      await expect(page.getByLabel('賽事類別')).toBeVisible(); // Assuming a <select> or custom dropdown with label
      await expect(page.getByLabel('賽事狀態')).toBeVisible();
      await expect(page.getByLabel('地區')).toBeVisible();
      await expect(page.getByRole('button', { name: '搜尋' })).toBeVisible();
    });

    await test.step('等待頁面載入完成', async () => {
      // Playwright's auto-waiting handles most dynamic content, but a specific wait might be beneficial
      await page.waitForLoadState('networkidle'); 
    });

    await test.step('預期結果: 頁面以卡片格狀佈局顯示賽事，每張卡片包含預期元素', async () => {
      // Check for at least one event card to ensure list is populated
      const eventCard = page.locator('.event-card').first(); // Assuming a class 'event-card' for each card
      await expect(eventCard).toBeVisible();

      // Check for expected elements within the first card
      await expect(eventCard.locator('img[alt="橫幅圖片"]')).toBeVisible(); // Assuming an alt text for banner image
      await expect(eventCard.locator('h3')).toBeVisible(); // Assuming event name is an h3
      await expect(eventCard.getByText('主辦方與地點', { exact: false })).toBeVisible();
      await expect(eventCard.getByText('日期', { exact: false })).toBeVisible();
      await expect(eventCard.getByText('報名進度條', { exact: false })).toBeVisible(); // Placeholder for progress bar text
      await expect(eventCard.getByText('報名費', { exact: false })).toBeVisible();
      await expect(eventCard.getByRole('button', { name: '立即報名', exact: false })).toBeVisible(); // Check for a status button

      // Implicitly check: Only display published and non-expired events.
      // This is hard to assert without specific test data setup and knowing expired/unpublished states.
      // For now, we assume the backend handles this filtering correctly and what is visible meets the criteria.
    });
  });
});
```
```typescript
// tests/event/TC-M-011_eventListKeywordSearch.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-011: 賽事列表 — 關鍵字搜尋', () => {
  const keyword = '籃球'; // A keyword that should yield results
  const noResultKeyword = '不存在的賽事名稱XYZ'; // A keyword that should yield no results

  test.beforeAll(async ({ request }) => {
    // Pre-condition: Ensure there are events containing "籃球" in their name/description
    // and potentially some that don't, for comprehensive testing.
  });

  test('會員使用關鍵字搜尋賽事 - 有結果', async ({ page }) => {
    await test.step('進入賽事列表頁面', async () => {
      await page.goto(`${BASE_URL}/events`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: '賽事列表' })).toBeVisible();
    });

    await test.step(`在「關鍵字搜尋」輸入框輸入關鍵字「${keyword}」`, async () => {
      await page.getByPlaceholder('搜尋賽事名稱、主辦方...').fill(keyword);
    });

    await test.step('點擊「搜尋」按鈕', async () => {
      await page.getByRole('button', { name: '搜尋' }).click();
      await page.waitForLoadState('networkidle');
    });

    await test.step('預期結果: 頁面顯示資訊提示列顯示搜尋結果數量', async () => {
      const infoBar = page.locator('.info-bar'); // Assuming a class for the info bar
      await expect(infoBar).toBeVisible();
      await expect(infoBar).toContainText('搜尋結果'); // Expecting text like "搜尋結果 (X筆)"
      await expect(infoBar).toHaveCSS('border-left', '4px solid rgb(76, 175, 80)'); // Check green left border (example color)
    });

    await test.step(`預期結果: 列表僅顯示名稱或描述包含「${keyword}」的賽事卡片`, async () => {
      const eventCards = page.locator('.event-card'); // Assuming a class 'event-card' for each card
      const cardCount = await eventCards.count();
      expect(cardCount).toBeGreaterThan(0); // Expect at least one result

      for (let i = 0; i < cardCount; i++) {
        const cardText = await eventCards.nth(i).textContent();
        expect(cardText?.includes(keyword)).toBeTruthy(); // Or more specific locator for title/description
      }
    });
  });

  test('會員使用關鍵字搜尋賽事 - 無結果', async ({ page }) => {
    await test.step('進入賽事列表頁面', async () => {
      await page.goto(`${BASE_URL}/events`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: '賽事列表' })).toBeVisible();
    });

    await test.step(`在「關鍵字搜尋」輸入框輸入關鍵字「${noResultKeyword}」`, async () => {
      await page.getByPlaceholder('搜尋賽事名稱、主辦方...').fill(noResultKeyword);
    });

    await test.step('點擊「搜尋」按鈕', async () => {
      await page.getByRole('button', { name: '搜尋' }).click();
      await page.waitForLoadState('networkidle');
    });

    await test.step('預期結果: 若無符合結果，顯示「無搜尋結果」提示', async () => {
      await expect(page.getByText('無搜尋結果', { exact: true })).toBeVisible();
      // Ensure no event cards are visible
      await expect(page.locator('.event-card')).toHaveCount(0);
    });
  });
});
```
```typescript
// tests/event/TC-M-012_eventListStatusFilter.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-012: 賽事列表 — 狀態篩選', () => {
  const filterStatus = '報名中'; // The status to filter by

  test.beforeAll(async ({ request }) => {
    // Pre-condition: Ensure there are events with '報名中' status.
  });

  test('會員透過狀態篩選賽事', async ({ page }) => {
    await test.step('進入賽事列表頁面', async () => {
      await page.goto(`${BASE_URL}/events`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: '賽事列表' })).toBeVisible();
    });

    await test.step(`在「賽事狀態」下拉選單選擇「${filterStatus}」`, async () => {
      // Assuming it's a native <select> element
      await page.getByLabel('賽事狀態').selectOption({ label: filterStatus });
      // If it's a custom dropdown, you'd click to open, then click the option:
      // await page.getByLabel('賽事狀態').click();
      // await page.getByRole('option', { name: filterStatus }).click();
    });

    await test.step('點擊「搜尋」按鈕', async () => {
      await page.getByRole('button', { name: '搜尋' }).click();
      await page.waitForLoadState('networkidle');
    });

    await test.step(`預期結果: 列表僅顯示狀態為「${filterStatus}」的賽事卡片`, async () => {
      const eventCards = page.locator('.event-card'); // Assuming a class 'event-card' for each card
      const cardCount = await eventCards.count();
      expect(cardCount).toBeGreaterThan(0); // Expect at least one result

      for (let i = 0; i < cardCount; i++) {
        const card = eventCards.nth(i);
        // Assuming the status is indicated by a visible text or a status tag on the card
        await expect(card.getByText(filterStatus, { exact: true })).toBeVisible();
        // Also check for the specific button style for "報名中"
        await expect(card.getByRole('button', { name: '立即報名' })).toBeVisible();
        await expect(card.getByRole('button', { name: '立即報名' })).toHaveCSS('background-color', /rgb\(76, 175, 80\)/); // Example green color
      }
    });
  });
});
```
```typescript
// tests/event/TC-M-013_eventListLoadMore.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-013: 賽事列表 — 載入更多', () => {
  test.beforeAll(async ({ request }) => {
    // Pre-condition: Ensure there are enough events to trigger pagination and "load more" functionality.
  });

  test('會員點擊「觀看更多賽事」載入更多賽事', async ({ page }) => {
    await test.step('進入賽事列表頁面，已載入第一批賽事卡片', async () => {
      await page.goto(`${BASE_URL}/events`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: '賽事列表' })).toBeVisible();
      // Get initial count of event cards
      await page.locator('.event-card').first().waitFor({ state: 'visible' }); // Ensure at least one card is loaded
      const initialCardCount = await page.locator('.event-card').count();
      expect(initialCardCount).toBeGreaterThan(0);
      test.info(`Initial event cards loaded: ${initialCardCount}`);
    });

    let initialCardCount = await page.locator('.event-card').count(); // Re-get count for robustness

    await test.step('向下滾動至頁面底部', async () => {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      // Ensure the "觀看更多賽事" button is in view
      await page.getByRole('button', { name: '觀看更多賽事' }).waitFor({ state: 'visible' });
    });

    await test.step('點擊「觀看更多賽事」按鈕', async () => {
      await page.getByRole('button', { name: '觀看更多賽事' }).click();
      // Wait for new content to load, e.g., by waiting for network to be idle or for new cards to appear
      await page.waitForLoadState('networkidle');
      // Or wait for a specific number of cards to appear, or for the button to disappear/reappear if it has a loading state.
    });

    await test.step('預期結果: 新賽事卡片附加在現有列表下方', async () => {
      const newCardCount = await page.locator('.event-card').count();
      expect(newCardCount).toBeGreaterThan(initialCardCount);
      test.info(`New event cards loaded: ${newCardCount - initialCardCount}`);

      // Optional: Verify that the old cards are still there and new ones are appended
      // This might require storing identifiers of initial cards.
    });

    await test.step('預期結果: 若無更多資料，「觀看更多賽事」按鈕隱藏 (Optional)', async () => {
      // To properly test this, you'd need to click "觀看更多賽事" until all data is loaded.
      // For this test case, we just check if it's still visible for now, assuming more data is available.
      // If after the click, all data is loaded, the button should be hidden.
      const loadMoreButton = page.getByRole('button', { name: '觀看更多賽事' });
      const isButtonVisible = await loadMoreButton.isVisible();
      if (!isButtonVisible) {
        test.info('「觀看更多賽事」按鈕已隱藏，表示沒有更多資料。');
      } else {
        test.info('「觀看更多賽事」按鈕仍可見，表示可能還有更多資料。');
      }
      // If we clicked and expected no more data:
      // await expect(loadMoreButton).not.toBeVisible();
    });
  });
});
```
```typescript
// tests/event/TC-M-014_eventListCategoryFilter.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-014: 賽事列表 — 類別篩選', () => {
  const filterCategory = '籃球'; // The category to filter by

  test.beforeAll(async ({ request }) => {
    // Pre-condition: Ensure there are events belonging to the '籃球' category.
  });

  test('會員依賽事類別篩選', async ({ page }) => {
    await test.step('進入賽事列表頁面', async () => {
      await page.goto(`${BASE_URL}/events`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: '賽事列表' })).toBeVisible();
    });

    await test.step(`在「賽事類別」下拉選單選擇「${filterCategory}」`, async () => {
      // Assuming it's a native <select> element
      await page.getByLabel('賽事類別').selectOption({ label: filterCategory });
      // If it's a custom dropdown, you'd click to open, then click the option:
      // await page.getByLabel('賽事類別').click();
      // await page.getByRole('option', { name: filterCategory }).click();
    });

    await test.step('點擊「搜尋」按鈕', async () => {
      await page.getByRole('button', { name: '搜尋' }).click();
      await page.waitForLoadState('networkidle');
    });

    await test.step(`預期結果: 列表僅顯示籃球類別的賽事卡片`, async () => {
      const eventCards = page.locator('.event-card'); // Assuming a class 'event-card' for each card
      const cardCount = await eventCards.count();
      expect(cardCount).toBeGreaterThan(0); // Expect at least one result

      for (let i = 0; i < cardCount; i++) {
        const card = eventCards.nth(i);
        // Assuming the category is displayed as a tag or text within the card
        await expect(card.getByText(filterCategory, { exact: true })).toBeVisible();
      }
    });

    await test.step('預期結果: 篩選器正確顯示已選類別', async () => {
      // For native select, checking the value attribute is enough
      await expect(page.getByLabel('賽事類別')).toHaveValue(filterCategory); // Adjust if value is different from label
      // For custom dropdowns, check the displayed text of the selected option
      // await expect(page.locator('.category-dropdown .selected-option')).toHaveText(filterCategory);
    });
  });
});
```
```typescript
// tests/event/TC-M-015_eventListHotEventsDisplay.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-015: 熱門賽事', () => {
  test.beforeAll(async ({ request }) => {
    // Pre-condition: Ensure there are events with different statuses like '報名中' and '即將開始'.
  });

  test('賽事列表頁顯示熱門賽事 (依狀態顯示對應按鈕/標籤)', async ({ page }) => {
    await test.step('進入賽事列表頁面', async () => {
      await page.goto(`${BASE_URL}/events`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: '賽事列表' })).toBeVisible();
    });

    await test.step('查看卡片列表，確認報名中的賽事卡片上顯示綠色「立即報名」按鈕', async () => {
      // Find a card that is "報名中"
      const registeringEventCard = page.locator('.event-card', { has: page.getByText('報名中', { exact: true }) }).first();
      await expect(registeringEventCard).toBeVisible();
      const registerButton = registeringEventCard.getByRole('button', { name: '立即報名' });
      await expect(registerButton).toBeVisible();
      await expect(registerButton).toHaveCSS('background-color', /rgb\(76, 175, 80\)/); // Example green color for '立即報名'
    });

    await test.step('查看卡片列表，確認即將開始的顯示橘色「即將開始」標籤', async () => {
      // Find a card that is "即將開始"
      const upcomingEventCard = page.locator('.event-card', { has: page.getByText('即將開始', { exact: true }) }).first();
      await expect(upcomingEventCard).toBeVisible();
      const upcomingTag = upcomingEventCard.locator('.status-tag', { hasText: '即將開始' }).first(); // Assuming a class for status tags
      await expect(upcomingTag).toBeVisible();
      await expect(upcomingTag).toHaveCSS('background-color', /rgb\(255, 152, 0\)/); // Example orange color for '即將開始'
    });

    await test.step('預期結果: 賽事卡片依狀態正確顯示對應的按鈕樣式', async () => {
      // This step acts as a summary assertion based on the individual checks above.
      test.info('已驗證「報名中」賽事顯示綠色「立即報名」按鈕。');
      test.info('已驗證「即將開始」賽事顯示橘色「即將開始」標籤。');
    });
  });
});
```
```typescript
// tests/event/TC-M-020_eventDetailsNormalDisplay.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-020: 賽事詳情 — 正常顯示', () => {
  // Pre-condition: An existing event to navigate to.
  // In a real project, this might be created via API or picked from a known list.
  const eventId = 'some-event-id-123'; // Replace with a valid event ID from your system
  const eventName = '2026 春季籃球聯賽'; // Replace with the actual event name

  test.beforeAll(async ({ request }) => {
    // Optional: Ensure the event with eventId exists.
  });

  test('會員查看賽事詳細資訊', async ({ page }) => {
    await test.step('在賽事列表頁面點擊某賽事卡片（或直接導航）', async () => {
      // For direct navigation to simplify the test
      await page.goto(`${BASE_URL}/events/${eventId}`);
      await page.waitForLoadState('networkidle');
    });

    await test.step('頁面顯示賽事詳情頁，上方為全寬橫幅圖片', async () => {
      await expect(page.locator('.event-detail-banner img')).toBeVisible(); // Assuming a banner image element
      await expect(page.locator('.event-detail-banner img')).toHaveAttribute('src', /http/); // Check image source is present
      // Verify main event title
      await expect(page.getByRole('heading', { name: eventName, exact: true })).toBeVisible();
    });

    await test.step('主體區域為左右分欄佈局，並驗證左側欄', async () => {
      const leftSidebar = page.locator('.event-sidebar'); // Assuming a class for the left sidebar
      await expect(leftSidebar).toBeVisible();
      // Check countdown timer
      await expect(leftSidebar.getByText('報名截止倒數', { exact: false })).toBeVisible();
      await expect(leftSidebar.locator('.countdown-timer')).toBeVisible(); // Assuming a class for timer

      // Check navigation menu
      const navMenu = leftSidebar.locator('.event-nav-menu'); // Assuming a class for nav menu
      await expect(navMenu.getByRole('link', { name: '最新公告' })).toBeVisible();
      await expect(navMenu.getByRole('link', { name: '賽事介紹' })).toBeVisible();
      await expect(navMenu.getByRole('link', { name: '競賽項目' })).toBeVisible();
      await expect(navMenu.getByRole('link', { name: '檔案下載' })).toBeVisible();
      await expect(navMenu.getByRole('link', { name: '賽程表' })).toBeVisible();
      await expect(navMenu.getByRole('link', { name: '排名成績' })).toBeVisible();
      await expect(navMenu.getByRole('link', { name: '聯絡主辦方' })).toBeVisible();
    });

    await test.step('預期結果: 右側內容區預設顯示「最新公告」區塊', async () => {
      const rightContentArea = page.locator('.event-content-area'); // Assuming a class for the right content area
      await expect(rightContentArea).toBeVisible();
      await expect(rightContentArea.getByRole('heading', { name: '最新公告' })).toBeVisible();

      // Check for default highlighing of '最新公告' in the sidebar
      const latestAnnouncementLink = page.locator('.event-nav-menu a', { hasText: '最新公告' });
      await expect(latestAnnouncementLink).toHaveClass(/active/); // Assuming 'active' class for highlighed item
    });

    await test.step('預期結果: 右側顯示公告列表，包含標題、內容、發布日期', async () => {
      // Assuming at least one announcement
      const firstAnnouncement = page.locator('.announcement-item').first(); // Assuming a class for announcement items
      await expect(firstAnnouncement).toBeVisible();
      await expect(firstAnnouncement.locator('h4')).toBeVisible(); // Announcement title
      await expect(firstAnnouncement.locator('p')).toBeVisible(); // Announcement content
      await expect(firstAnnouncement.locator('.announcement-date')).toBeVisible(); // Announcement date
    });
  });
});
```
```typescript
// tests/event/TC-M-021_eventDetailsRegistrationCountdown.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-021: 賽事詳情 — 報名倒數計時', () => {
  // Pre-condition: An existing event that is '報名中' and has a future registration deadline.
  const eventIdWithCountdown = 'event-id-with-countdown-456'; // Replace with a valid event ID

  test.beforeAll(async ({ request }) => {
    // Optional: Ensure the event with eventIdWithCountdown exists and has a future registration deadline.
  });

  test('賽事詳情頁顯示報名倒數計時', async ({ page }) => {
    await test.step('進入一個報名中且未截止的賽事詳情頁', async () => {
      await page.goto(`${BASE_URL}/events/${eventIdWithCountdown}`);
      await page.waitForLoadState('networkidle');
    });

    await test.step('查看左側欄頂部的倒數計時器區塊，標題為「🔥 報名截止倒數」', async () => {
      const countdownSection = page.locator('.countdown-section'); // Assuming a class for the countdown section
      await expect(countdownSection).toBeVisible();
      await expect(countdownSection.getByText('🔥 報名截止倒數')).toBeVisible();
    });

    await test.step('觀察倒數計時器顯示的四個方塊（天、時、分、秒）', async () => {
      const countdownTimer = page.locator('.countdown-timer'); // Assuming a class for the timer itself
      await expect(countdownTimer.getByText('天')).toBeVisible();
      await expect(countdownTimer.getByText('時')).toBeVisible();
      await expect(countdownTimer.getByText('分')).toBeVisible();
      await expect(countdownTimer.getByText('秒')).toBeVisible();

      // Check if the actual number values are visible within their respective blocks
      await expect(countdownTimer.locator('.countdown-days .value')).toBeVisible();
      await expect(countdownTimer.locator('.countdown-hours .value')).toBeVisible();
      await expect(countdownTimer.locator('.countdown-minutes .value')).toBeVisible();
      await expect(countdownTimer.locator('.countdown-seconds .value')).toBeVisible();
    });

    await test.step('預期結果: 計時器每秒自動更新 (無法直接驗證每秒更新，但可檢查其動態屬性)', async () => {
      // Direct verification of real-time update is complex for E2E.
      // We can assert initial visibility and assume client-side logic handles updates.
      // If there's a specific visual indicator for update, we could capture and compare.
      // For now, presence and expected format are sufficient.
      test.info('驗證倒數計時器方塊顯示正確，假設其前端邏輯會每秒更新。');
    });

    await test.step('預期結果: 倒數到零時顯示「報名已截止」 (需要特定測試資料或時間模擬)', async () => {
      // To test this accurately, you'd need a mock event whose deadline is very soon
      // or use Playwright's time manipulation features (`page.route` to mock API, `page.clock.setFixedTime`).
      // For this test, we'll only assert its presence if it were an "ended" event.
      // If navigating to an *expired* event:
      // await page.goto(`${BASE_URL}/events/expired-event-id`);
      // await expect(page.locator('.countdown-section').getByText('報名已截止')).toBeVisible();
      test.info('此測試針對倒數計時器的正常顯示，倒數至零的狀態需獨立測試或特定時間配置。');
    });
  });
});
```
```typescript
// tests/event/TC-M-022_eventDetailsCompetitionItems.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-022: 賽事詳情 — 競賽項目列表', () => {
  // Pre-condition: An existing event with multiple competition items.
  const eventIdWithItems = 'event-id-with-multiple-items-789'; // Replace with a valid event ID

  test.beforeAll(async ({ request }) => {
    // Optional: Ensure the event with eventIdWithItems exists and has defined competition items.
  });

  test('賽事詳情頁顯示競賽項目資訊', async ({ page }) => {
    await test.step('進入一個包含多個競賽項目的賽事詳情頁', async () => {
      await page.goto(`${BASE_URL}/events/${eventIdWithItems}`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: '最新公告' })).toBeVisible(); // Default view
    });

    await test.step('點擊左側導覽「競賽項目」選項', async () => {
      await page.locator('.event-nav-menu').getByRole('link', { name: '競賽項目' }).click();
      await page.waitForLoadState('networkidle');
    });

    await test.step('預期結果: 右側內容區切換顯示競賽項目卡片列表', async () => {
      await expect(page.getByRole('heading', { name: '競賽項目', exact: true })).toBeVisible(); // Section title
      const competitionItemsContainer = page.locator('.competition-items-container'); // Assuming a container for items
      await expect(competitionItemsContainer).toBeVisible();
    });

    await test.step('預期結果: 每張項目卡片顯示預期資訊', async () => {
      const firstItemCard = page.locator('.competition-item-card').first(); // Assuming a class for item cards
      await expect(firstItemCard).toBeVisible();

      // Check core info
      await expect(firstItemCard.locator('.item-name')).toBeVisible(); // Item name (e.g., '男子單打')
      await expect(firstItemCard.locator('.item-type-tag', { hasText: '團體項目' }).or(firstItemCard.locator('.item-type-tag', { hasText: '個人項目' }))).toBeVisible(); // Type tag
      await expect(firstItemCard.locator('.item-status-tag', { hasText: '報名中' }).or(firstItemCard.locator('.item-status-tag', { hasText: '已額滿' }))).toBeVisible(); // Status tag

      // Check information section
      await expect(firstItemCard.getByText('比賽日期', { exact: false })).toBeVisible();
      await expect(firstItemCard.getByText('賽制', { exact: false })).toBeVisible();
      await expect(firstItemCard.getByText('報名隊伍數', { exact: false })).toBeVisible(); // Or '報名人數'

      // Check bottom section
      await expect(firstItemCard.getByText('報名費用', { exact: false })).toBeVisible();
      await expect(firstItemCard.getByRole('button', { name: '報名此項目' })).toBeVisible();
    });

    await test.step('預期結果: 點擊「報名此項目」按鈕可進入報名流程', async () => {
      const firstItemCard = page.locator('.competition-item-card').first();
      const registerButton = firstItemCard.getByRole('button', { name: '報名此項目' });
      await expect(registerButton).toBeEnabled(); // Ensure it's clickable

      await registerButton.click();
      await page.waitForURL(`${BASE_URL}/events/${eventIdWithItems}/register/step1*`); // Adjust URL pattern for registration step 1
      await expect(page.getByRole('heading', { name: '步驟 1 / 3：請填寫隊伍與隊員報名資料', exact: false })).toBeVisible();
    });
  });
});
```
```typescript
// tests/registration/TC-M-030_groupRegistrationStep1.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-030: 團體報名 — Step 1 填寫資料', () => {
  // Pre-condition: A user is logged in, and an event with a group competition item exists.
  let loggedInPage;
  const eventId = 'event-id-group-reg-030'; // Replace with a valid event ID
  const competitionItemId = 'comp-item-group-030'; // Replace with a valid competition item ID
  const eventName = '2026 春季籃球聯賽'; // Example event name

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user (simplified for demonstration, typically uses global setup or fixture)
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user@example.com'); // Use a valid test user
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Optional: Ensure the event and competition item exist via API
  });

  test.afterEach(async () => {
    // Teardown: Close the page/context after each test
    await loggedInPage.close();
  });

  test('會員進入報名第一步填寫隊伍與隊員資料', async () => {
    await test.step('從賽事詳情頁競賽項目卡片點擊「報名此項目」按鈕', async () => {
      // Simulate navigating to an event detail page and clicking a competition item's register button
      // For simplicity, directly navigate to Step 1 if URL is predictable
      await loggedInPage.goto(`${BASE_URL}/events/${eventId}/register/step1?itemId=${competitionItemId}`);
      await loggedInPage.waitForLoadState('networkidle');
    });

    await test.step('頁面顯示 3 步驟進度指示器，當前為步驟 1', async () => {
      const stepIndicator = loggedInPage.locator('.registration-steps'); // Assuming a class for the step indicator
      await expect(stepIndicator.getByText('① 填寫資料')).toBeVisible();
      await expect(stepIndicator.getByText('② 確認繳費')).toBeVisible();
      await expect(stepIndicator.getByText('③ 完成報名')).toBeVisible();
      // Check for 'active' or 'current' state of step 1
      await expect(stepIndicator.locator('.step-item.active', { hasText: '填寫資料' })).toBeVisible();
    });

    await test.step('顯示報名標題與副標題', async () => {
      await expect(loggedInPage.getByRole('heading', { name: `${eventName}報名` })).toBeVisible();
      await expect(loggedInPage.getByText('步驟 1 / 3：請填寫隊伍與隊員報名資料')).toBeVisible();
    });

    const teamName = faker.word.noun() + '戰隊';
    const captainName = faker.person.fullName();
    const contactEmail = faker.internet.email().toLowerCase();
    const contactPhone = faker.phone.number('09#-#######');
    const memberName = faker.person.fullName();
    const memberEmail = faker.internet.email().toLowerCase();
    const memberPhone = faker.phone.number('09#-#######');
    const memberId = faker.string.numeric(10);

    await test.step('填寫「隊伍基本資料」區塊', async () => {
      await expect(loggedInPage.getByRole('heading', { name: '隊伍基本資料' })).toBeVisible();
      await loggedInPage.getByLabel('隊伍名稱').fill(teamName);
      await loggedInPage.getByLabel('隊長姓名').fill(captainName);
      await loggedInPage.getByLabel('聯絡信箱').fill(contactEmail);
      await loggedInPage.getByLabel('聯絡電話').fill(contactPhone);
      await expect(loggedInPage.getByRole('button', { name: '匯入隊伍資料' })).toBeVisible(); // Check button presence
    });

    await test.step('填寫「隊員資料」區塊 (假設只需填寫一名隊員為例)', async () => {
      await expect(loggedInPage.getByRole('heading', { name: '隊員資料' })).toBeVisible();
      // Assuming fields are structured with an index or unique selector per member
      await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('姓名').fill(memberName); // First member
      await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('信箱').fill(memberEmail);
      await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('電話').fill(memberPhone);
      await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('身份證字號').fill(memberId);
    });

    await test.step('點擊「下一步：確認繳費」按鈕', async () => {
      await loggedInPage.getByRole('button', { name: '下一步：確認繳費' }).click();
    });

    await test.step('預期結果: 頁面正確顯示各欄位，必填欄位標示紅色星號 *，並進入 Step 2', async () => {
      // Check for asterisk for a specific field, e.g., '隊伍名稱*'
      await expect(loggedInPage.getByLabel('隊伍名稱').locator('xpath=./following-sibling::span[text()="*"]')).toBeVisible(); // Assuming asterisk is a sibling span

      // Check URL for Step 2 or a unique element on Step 2
      await loggedInPage.waitForURL(`${BASE_URL}/events/${eventId}/register/step2*`);
      await expect(loggedInPage.getByText('步驟 2 / 3：請確認以下資訊並選擇付款方式')).toBeVisible();
    });
  });
});
```
```typescript
// tests/registration/TC-M-031_groupRegistrationStep1RequiredFieldsValidation.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-031: 報名 Step 1 — 必填欄位驗證', () => {
  // Pre-condition: A user is logged in, and an event with a group competition item exists.
  let loggedInPage;
  const eventId = 'event-id-reg-031'; // Replace with a valid event ID
  const competitionItemId = 'comp-item-reg-031'; // Replace with a valid competition item ID

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user@example.com'); // Use a valid test user
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('報名 Step 1 未填寫必填欄位時阻擋', async () => {
    await test.step('進入報名 Step 1 頁面', async () => {
      await loggedInPage.goto(`${BASE_URL}/events/${eventId}/register/step1?itemId=${competitionItemId}`);
      await loggedInPage.waitForLoadState('networkidle');
      await expect(loggedInPage.getByText('步驟 1 / 3：請填寫隊伍與隊員報名資料')).toBeVisible();
    });

    await test.step('不填寫任何必填欄位 (如隊伍名稱、隊長姓名、隊員姓名等)', async () => {
      // Fields are left intentionally empty.
      // We can optionally fill non-required fields if they exist, to ensure only required ones block.
      // For this test, we leave all required fields empty.
    });

    await test.step('點擊「下一步：確認繳費」按鈕', async () => {
      await loggedInPage.getByRole('button', { name: '下一步：確認繳費' }).click();
    });

    await test.step('預期結果: 各未填寫的必填欄位顯示錯誤提示', async () => {
      // Assuming error messages appear below or next to the respective fields.
      // These locators need to be adapted to your actual error message implementation.
      await expect(loggedInPage.locator('label:has-text("隊伍名稱") + .error-message')).toBeVisible(); // Example error for team name
      await expect(loggedInPage.locator('label:has-text("隊長姓名") + .error-message')).toBeVisible(); // Example error for captain name
      await expect(loggedInPage.locator('div.team-member-form:nth-of-type(1) label:has-text("姓名") + .error-message')).toBeVisible(); // Example error for first member name
      // Add more assertions for other critical required fields
    });

    await test.step('預期結果: 不允許進入 Step 2，頁面保留在 Step 1', async () => {
      await expect(loggedInPage).toHaveURL(`${BASE_URL}/events/${eventId}/register/step1*`); // Should remain on step 1 URL
      await expect(loggedInPage.getByText('步驟 1 / 3：請填寫隊伍與隊員報名資料')).toBeVisible();
      await expect(loggedInPage.getByText('步驟 2 / 3：請確認以下資訊並選擇付款方式')).not.toBeVisible(); // Ensure Step 2 is not visible
    });
  });
});
```
```typescript
// tests/registration/TC-M-032_groupRegistrationStep2Submit.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-032: 報名 Step 2 — 確認資料與提交', () => {
  // Pre-condition: A user is logged in, and has completed Step 1 of registration.
  let loggedInPage;
  const eventId = 'event-id-reg-032'; // Replace with a valid event ID
  const competitionItemId = 'comp-item-reg-032'; // Replace with a valid competition item ID
  const eventName = '2026 春季籃球聯賽';
  const teamName = faker.word.noun() + '戰隊';
  const captainName = faker.person.fullName();
  const contactEmail = faker.internet.email().toLowerCase();
  const contactPhone = faker.phone.number('09#-#######');
  const memberName = faker.person.fullName();
  const memberEmail = faker.internet.email().toLowerCase();
  const memberPhone = faker.phone.number('09#-#######');
  const memberId = faker.string.numeric(10);

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user@example.com');
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Navigate to Step 1 and fill in data to proceed to Step 2
    await loggedInPage.goto(`${BASE_URL}/events/${eventId}/register/step1?itemId=${competitionItemId}`);
    await loggedInPage.waitForLoadState('networkidle');

    await loggedInPage.getByLabel('隊伍名稱').fill(teamName);
    await loggedInPage.getByLabel('隊長姓名').fill(captainName);
    await loggedInPage.getByLabel('聯絡信箱').fill(contactEmail);
    await loggedInPage.getByLabel('聯絡電話').fill(contactPhone);
    await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('姓名').fill(memberName);
    await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('信箱').fill(memberEmail);
    await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('電話').fill(memberPhone);
    await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('身份證字號').fill(memberId);
    await loggedInPage.getByRole('button', { name: '下一步：確認繳費' }).click();
    await loggedInPage.waitForURL(`${BASE_URL}/events/${eventId}/register/step2*`);
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('會員報名 Step 2 確認資料並提交訂單', async () => {
    await test.step('完成 Step 1，進入 Step 2，進度指示器步驟 1 顯示打勾、步驟 2 為當前狀態', async () => {
      const stepIndicator = loggedInPage.locator('.registration-steps');
      await expect(stepIndicator.locator('.step-item.completed', { hasText: '填寫資料' })).toBeVisible(); // Assuming 'completed' class
      await expect(stepIndicator.locator('.step-item.active', { hasText: '確認繳費' })).toBeVisible();
    });

    await test.step('頁面顯示「確認報名資料」標題，副標題「步驟 2 / 3：請確認以下資訊並選擇付款方式」', async () => {
      await expect(loggedInPage.getByRole('heading', { name: '確認報名資料' })).toBeVisible();
      await expect(loggedInPage.getByText('步驟 2 / 3：請確認以下資訊並選擇付款方式')).toBeVisible();
    });

    await test.step('確認「賽事資訊」區塊', async () => {
      const eventInfoBlock = loggedInPage.locator('.event-info-block'); // Assuming a class for this block
      await expect(eventInfoBlock).toBeVisible();
      await expect(eventInfoBlock).toContainText('賽事名稱');
      await expect(eventInfoBlock).toContainText('報名項目');
      await expect(eventInfoBlock).toContainText('比賽日期');
      await expect(eventInfoBlock).toContainText('報名截止日');
      await expect(eventInfoBlock).toContainText(eventName); // Check for actual event name
    });

    await test.step('確認「繳費資訊」區塊', async () => {
      const paymentInfoBlock = loggedInPage.locator('.payment-info-block'); // Assuming a class for this block
      await expect(paymentInfoBlock).toBeVisible();
      await expect(paymentInfoBlock).toContainText('報名費用');
      await expect(paymentInfoBlock).toContainText('服務費');
      await expect(paymentInfoBlock).toContainText('應付總額');
      await expect(paymentInfoBlock.locator('.total-amount')).toBeVisible(); // Check for a specific total amount display
    });

    await test.step('在「選擇付款方式」區塊選擇付款方式（銀行轉帳/ATM）', async () => {
      // Assuming radio buttons are styled as cards
      await loggedInPage.getByLabel('銀行轉帳/ATM').check(); // Select a payment method
      await expect(loggedInPage.getByLabel('銀行轉帳/ATM')).toBeChecked();
    });

    await test.step('勾選「我已閱讀並同意報名條款與規則」checkbox', async () => {
      await loggedInPage.getByLabel('我已閱讀並同意報名條款與規則').check();
    });

    await test.step('點擊「確認送出」按鈕', async () => {
      await loggedInPage.getByRole('button', { name: '確認送出' }).click();
    });

    await test.step('預期結果: 訂單建立成功，系統導向報名完成頁（Step 3）', async () => {
      await loggedInPage.waitForURL(`${BASE_URL}/events/${eventId}/register/step3*`); // Adjust URL pattern for registration step 3
      await expect(loggedInPage.getByRole('heading', { name: '報名成功！' })).toBeVisible();
    });
  });
});
```
```typescript
// tests/registration/TC-M-033_groupRegistrationStep2UntickedTerms.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-033: 報名 Step 2 — 未同意條款', () => {
  // Pre-condition: A user is logged in, and has completed Step 1 of registration.
  let loggedInPage;
  const eventId = 'event-id-reg-033'; // Replace with a valid event ID
  const competitionItemId = 'comp-item-reg-033'; // Replace with a valid competition item ID

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user@example.com');
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Navigate to Step 1 and fill in data to proceed to Step 2
    await loggedInPage.goto(`${BASE_URL}/events/${eventId}/register/step1?itemId=${competitionItemId}`);
    await loggedInPage.waitForLoadState('networkidle');

    // Fill minimal required data for Step 1
    await loggedInPage.getByLabel('隊伍名稱').fill(faker.word.noun() + '戰隊');
    await loggedInPage.getByLabel('隊長姓名').fill(faker.person.fullName());
    await loggedInPage.getByLabel('聯絡信箱').fill(faker.internet.email().toLowerCase());
    await loggedInPage.getByLabel('聯絡電話').fill(faker.phone.number('09#-#######'));
    await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('姓名').fill(faker.person.fullName());
    await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('電話').fill(faker.phone.number('09#-#######'));
    await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('身份證字號').fill(faker.string.numeric(10));
    
    await loggedInPage.getByRole('button', { name: '下一步：確認繳費' }).click();
    await loggedInPage.waitForURL(`${BASE_URL}/events/${eventId}/register/step2*`);
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('會員未勾選同意條款時無法提交報名', async () => {
    await test.step('完成 Step 1，進入 Step 2', async () => {
      // Pre-condition met by beforeEach
      await expect(loggedInPage.getByText('步驟 2 / 3：請確認以下資訊並選擇付款方式')).toBeVisible();
    });

    await test.step('選擇付款方式（銀行轉帳/ATM、信用卡、現場繳費）', async () => {
      await loggedInPage.getByLabel('銀行轉帳/ATM').check(); // Select any payment method
      await expect(loggedInPage.getByLabel('銀行轉帳/ATM')).toBeChecked();
    });

    await test.step('不勾選「我已閱讀並同意報名條款與規則」checkbox', async () => {
      // Ensure it's not checked. If default is checked, uncheck it.
      await loggedInPage.getByLabel('我已閱讀並同意報名條款與規則').uncheck();
      await expect(loggedInPage.getByLabel('我已閱讀並同意報名條款與規則')).not.toBeChecked();
    });

    await test.step('點擊「確認送出」按鈕', async () => {
      await loggedInPage.getByRole('button', { name: '確認送出' }).click();
    });

    await test.step('預期結果: 系統彈出「請先勾選同意報名條款」提示', async () => {
      // Assuming a toast message or an inline error near the checkbox
      await expect(loggedInPage.getByText('請先勾選同意報名條款')).toBeVisible(); // Adjust text as per actual implementation
    });

    await test.step('預期結果: 報名不會送出，頁面保留在 Step 2', async () => {
      await expect(loggedInPage).toHaveURL(`${BASE_URL}/events/${eventId}/register/step2*`);
      await expect(loggedInPage.getByText('步驟 2 / 3：請確認以下資訊並選擇付款方式')).toBeVisible();
      await expect(loggedInPage.getByRole('heading', { name: '報名成功！' })).not.toBeVisible(); // Ensure not on Step 3
    });
  });
});
```
```typescript
// tests/registration/TC-M-034_registrationCompletionPage.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-034: 報名完成頁', () => {
  // Pre-condition: A user has successfully completed Step 1 and Step 2 of registration.
  let loggedInPage;
  const eventId = 'event-id-reg-034';
  const competitionItemId = 'comp-item-reg-034';
  const eventName = '2026 春季籃球聯賽';
  const teamName = faker.word.noun() + '戰隊';
  const orderNumber = 'BS-2026-001234'; // Example order number

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user@example.com');
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Simulate completion of Step 1 & 2 to reach Step 3
    // This part would be an actual registration flow in a real test suite or direct API call.
    // For this specific test, we can directly navigate to a mock Step 3 URL if predictable
    // or quickly run through steps 1 and 2 if the flow is stable and fast.

    // Quick run-through of Step 1 & 2:
    await loggedInPage.goto(`${BASE_URL}/events/${eventId}/register/step1?itemId=${competitionItemId}`);
    await loggedInPage.waitForLoadState('networkidle');
    await loggedInPage.getByLabel('隊伍名稱').fill(teamName);
    await loggedInPage.getByLabel('隊長姓名').fill(faker.person.fullName());
    await loggedInPage.getByLabel('聯絡信箱').fill(faker.internet.email().toLowerCase());
    await loggedInPage.getByLabel('聯絡電話').fill(faker.phone.number('09#-#######'));
    await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('姓名').fill(faker.person.fullName());
    await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('電話').fill(faker.phone.number('09#-#######'));
    await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('身份證字號').fill(faker.string.numeric(10));
    await loggedInPage.getByRole('button', { name: '下一步：確認繳費' }).click();
    await loggedInPage.waitForURL(`${BASE_URL}/events/${eventId}/register/step2*`);
    await loggedInPage.getByLabel('銀行轉帳/ATM').check();
    await loggedInPage.getByLabel('我已閱讀並同意報名條款與規則').check();
    await loggedInPage.getByRole('button', { name: '確認送出' }).click();
    await loggedInPage.waitForURL(`${BASE_URL}/events/${eventId}/register/step3*`);
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('報名成功後顯示確認頁面', async () => {
    await test.step('成功提交報名，系統導向報名完成頁（Step 3）', async () => {
      // Pre-condition met by beforeEach
      await expect(loggedInPage).toHaveURL(`${BASE_URL}/events/${eventId}/register/step3*`);
    });

    await test.step('預期結果: 進度指示器三步驟皆顯示完成', async () => {
      const stepIndicator = loggedInPage.locator('.registration-steps');
      await expect(stepIndicator.locator('.step-item.completed', { hasText: '填寫資料' })).toBeVisible();
      await expect(stepIndicator.locator('.step-item.completed', { hasText: '確認繳費' })).toBeVisible();
      await expect(stepIndicator.locator('.step-item.completed', { hasText: '完成報名' })).toBeVisible();
    });

    await test.step('預期結果: 頁面顯示綠色打勾圖示、「報名成功！」標題', async () => {
      await expect(loggedInPage.locator('.success-icon')).toBeVisible(); // Assuming a success icon
      await expect(loggedInPage.getByRole('heading', { name: '報名成功！' })).toBeVisible();
    });

    await test.step('預期結果: 顯示報名編號', async () => {
      await expect(loggedInPage.getByText(`報名編號：${orderNumber}`)).toBeVisible(); // Adjust locator/text
    });

    await test.step('預期結果: 顯示資訊區塊', async () => {
      const infoBlock = loggedInPage.locator('.order-summary-info'); // Assuming a class for the info block
      await expect(infoBlock).toBeVisible();
      await expect(infoBlock).toContainText('賽事名稱');
      await expect(infoBlock).toContainText(eventName);
      await expect(infoBlock).toContainText('參賽隊伍');
      await expect(infoBlock).toContainText(teamName);
      await expect(infoBlock).toContainText('報名日期');
      await expect(infoBlock).toContainText('繳費金額');
      await expect(infoBlock).toContainText('繳費狀態'); // e.g., '待付款'
    });

    await test.step('預期結果: 底部顯示三個操作按鈕', async () => {
      await expect(loggedInPage.getByRole('button', { name: '查看我的報名' })).toBeVisible();
      await expect(loggedInPage.getByRole('button', { name: '查看賽事詳情' })).toBeVisible();
      await expect(loggedInPage.getByRole('button', { name: '瀏覽更多賽事' })).toBeVisible();
    });
  });
});
```
```typescript
// tests/registration/TC-M-035_groupRegistrationMultipleMembers.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-035: 團隊報名 — 多位隊員', () => {
  // Pre-condition: A user is logged in, and an event with a group competition item requiring multiple members exists.
  let loggedInPage;
  const eventId = 'event-id-group-multi-035'; // Replace with a valid event ID
  const competitionItemId = 'comp-item-group-multi-035'; // Replace with a valid competition item ID
  const requiredMembers = 3; // Assuming the competition requires 3 members (e.g., '至少 3 人')

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user@example.com');
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Optional: Ensure the event and competition item exist and require `requiredMembers`
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('會員進行團隊報名，填寫多位隊員資料', async () => {
    await test.step('從賽事詳情頁點擊需團隊報名的項目「報名此項目」按鈕 (直接導航到Step 1)', async () => {
      await loggedInPage.goto(`${BASE_URL}/events/${eventId}/register/step1?itemId=${competitionItemId}`);
      await loggedInPage.waitForLoadState('networkidle');
      await expect(loggedInPage.getByText('步驟 1 / 3：請填寫隊伍與隊員報名資料')).toBeVisible();
    });

    await test.step('填寫「隊伍基本資料」', async () => {
      await loggedInPage.getByLabel('隊伍名稱').fill(faker.word.noun() + '聯隊');
      await loggedInPage.getByLabel('隊長姓名').fill(faker.person.fullName());
      await loggedInPage.getByLabel('聯絡信箱').fill(faker.internet.email().toLowerCase());
      await loggedInPage.getByLabel('聯絡電話').fill(faker.phone.number('09#-#######'));
    });

    await test.step('在「隊員資料」區塊填寫多位隊員的資料', async () => {
      // Assert that the correct number of team member forms are present
      const memberForms = loggedInPage.locator('.team-member-form'); // Assuming a class for each member's form block
      await expect(memberForms).toHaveCount(requiredMembers);

      for (let i = 0; i < requiredMembers; i++) {
        const memberForm = memberForms.nth(i);
        await expect(memberForm.locator('.member-number')).toContainText(`${i + 1}`); // Check member number display (e.g., '①', '②')

        await memberForm.getByLabel('姓名').fill(faker.person.fullName());
        // For demonstration, email and phone are optional in spec, but ID is required.
        // If email/phone are required, they should be filled too.
        await memberForm.getByLabel('信箱').fill(faker.internet.email().toLowerCase());
        await memberForm.getByLabel('電話').fill(faker.phone.number('09#-#######'));
        await memberForm.getByLabel('身份證字號').fill(faker.string.numeric(10));
      }
    });

    await test.step('點擊「下一步：確認繳費」', async () => {
      await loggedInPage.getByRole('button', { name: '下一步：確認繳費' }).click();
    });

    await test.step('預期結果: 驗證隊員人數在限制範圍內，填寫完成後可進入 Step 2', async () => {
      // This implicitly checks the validation. If validation fails, it won't proceed.
      await loggedInPage.waitForURL(`${BASE_URL}/events/${eventId}/register/step2*`);
      await expect(loggedInPage.getByText('步驟 2 / 3：請確認以下資訊並選擇付款方式')).toBeVisible();
    });
  });
});
```
```typescript
// tests/registration/TC-M-036_registrationFullCapacity.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-036: 報名 — 名額已滿', () => {
  // Pre-condition: An event with a specific competition item that is "名額已滿".
  const eventIdFull = 'event-id-full-capacity-036'; // Replace with an event ID where an item is full

  test.beforeAll(async ({ request }) => {
    // Optional: Ensure this event and a full competition item exist.
    // This often involves setting up test data with capacity limits and existing registrations.
  });

  test('會員嘗試報名名額已滿的項目', async ({ page }) => {
    await test.step('進入賽事詳情頁，點擊左側導覽「競賽項目」', async () => {
      await page.goto(`${BASE_URL}/events/${eventIdFull}`);
      await page.waitForLoadState('networkidle');
      await page.locator('.event-nav-menu').getByRole('link', { name: '競賽項目' }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: '競賽項目', exact: true })).toBeVisible();
    });

    await test.step('找到一個正取與候補名額皆已滿的項目卡片', async () => {
      // Assuming there's a specific competition item that is full.
      // We'll target the card that represents this item.
      const fullItemCard = page.locator('.competition-item-card', { hasText: '已額滿' }).first(); // Assuming '已額滿' text appears on the card
      await expect(fullItemCard).toBeVisible();
    });

    await test.step('查看卡片上的報名按鈕狀態', async () => {
      const fullItemCard = page.locator('.competition-item-card', { hasText: '已額滿' }).first();
      const registerButton = fullItemCard.getByRole('button', { name: '報名此項目' }).or(fullItemCard.getByRole('button', { name: '已額滿' }));

      await expect(registerButton).toBeVisible();
    });

    await test.step('預期結果: 報名按鈕顯示為「已額滿」且不可點擊（灰色禁用狀態）', async () => {
      const fullItemCard = page.locator('.competition-item-card', { hasText: '已額滿' }).first();
      const registerButton = fullItemCard.getByRole('button', { name: '已額滿' }); // Assuming the button text changes to '已額滿'

      await expect(registerButton).toBeVisible();
      await expect(registerButton).toBeDisabled(); // Button should be disabled
      await expect(registerButton).toHaveCSS('background-color', /rgb\(158, 158, 158\)/); // Example gray color for disabled
    });
  });
});
```
```typescript
// tests/registration/TC-M-037_registrationDeadlinePassed.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-037: 報名 — 報名截止', () => {
  // Pre-condition: An event whose registration deadline has already passed.
  const eventIdExpired = 'event-id-expired-deadline-037'; // Replace with an event ID where deadline passed

  test.beforeAll(async ({ request }) => {
    // Optional: Ensure this event exists and its registration deadline is in the past.
  });

  test('會員嘗試報名已截止的賽事', async ({ page }) => {
    await test.step('進入一個已超過報名截止日期的賽事詳情頁', async () => {
      await page.goto(`${BASE_URL}/events/${eventIdExpired}`);
      await page.waitForLoadState('networkidle');
      await expect(page.getByText('報名已截止')).toBeVisible(); // This might appear in the countdown or as a general status
    });

    await test.step('查看左側倒數計時器顯示狀態', async () => {
      const countdownSection = page.locator('.countdown-section'); // Assuming a class for the countdown section
      await expect(countdownSection).toBeVisible();
      await expect(countdownSection.getByText('報名已截止')).toBeVisible(); // Check for specific text
      await expect(countdownSection.getByText('🔥 報名截止倒數')).not.toBeVisible(); // Ensure countdown is not active
    });

    await test.step('點擊左側導覽「競賽項目」，查看項目卡片上的報名按鈕', async () => {
      await page.locator('.event-nav-menu').getByRole('link', { name: '競賽項目' }).click();
      await page.waitForLoadState('networkidle');
      await expect(page.getByRole('heading', { name: '競賽項目', exact: true })).toBeVisible();
    });

    await test.step('預期結果: 報名按鈕顯示為「報名已截止」且不可點擊', async () => {
      const expiredItemCard = page.locator('.competition-item-card').first(); // Check any competition item card
      const registerButton = expiredItemCard.getByRole('button', { name: '報名已截止' }); // Assuming button text changes

      await expect(registerButton).toBeVisible();
      await expect(registerButton).toBeDisabled(); // Button should be disabled
      await expect(registerButton).toHaveCSS('background-color', /rgb\(158, 158, 158\)/); // Example gray color
    });
  });
});
```
```typescript
// tests/registration/TC-M-038_registrationAgeRestriction.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-038: 報名 — 年齡限制驗證', () => {
  // Pre-condition: A user is logged in, and an event with a minimum age requirement (e.g., 18 years old) exists.
  let loggedInPage;
  const eventId = 'event-id-age-limit-038'; // Replace with a valid event ID with age restriction
  const competitionItemId = 'comp-item-age-limit-038'; // Replace with a valid competition item ID

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user@example.com');
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Optional: Ensure the event and competition item exist with an age restriction.
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('會員報名時驗證年齡限制', async () => {
    await test.step('進入一個設有最低年齡限制的賽事 (直接導航到Step 1)', async () => {
      await loggedInPage.goto(`${BASE_URL}/events/${eventId}/register/step1?itemId=${competitionItemId}`);
      await loggedInPage.waitForLoadState('networkidle');
      await expect(loggedInPage.getByText('步驟 1 / 3：請填寫隊伍與隊員報名資料')).toBeVisible();
    });

    await test.step('使用一個未達年齡要求的帳號嘗試報名', async () => {
      // Fill team data (required fields)
      await loggedInPage.getByLabel('隊伍名稱').fill(faker.word.noun() + '青年隊');
      const underageBirthday = new Date();
      underageBirthday.setFullYear(underageBirthday.getFullYear() - 17); // Make it 17 years old, under 18
      const formattedUnderageBirthday = underageBirthday.toISOString().split('T')[0];

      // Assuming the captain's age or a specific member's age is checked
      await loggedInPage.getByLabel('隊長姓名').fill(faker.person.fullName());
      await loggedInPage.getByLabel('聯絡信箱').fill(faker.internet.email().toLowerCase());
      await loggedInPage.getByLabel('聯絡電話').fill(faker.phone.number('09#-#######'));
      
      // For the first member (or captain if their birthday is also on the form)
      const memberForm = loggedInPage.locator('div.team-member-form:nth-of-type(1)');
      await memberForm.getByLabel('姓名').fill(faker.person.fullName());
      await memberForm.getByLabel('電話').fill(faker.phone.number('09#-#######'));
      await memberForm.getByLabel('身份證字號').fill(faker.string.numeric(10));
      // Assuming there's a birth date field for team members, or the logged-in user's birth date is used.
      // If there's a birth date field, fill it with an underage date. For this test, assume the '隊長' or '隊員' form has it.
      // If the age check is based on the *logged-in user's* registered birth date, then the `test_user@example.com` would need to be setup as underage.
      // For this test, let's assume a birth date field is present on the member/captain form for in-flow validation.
      await memberForm.getByLabel('出生日期').fill(formattedUnderageBirthday); // Assuming a birth date field here
    });

    await test.step('點擊「下一步：確認繳費」', async () => {
      await loggedInPage.getByRole('button', { name: '下一步：確認繳費' }).click();
    });

    await test.step('預期結果: 系統顯示「不符合年齡限制」的提示訊息', async () => {
      // Assuming an error message appears, either as a toast or inline.
      await expect(loggedInPage.getByText('不符合年齡限制')).toBeVisible(); // Adjust text
    });

    await test.step('預期結果: 不允許完成報名，頁面保留在 Step 1', async () => {
      await expect(loggedInPage).toHaveURL(`${BASE_URL}/events/${eventId}/register/step1*`);
      await expect(loggedInPage.getByText('步驟 1 / 3：請填寫隊伍與隊員報名資料')).toBeVisible();
      await expect(loggedInPage.getByText('步驟 2 / 3：請確認以下資訊並選擇付款方式')).not.toBeVisible();
    });
  });
});
```
```typescript
// tests/registration/TC-M-039_registrationImportTeamData.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-039: 報名 — 匯入隊伍資料', () => {
  // Pre-condition: A user is logged in and has existing team data associated with their account.
  let loggedInPage;
  const eventId = 'event-id-import-team-039'; // Replace with a valid event ID
  const competitionItemId = 'comp-item-import-team-039'; // Replace with a valid competition item ID

  // Example existing team data that should be imported
  const existingTeamName = '我的冠軍隊';
  const existingCaptainName = '王小明';
  const existingContactEmail = 'wang.xiaoming@example.com';
  const existingContactPhone = '0912345678';
  const existingMember1Name = '林大華';
  const existingMember1Email = 'lin.dahua@example.com';
  const existingMember1Phone = '0923456789';
  const existingMember1Id = 'A123456789';

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user. This user must have at least one existing team.
    const context = await browser.newPage();
    await context.goto(`${BASE_URL}/login`);
    await context.getByPlaceholder('請輸入 Email 或帳號').fill('test_user_with_team@example.com'); // Use a user with existing teams
    await context.getByLabel('密碼').fill('Password123A');
    await context.getByRole('button', { name: '登入' }).click();
    await context.waitForURL(BASE_URL);
    loggedInPage = context;

    // Optional: Ensure the event and competition item exist.
    // Also, ensure 'test_user_with_team@example.com' has '我的冠軍隊' registered in the backend.
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('會員在報名 Step 1 匯入現有隊伍資料', async () => {
    await test.step('進入報名 Step 1 頁面', async () => {
      await loggedInPage.goto(`${BASE_URL}/events/${eventId}/register/step1?itemId=${competitionItemId}`);
      await loggedInPage.waitForLoadState('networkidle');
      await expect(loggedInPage.getByText('步驟 1 / 3：請填寫隊伍與隊員報名資料')).toBeVisible();
    });

    await test.step('點擊「隊伍基本資料」區塊右側的「匯入隊伍資料」按鈕', async () => {
      await loggedInPage.getByRole('button', { name: '匯入隊伍資料' }).click();
    });

    await test.step('彈出「選擇要匯入的隊伍」彈窗，顯示現有隊伍列表', async () => {
      const modal = loggedInPage.getByRole('dialog', { name: '選擇要匯入的隊伍' }); // Assuming a dialog role
      await expect(modal).toBeVisible();
      await expect(modal.getByText(existingTeamName)).toBeVisible(); // Check for existing team name in the list
    });

    await test.step('選擇一支隊伍，點擊「確認匯入」按鈕', async () => {
      // Assuming each team in the modal has a radio button or clickable row
      await loggedInPage.getByLabel(existingTeamName).check(); // Select the team
      await loggedInPage.getByRole('button', { name: '確認匯入' }).click();
      await expect(loggedInPage.getByRole('dialog', { name: '選擇要匯入的隊伍' })).not.toBeVisible(); // Modal closes
    });

    await test.step('預期結果: 隊伍名稱、隊長姓名、聯絡資訊自動帶入', async () => {
      await expect(loggedInPage.getByLabel('隊伍名稱')).toHaveValue(existingTeamName);
      await expect(loggedInPage.getByLabel('隊長姓名')).toHaveValue(existingCaptainName);
      await expect(loggedInPage.getByLabel('聯絡信箱')).toHaveValue(existingContactEmail);
      await expect(loggedInPage.getByLabel('聯絡電話')).toHaveValue(existingContactPhone);
    });

    await test.step('預期結果: 隊員資料自動填充至隊員區塊 (假設匯入一隊員)', async () => {
      const firstMemberForm = loggedInPage.locator('div.team-member-form:nth-of-type(1)');
      await expect(firstMemberForm.getByLabel('姓名')).toHaveValue(existingMember1Name);
      await expect(firstMemberForm.getByLabel('信箱')).toHaveValue(existingMember1Email);
      await expect(firstMemberForm.getByLabel('電話')).toHaveValue(existingMember1Phone);
      await expect(firstMemberForm.getByLabel('身份證字號')).toHaveValue(existingMember1Id);
    });

    await test.step('預期結果: 使用者可修改匯入的資料', async () => {
      const newTeamName = '新隊伍名稱';
      await loggedInPage.getByLabel('隊伍名稱').fill(newTeamName);
      await expect(loggedInPage.getByLabel('隊伍名稱')).toHaveValue(newTeamName);
    });
  });
});
```
```typescript
// tests/payment/TC-M-040_uploadPaymentProof.spec.ts
import { test, expect } from '@playwright/test';
import * as path from 'path';
import { faker } from '@faker-js/faker';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-040: 上傳付款憑證', () => {
  // Pre-condition: A user is logged in and has an order in '待付款' status.
  let loggedInPage;
  const orderId = 'order-id-to-upload-proof-040'; // Replace with a valid order ID

  // Create a dummy valid image file for upload
  const dummyFilePath = path.join(__dirname, 'dummy-proof.png');

  test.beforeAll(() => {
    // Create a small dummy PNG file
    const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=', 'base64');
    fs.writeFileSync(dummyFilePath, buffer);
  });

  test.afterAll(() => {
    // Clean up the dummy file
    if (fs.existsSync(dummyFilePath)) {
      fs.unlinkSync(dummyFilePath);
    }
  });

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user@example.com');
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Navigate to the order detail or payment upload page
    // Assuming a direct URL to the upload page for a specific order
    await loggedInPage.goto(`${BASE_URL}/my-orders/${orderId}/upload-proof`); // Adjust URL as needed
    await loggedInPage.waitForLoadState('networkidle');
    await expect(loggedInPage.getByRole('heading', { name: '上傳付款憑證' })).toBeVisible(); // Verify page title
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('會員成功上傳付款憑證', async () => {
    await test.step('完成付費賽事報名，取得匯款帳號資訊 (前置條件)', async () => {
      // Assumed done in beforeEach or prior steps. The page should be ready for upload.
      await expect(loggedInPage.getByText('請上傳您的匯款憑證')).toBeVisible(); // Check for upload prompt
    });

    await test.step('線下完成匯款 (前置條件)', async () => {
      // This is an external step, not testable by Playwright directly.
      test.info('假設線下匯款已完成。');
    });

    await test.step('選擇付款憑證圖片（JPG/PNG，≤ 5MB）', async () => {
      const fileInput = loggedInPage.getByLabel('選擇檔案').or(loggedInPage.locator('input[type="file"]')); // Common locators for file input
      await fileInput.setInputFiles(dummyFilePath);
      // Optional: Assert filename displayed
      await expect(loggedInPage.locator('.file-name-display')).toHaveText('dummy-proof.png'); // Assuming a display area for selected file
    });

    await test.step('點擊「上傳」', async () => {
      await loggedInPage.getByRole('button', { name: '上傳' }).click();
    });

    await test.step('預期結果: 系統顯示上傳成功訊息', async () => {
      // Assuming a toast message or inline success message
      await expect(loggedInPage.getByText('付款憑證上傳成功！')).toBeVisible(); // Adjust text as per actual implementation
      // Optionally, wait for a success state to persist or redirect
      await loggedInPage.waitForURL(`${BASE_URL}/my-orders/${orderId}?status=proof_uploaded`); // Example redirection
    });

    await test.step('預期結果: 訂單付款狀態更新為「已上傳憑證」', async () => {
      // This assertion would typically be on the order detail page after redirection
      await expect(loggedInPage.locator('.order-status-tag', { hasText: '已上傳憑證' })).toBeVisible(); // Assuming a status tag
      // Or by checking text content on the page
      await expect(loggedInPage.getByText('繳費狀態：已上傳憑證')).toBeVisible();
    });
  });
});
```
```typescript
// tests/payment/TC-M-041_uploadPaymentProofFileTooLarge.spec.ts
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-041: 上傳付款憑證 — 檔案過大', () => {
  // Pre-condition: A user is logged in and has an order in '待付款' status.
  let loggedInPage;
  const orderId = 'order-id-too-large-proof-041'; // Replace with a valid order ID

  // Create a dummy large image file (> 5MB) for upload
  const dummyLargeFilePath = path.join(__dirname, 'dummy-large-proof.png');

  test.beforeAll(() => {
    // Create a dummy large file (e.g., 6MB of null bytes)
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 0); // 6MB
    fs.writeFileSync(dummyLargeFilePath, largeBuffer);
  });

  test.afterAll(() => {
    // Clean up the dummy file
    if (fs.existsSync(dummyLargeFilePath)) {
      fs.unlinkSync(dummyLargeFilePath);
    }
  });

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user@example.com');
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Navigate to the order detail or payment upload page
    await loggedInPage.goto(`${BASE_URL}/my-orders/${orderId}/upload-proof`); // Adjust URL as needed
    await loggedInPage.waitForLoadState('networkidle');
    await expect(loggedInPage.getByRole('heading', { name: '上傳付款憑證' })).toBeVisible(); // Verify page title
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('會員上傳超過 5MB 的付款憑證', async () => {
    await test.step('進入付款憑證上傳頁面', async () => {
      // Pre-condition met by beforeEach
      await expect(loggedInPage.getByText('請上傳您的匯款憑證')).toBeVisible();
    });

    await test.step('選擇一張大於 5MB 的圖片', async () => {
      const fileInput = loggedInPage.getByLabel('選擇檔案').or(loggedInPage.locator('input[type="file"]'));
      await fileInput.setInputFiles(dummyLargeFilePath);
      await expect(loggedInPage.locator('.file-name-display')).toHaveText('dummy-large-proof.png'); // Assuming a display area
    });

    await test.step('點擊「上傳」', async () => {
      await loggedInPage.getByRole('button', { name: '上傳' }).click();
    });

    await test.step('預期結果: 系統顯示「檔案大小不得超過 5MB」錯誤訊息', async () => {
      // Assuming a toast message or an inline error message
      await expect(loggedInPage.getByText('檔案大小不得超過 5MB', { exact: true })).toBeVisible(); // Adjust text as per actual implementation
    });

    await test.step('預期結果: 上傳不會執行', async () => {
      // Ensure the page remains on the upload page and no redirection or status change occurs
      await expect(loggedInPage).toHaveURL(`${BASE_URL}/my-orders/${orderId}/upload-proof`);
      await expect(loggedInPage.getByText('付款憑證上傳成功！')).not.toBeVisible(); // Ensure success message is not displayed
    });
  });
});
```
```typescript
// tests/payment/TC-M-042_bankAccountInfoDisplay.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-042: 匯款帳號資訊顯示', () => {
  // Pre-condition: A user is logged in and has completed a paid event registration,
  // leading to an order in '待付款' status where bank transfer is the chosen method.
  let loggedInPage;
  const orderId = 'order-id-with-bank-info-042'; // Replace with a valid order ID with bank transfer chosen

  // Example bank transfer information
  const bankName = 'XX銀行';
  const accountNumber = '1234-567-89012345';
  const accountHolder = '競賽咖企業社';

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user@example.com');
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Navigate to the order completion page (Step 3) or the order detail page
    // where bank transfer info would be displayed.
    await loggedInPage.goto(`${BASE_URL}/events/some-event-id/register/step3?orderId=${orderId}`); // Example Step 3 URL
    // OR: await loggedInPage.goto(`${BASE_URL}/my-orders/${orderId}`); // Example Order Detail URL
    await loggedInPage.waitForLoadState('networkidle');
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('付費賽事顯示主辦方匯款帳號', async () => {
    await test.step('完成一個付費賽事的報名 (前置條件)', async () => {
      // Pre-condition met by beforeEach. The page should now display order details.
      await expect(loggedInPage.getByRole('heading', { name: '報名成功！' }).or(loggedInPage.getByRole('heading', { name: '訂單詳情' }))).toBeVisible();
    });

    await test.step('查看報名完成頁或訂單詳情', async () => {
      // Explicitly locate the section where bank info is expected.
      const bankInfoSection = loggedInPage.locator('.bank-transfer-info-block'); // Assuming a class for this block
      await expect(bankInfoSection).toBeVisible();
      await expect(bankInfoSection.getByRole('heading', { name: '匯款資訊' })).toBeVisible(); // Or a specific header
    });

    await test.step('預期結果: 頁面顯示主辦方提供的匯款帳號資訊', async () => {
      const bankInfoSection = loggedInPage.locator('.bank-transfer-info-block');

      // Assert specific text content for bank details
      await expect(bankInfoSection.getByText(`銀行名稱：${bankName}`)).toBeVisible();
      await expect(bankInfoSection.getByText(`帳號：${accountNumber}`)).toBeVisible();
      await expect(bankInfoSection.getByText(`戶名：${accountHolder}`)).toBeVisible();
    });

    await test.step('預期結果: 資訊清楚可讀', async () => {
      // This is subjective, but we can verify visibility and lack of obvious display issues.
      // Asserting specific CSS properties like font-size or color might be done for critical elements.
      await expect(loggedInPage.getByText(`銀行名稱：${bankName}`)).toHaveCSS('font-size', /px/);
      test.info('匯款資訊顯示在頁面上，並可見。');
    });
  });
});
```
```typescript
// tests/orders/TC-M-050_myRegistrationsList.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-050: 我的報名紀錄列表', () => {
  // Pre-condition: A user is logged in and has multiple registration records with various statuses.
  let loggedInPage;

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user. This user must have existing registration records.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user_with_orders@example.com'); // User with orders
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Optional: Ensure test_user_with_orders@example.com has diverse registration records.
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('會員查看個人報名紀錄列表', async () => {
    await test.step('會員已登入且有報名紀錄 (前置條件)', async () => {
      // Verified in beforeEach.
      await expect(loggedInPage.getByLabel('會員選單', { exact: false }).first()).toBeVisible(); // Check login status
    });

    await test.step('點擊 Header 導覽「我的報名」連結', async () => {
      await loggedInPage.getByRole('link', { name: '我的報名' }).click(); // Assuming '我的報名' is a header link
      await loggedInPage.waitForURL(`${BASE_URL}/my-registrations`); // Adjust URL as needed
    });

    await test.step('頁面顯示「我的報名紀錄」標題，副標題「查看您所有的賽事報名狀態與詳細資訊」', async () => {
      await expect(loggedInPage.getByRole('heading', { name: '我的報名紀錄' })).toBeVisible();
      await expect(loggedInPage.getByText('查看您所有的賽事報名狀態與詳細資訊')).toBeVisible();
    });

    await test.step('頂部篩選區域包含「報名狀態」、「賽事名稱」搜尋、「報名時間」下拉選單和「搜尋」按鈕', async () => {
      await expect(loggedInPage.getByLabel('報名狀態')).toBeVisible(); // Dropdown
      await expect(loggedInPage.getByPlaceholder('搜尋賽事名稱...')).toBeVisible(); // Search input
      await expect(loggedInPage.getByLabel('報名時間')).toBeVisible(); // Dropdown
      await expect(loggedInPage.getByRole('button', { name: '搜尋' })).toBeVisible();
    });

    await test.step('預期結果: 以兩欄卡片格狀佈局顯示報名紀錄', async () => {
      const registrationCards = loggedInPage.locator('.registration-card'); // Assuming a class for each card
      await expect(registrationCards.first()).toBeVisible(); // At least one card is visible
      await expect(registrationCards.count()).toBeGreaterThan(0);
      // Optional: Check grid layout CSS property, but often presence is enough for functional test.
    });

    await test.step('預期結果: 每張卡片包含預期資訊與狀態標籤', async () => {
      const firstCard = loggedInPage.locator('.registration-card').first();
      await expect(firstCard.locator('.sport-icon')).toBeVisible(); // Left side sport icon
      await expect(firstCard.locator('.event-name')).toBeVisible(); // Event name
      
      // Check for different status tags
      const statusTags = firstCard.locator('.status-tag'); // Assuming a class for status tags
      await expect(statusTags).toBeVisible();
      
      // Example for '待付款' status:
      const pendingPaymentCard = loggedInPage.locator('.registration-card', { has: loggedInPage.locator('.status-tag', { hasText: '待付款' }) }).first();
      await expect(pendingPaymentCard).toBeVisible();
      await expect(pendingPaymentCard.locator('.status-tag', { hasText: '待付款' })).toHaveCSS('background-color', /rgb\(255, 152, 0\)/); // Example orange

      // Example for '已付款' status:
      const paidCard = loggedInPage.locator('.registration-card', { has: loggedInPage.locator('.status-tag', { hasText: '已付款' }) }).first();
      await expect(paidCard).toBeVisible();
      await expect(paidCard.locator('.status-tag', { hasText: '已付款' })).toHaveCSS('background-color', /rgb\(76, 175, 80\)/); // Example green

      // Check other general info on card
      await expect(firstCard.getByText('項目名稱', { exact: false })).toBeVisible();
      await expect(firstCard.getByText('日期', { exact: false })).toBeVisible();
      await expect(firstCard.getByText('地點', { exact: false })).toBeVisible();
      await expect(firstCard.getByText('訂單編號', { exact: false })).toBeVisible();
      await expect(firstCard.getByText('報名者', { exact: false })).toBeVisible();
      await expect(firstCard.getByText('報名時間', { exact: false })).toBeVisible();
      await expect(firstCard.getByText('報名費用', { exact: false })).toBeVisible();
    });

    await test.step('預期結果: 卡片底部有「查看詳情」與「下載報名表」按鈕', async () => {
      const firstCard = loggedInPage.locator('.registration-card').first();
      await expect(firstCard.getByRole('button', { name: '查看詳情' })).toBeVisible();
      await expect(firstCard.getByRole('button', { name: '下載報名表' })).toBeVisible();
    });
  });
});
```
```typescript
// tests/orders/TC-M-051_registrationDetail.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-051: 報名紀錄詳情', () => {
  // Pre-condition: A user is logged in and has at least one registration record.
  let loggedInPage;
  const orderId = 'some-existing-order-id-051'; // Replace with a valid order ID for testing

  // Example expected data for the detail page
  const expectedEventName = '2026 春季籃球聯賽';
  const expectedCompetitionItem = '男子組';
  const expectedOrderStatus = '已付款';
  const expectedTeamName = '我的冠軍隊';
  const expectedCaptainName = '王小明';
  const expectedMemberName = '林大華';

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user_with_orders@example.com');
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Optional: Ensure the order with orderId exists and has the expected details for verification.
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('會員查看特定報名紀錄詳情', async () => {
    await test.step('從「我的報名紀錄」列表點擊某張卡片的「查看詳情」按鈕', async () => {
      // Directly navigate to the detail page for simplicity.
      await loggedInPage.goto(`${BASE_URL}/my-registrations/${orderId}`); // Adjust URL structure
      await loggedInPage.waitForLoadState('networkidle');
    });

    await test.step('等待詳情頁載入', async () => {
      await expect(loggedInPage.getByRole('heading', { name: '報名詳情' })).toBeVisible(); // Verify page title
    });

    await test.step('預期結果: 顯示訂單編號、賽事名稱、項目、報名狀態', async () => {
      await expect(loggedInPage.getByText(`訂單編號：${orderId}`)).toBeVisible();
      await expect(loggedInPage.getByText(`賽事名稱：${expectedEventName}`)).toBeVisible();
      await expect(loggedInPage.getByText(`報名項目：${expectedCompetitionItem}`)).toBeVisible();
      await expect(loggedInPage.getByText(`報名狀態：${expectedOrderStatus}`)).toBeVisible(); // Or a dedicated status tag
      await expect(loggedInPage.locator('.status-tag', { hasText: expectedOrderStatus })).toBeVisible();
    });

    await test.step('預期結果: 顯示隊伍資訊、隊員資料', async () => {
      await expect(loggedInPage.getByRole('heading', { name: '隊伍資訊' })).toBeVisible();
      await expect(loggedInPage.getByText(`隊伍名稱：${expectedTeamName}`)).toBeVisible();
      await expect(loggedInPage.getByText(`隊長姓名：${expectedCaptainName}`)).toBeVisible();
      // Add more team contact info assertions if desired

      await expect(loggedInPage.getByRole('heading', { name: '隊員資料' })).toBeVisible();
      await expect(loggedInPage.getByText(`隊員 1：${expectedMemberName}`)).toBeVisible(); // Assuming member data is listed
      // Further assertions for member contact/ID if displayed
    });

    await test.step('預期結果: 若已上傳付款憑證，顯示憑證預覽', async () => {
      // This part depends on the order status. If orderId is for a paid order,
      // it's likely a proof was uploaded.
      // Assuming a section like '.payment-proof-preview'
      const paymentProofPreview = loggedInPage.locator('.payment-proof-preview');
      if (expectedOrderStatus === '已付款' || expectedOrderStatus === '已上傳憑證') {
        await expect(paymentProofPreview).toBeVisible();
        await expect(paymentProofPreview.locator('img')).toBeVisible(); // Check for the image element
      } else {
        await expect(paymentProofPreview).not.toBeVisible();
        test.info('訂單狀態不為「已付款」或「已上傳憑證」，不預期顯示憑證預覽。');
      }
    });
  });
});
```
```typescript
// tests/orders/TC-M-052_cancelRegistrationRestriction.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-052: 取消報名限制', () => {
  // Pre-condition: A user is logged in and has an '已付款' (paid and confirmed) registration record.
  let loggedInPage;
  const paidOrderId = 'some-paid-and-confirmed-order-id-052'; // Replace with a valid PAID order ID

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user_with_orders@example.com');
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Optional: Ensure the order with paidOrderId exists and is in '已付款' status.
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('會員無法自行在系統取消已付款報名', async () => {
    await test.step('查看一筆已付款且已確認的訂單', async () => {
      await loggedInPage.goto(`${BASE_URL}/my-registrations/${paidOrderId}`); // Navigate to detail page
      await loggedInPage.waitForLoadState('networkidle');
      await expect(loggedInPage.getByRole('heading', { name: '報名詳情' })).toBeVisible();
      await expect(loggedInPage.getByText('報名狀態：已付款')).toBeVisible(); // Verify status
    });

    await test.step('檢查是否有「取消報名」按鈕', async () => {
      const cancelButton = loggedInPage.getByRole('button', { name: '取消報名' });
      await expect(cancelButton).not.toBeVisible(); // Expect button to not be visible at all
      // If it's visible but disabled, assert:
      // await expect(cancelButton).toBeVisible();
      // await expect(cancelButton).toBeDisabled();
    });

    await test.step('預期結果: 頁面不顯示「取消報名」按鈕或為不可點擊狀態', async () => {
      // Primary assertion is that it's not visible, as per the spec "不顯示「取消報名」按鈕"
      await expect(loggedInPage.getByRole('button', { name: '取消報名' })).not.toBeVisible();
    });

    await test.step('預期結果: 提示需聯繫主辦方處理取消事宜 (Optional, if such a hint exists)', async () => {
      // If there's a specific message, check for it.
      const contactOrganizerMessage = loggedInPage.getByText('如需取消報名，請聯繫主辦方', { exact: false }); // Adjust text
      // await expect(contactOrganizerMessage).toBeVisible();
      test.info('若有「聯繫主辦方」提示，則在此處驗證。');
    });
  });
});
```
```typescript
// tests/accessControl/TC-M-060_unauthenticatedAccessProtectedPage.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-060: 未登入存取受保護頁面', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure the user is logged out before starting the test
    // This can be done by clearing cookies/localStorage or by navigating to logout endpoint
    await page.goto(`${BASE_URL}/logout`); // Assuming a logout endpoint or clearing session
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: '登入' })).toBeVisible(); // Verify logged out state
  });

  test('未登入用戶嘗試存取需授權的頁面', async ({ page }) => {
    await test.step('確認未登入狀態', async () => {
      // Pre-condition met by beforeEach.
      await expect(page.getByRole('button', { name: '登入' })).toBeVisible();
      await expect(page.getByRole('button', { name: '註冊' })).toBeVisible();
      await expect(page.getByLabel('會員選單', { exact: false }).first()).not.toBeVisible(); // No user avatar/menu
    });

    await test.step('直接在瀏覽器輸入「我的報名」頁面 URL', async () => {
      // This is a protected page requiring authentication
      await page.goto(`${BASE_URL}/my-registrations`); // Adjust URL for a protected page
    });

    await test.step('預期結果: 系統自動導向登入頁面', async () => {
      await page.waitForURL(`${BASE_URL}/login*`); // Expect redirection to login page
      await expect(page).toHaveURL(`${BASE_URL}/login`);
    });

    await test.step('預期結果: 不顯示受保護的頁面內容', async () => {
      await expect(page.getByRole('heading', { name: '歡迎回來' })).toBeVisible(); // Check login page content
      await expect(page.getByRole('heading', { name: '我的報名紀錄' })).not.toBeVisible(); // Ensure protected content is NOT visible
    });
  });
});
```
```typescript
// tests/accessControl/TC-M-061_loginSessionTimeout.spec.ts
import { test, expect } from '@playwright/test';
import { Console } from 'console';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-061: 登入逾時', () => {
  // This test case is challenging to implement purely in Playwright E2E
  // without direct control over session expiration on the backend or advanced Playwright features.
  // We will simulate the scenario by:
  // 1. Logging in a user.
  // 2. Simulating a time skip (if possible/supported by framework, or just waiting).
  // 3. Attempting to access a protected page/feature.
  // 4. Asserting redirection to login with an "expired" message.

  let loggedInPage;
  const testUserEmail = 'test_session_timeout@example.com';
  const testUserPassword = 'Password123A';

  test.beforeAll(async ({ request }) => {
    // Ensure test user exists
    // await request.post(`${BASE_URL}/api/register`, { data: { email: testUserEmail, password: testUserPassword, ... } });
  });

  test.beforeEach(async ({ browser }) => {
    // Step 1: Log in a user to establish an active session.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill(testUserEmail);
    await page.getByLabel('密碼').fill(testUserPassword);
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    await expect(page.getByLabel('會員選單', { exact: false }).first()).toBeVisible(); // Verify logged in
    loggedInPage = page;
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('登入逾時後的存取處理', async () => {
    await test.step('會員已登入但登入狀態已逾時', async () => {
      // Simulate session expiry. This typically happens on the server-side.
      // In a real test, this could be achieved by:
      // a) waiting for actual session timeout (long test duration).
      // b) using Playwright's time mocking if the session expiry is client-side based (e.g., JWT expiration check).
      // c) (Most common for backend-controlled sessions) An API call to invalidate the session or directly manipulating server state.
      // For this test, we will *assume* the session has expired by the time we attempt the next action,
      // as if a long time has passed since `beforeEach`.
      // We cannot literally `await page.waitForTimeout(longTimeout)` here.
      test.info('模擬登入會話已逾時 (此步驟假設後端已使會話失效)。');

      // If there's a specific logout API that triggers session invalidation, we might call it.
      // e.g. await loggedInPage.request.post(`${BASE_URL}/api/debug/expire-session`);
    });

    await test.step('嘗試操作需授權的功能（例如查看訂單）', async () => {
      await loggedInPage.goto(`${BASE_URL}/my-registrations`); // Protected page
    });

    await test.step('預期結果: 系統自動導向登入頁面', async () => {
      await loggedInPage.waitForURL(`${BASE_URL}/login*`); // Expect redirection to login page
      await expect(loggedInPage).toHaveURL(`${BASE_URL}/login`);
    });

    await test.step('預期結果: 顯示「登入已過期，請重新登入」訊息', async () => {
      // This message should be visible on the login page after redirection.
      await expect(loggedInPage.getByText('登入已過期，請重新登入')).toBeVisible(); // Adjust text as per actual implementation
      await expect(loggedInPage.getByRole('heading', { name: '歡迎回來' })).toBeVisible(); // Still on login page
    });
  });
});
```
```typescript
// tests/notifications/TC-M-070_registrationConfirmationNotification.spec.ts
import { test, expect } from '@playwright/test';
import { faker } from '@faker-js/faker';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-070: 報名確認通知', () => {
  // Pre-condition: A user is logged in. A successful registration has occurred,
  // which should trigger a notification.
  let loggedInPage;
  const eventId = 'event-id-for-notification-070';
  const competitionItemId = 'comp-item-for-notification-070';
  const eventName = '2026 春季籃球聯賽';
  const teamName = faker.word.noun() + '戰隊';

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user_with_notifications@example.com');
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Perform a successful registration to trigger the notification
    await test.step('完成一筆報名 (前置條件)', async () => {
      await loggedInPage.goto(`${BASE_URL}/events/${eventId}/register/step1?itemId=${competitionItemId}`);
      await loggedInPage.waitForLoadState('networkidle');
      await loggedInPage.getByLabel('隊伍名稱').fill(teamName);
      await loggedInPage.getByLabel('隊長姓名').fill(faker.person.fullName());
      await loggedInPage.getByLabel('聯絡信箱').fill(faker.internet.email().toLowerCase());
      await loggedInPage.getByLabel('聯絡電話').fill(faker.phone.number('09#-#######'));
      await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('姓名').fill(faker.person.fullName());
      await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('電話').fill(faker.phone.number('09#-#######'));
      await loggedInPage.locator('div.team-member-form:nth-of-type(1)').getByLabel('身份證字號').fill(faker.string.numeric(10));
      await loggedInPage.getByRole('button', { name: '下一步：確認繳費' }).click();
      await loggedInPage.waitForURL(`${BASE_URL}/events/${eventId}/register/step2*`);
      await loggedInPage.getByLabel('銀行轉帳/ATM').check();
      await loggedInPage.getByLabel('我已閱讀並同意報名條款與規則').check();
      await loggedInPage.getByRole('button', { name: '確認送出' }).click();
      await loggedInPage.waitForURL(`${BASE_URL}/events/${eventId}/register/step3*`);
      await expect(loggedInPage.getByRole('heading', { name: '報名成功！' })).toBeVisible();
    });
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('會員報名成功後收到通知', async () => {
    await test.step('進入「通知中心」頁面', async () => {
      // Assuming a notification icon in the header or a sidebar link
      await loggedInPage.getByRole('button', { name: '通知' }).click(); // Example: Click notification bell icon
      // Or if it's a dedicated page:
      await loggedInPage.goto(`${BASE_URL}/notifications`); // Adjust URL as needed
      await loggedInPage.waitForLoadState('networkidle');
      await expect(loggedInPage.getByRole('heading', { name: '通知中心' })).toBeVisible();
    });

    await test.step('查看通知列表', async () => {
      const notificationItem = loggedInPage.locator('.notification-item', { hasText: '報名成功通知' }).first(); // Assuming a class for notification items
      await expect(notificationItem).toBeVisible();
    });

    await test.step('預期結果: 通知列表中顯示報名確認通知，包含預期元素', async () => {
      const notificationItem = loggedInPage.locator('.notification-item', { hasText: `您的隊伍 "${teamName}" 已成功報名 ${eventName}` }).first();
      await expect(notificationItem).toBeVisible();
      await expect(notificationItem.locator('.notification-icon.success')).toBeVisible(); // Green circular icon
      await expect(notificationItem.locator('.notification-title')).toHaveText('報名成功通知');
      await expect(notificationItem.locator('.notification-content')).toContainText(`您的隊伍 "${teamName}" 已成功報名 ${eventName}`);
      await expect(notificationItem.locator('.notification-timestamp')).toBeVisible(); // Timestamp like "5分鐘前"

      // Check for unread indicator (green left border)
      await expect(notificationItem).toHaveCSS('border-left', '4px solid rgb(76, 175, 80)'); // Example green color
    });

    await test.step('預期結果: 會員同時收到 Email 通知 (外部驗證)', async () => {
      // This step requires an external email testing service (e.g., Mailosaur, Mailtrap).
      // Playwright can't directly check email inboxes.
      test.info('此步驟需搭配外部服務（如 Mailosaur）驗證 Email 通知。');
    });
  });
});
```
```typescript
// tests/notifications/TC-M-071_paymentReminderNotification.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-071: 付款提醒通知', () => {
  // Pre-condition: A user is logged in. There is an order in '待付款' status
  // and the system has passed the configured reminder threshold to send a notification.
  let loggedInPage;
  const orderIdPendingPayment = 'order-id-pending-payment-071';
  const eventName = '夏季籃球邀請賽';

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user. This user must have a pending payment order.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user_with_notifications@example.com');
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Crucial setup: The test needs an order to be in "待付款" state AND the system
    // to have triggered the reminder. This is typically done via:
    // 1. Creating an order in '待付款' status via API.
    // 2. Advancing system time (if client-side checks) or waiting for a scheduled job (if server-side).
    // For this test script, we will *assume* such a notification has already been generated
    // and is waiting in the user's notification center when the test starts.
    test.info('假設用戶有一個待付款訂單，且系統已發送付款提醒通知。');
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('會員未上傳付款憑證收到提醒', async () => {
    await test.step('會員完成付費賽事報名但未上傳付款憑證 (前置條件)', async () => {
      // Pre-condition met by beforeEach (assumed)
      test.info('前置條件：用戶有待付款訂單。');
    });

    await test.step('等待系統設定的提醒期限 (前置條件)', async () => {
      // This is an external system process not directly testable by Playwright for its timing aspect.
      test.info('前置條件：系統已過提醒期限並發送通知。');
    });

    await test.step('進入「通知中心」頁面', async () => {
      await loggedInPage.goto(`${BASE_URL}/notifications`);
      await loggedInPage.waitForLoadState('networkidle');
      await expect(loggedInPage.getByRole('heading', { name: '通知中心' })).toBeVisible();
    });

    await test.step('預期結果: 會員收到付款提醒通知', async () => {
      const notificationItem = loggedInPage.locator('.notification-item', { hasText: '付款提醒' }).first();
      await expect(notificationItem).toBeVisible();
      await expect(notificationItem.locator('.notification-title')).toHaveText('付款提醒');
      await expect(notificationItem.locator('.notification-content')).toContainText(`您的賽事 ${eventName} 報名費尚未繳交，請盡快完成匯款。`); // Adjust text
    });

    await test.step('預期結果: 通知包含匯款資訊與上傳憑證連結', async () => {
      const notificationItem = loggedInPage.locator('.notification-item', { hasText: '付款提醒' }).first();
      await expect(notificationItem.locator('.notification-content')).toContainText('匯款帳號'); // Check for bank account info
      await expect(notificationItem.getByRole('link', { name: '上傳付款憑證' })).toBeVisible(); // Link to upload page
      await expect(notificationItem.getByRole('link', { name: '上傳付款憑證' })).toHaveAttribute('href', new RegExp(`/my-orders/${orderIdPendingPayment}/upload-proof`));
    });
  });
});
```
```typescript
// tests/notifications/TC-M-072_acceptedRejectedNotification.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-072: 正取/落選通知', () => {
  // Pre-condition: A user is logged in. The user has previously applied for a competition
  // with a '候補' (waiting list) status, and the organizer has now processed the list,
  // resulting in either '正取' (accepted) or '落選' (rejected) status for the user.
  let loggedInPage;
  const acceptedEventName = '春季籃球聯賽';
  const rejectedEventName = '夏季足球錦標賽';
  const teamName = '我的候補隊'; // The team name that was on waiting list

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user. This user needs pre-existing '正取' and '落選' notifications.
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user_with_notifications@example.com');
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Assumption: Notifications for acceptance/rejection are already generated and present.
    test.info('假設用戶已收到正取和落選通知。');
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('候補報名者收到正取或落選通知', async () => {
    await test.step('會員報名一個有候補名額的賽事 (前置條件)', async () => {
      test.info('前置條件：用戶曾報名有候補名額的賽事。');
    });

    await test.step('報名截止後，主辦方決定正取名單 (前置條件)', async () => {
      test.info('前置條件：主辦方已處理候補名單。');
    });

    await test.step('進入「通知中心」頁面', async () => {
      await loggedInPage.goto(`${BASE_URL}/notifications`);
      await loggedInPage.waitForLoadState('networkidle');
      await expect(loggedInPage.getByRole('heading', { name: '通知中心' })).toBeVisible();
    });

    await test.step('預期結果: 正取者收到「恭喜正取」通知', async () => {
      const acceptedNotification = loggedInPage.locator('.notification-item', { hasText: '恭喜正取！' }).first();
      await expect(acceptedNotification).toBeVisible();
      await expect(acceptedNotification.locator('.notification-title')).toHaveText('恭喜正取！');
      await expect(acceptedNotification.locator('.notification-content')).toContainText(`恭喜您的隊伍 ${teamName} 在 ${acceptedEventName} 賽事中已被正取。`); // Adjust text
      await expect(acceptedNotification.locator('.notification-icon.success')).toBeVisible(); // E.g., green checkmark
    });

    await test.step('預期結果: 落選者收到「落選通知」', async () => {
      const rejectedNotification = loggedInPage.locator('.notification-item', { hasText: '落選通知' }).first();
      await expect(rejectedNotification).toBeVisible();
      await expect(rejectedNotification.locator('.notification-title')).toHaveText('落選通知');
      await expect(rejectedNotification.locator('.notification-content')).toContainText(`很抱歉，您的隊伍 ${teamName} 未能入選 ${rejectedEventName} 賽事。`); // Adjust text
      await expect(rejectedNotification.locator('.notification-icon.info')).toBeVisible(); // E.g., blue 'i' icon or similar
    });

    await test.step('預期結果: 通知內容清楚明確', async () => {
      test.info('已驗證正取及落選通知的標題與內容清晰可讀。');
    });
  });
});
```
```typescript
// tests/homepage/TC-M-080_homepageHeroSection.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-080: 首頁 Hero 區塊', () => {
  test('首頁 Hero 區塊正常顯示', async ({ page }) => {
    await test.step('開啟會員入口首頁', async () => {
      await page.goto(BASE_URL);
      await page.waitForLoadState('networkidle');
    });

    await test.step('預期結果: Hero 區塊顯示品牌資訊與統計數據', async () => {
      const heroSection = page.locator('.hero-section'); // Assuming a class for the hero section
      await expect(heroSection).toBeVisible();

      await expect(heroSection.getByRole('heading', { name: 'BSaiLa' })).toBeVisible();
      await expect(heroSection.getByText('您的線上盃賽管理系統')).toBeVisible();

      // Check for platform statistics
      const statsSection = heroSection.locator('.platform-stats'); // Assuming a section for stats
      await expect(statsSection.getByText(/比賽場次：\d+/)).toBeVisible(); // Matches "比賽場次：123"
      await expect(statsSection.getByText(/參賽人次：\d+/)).toBeVisible(); // Matches "參賽人次：456"

      // Check for action buttons
      await expect(heroSection.getByRole('link', { name: '探索賽事' })).toBeVisible();
      await expect(heroSection.getByRole('link', { name: '建立賽事' })).toBeVisible();
    });

    await test.step('預期結果: 下方顯示運動分類導覽列', async () => {
      const categoryNav = page.locator('.sport-category-nav'); // Assuming a class for category navigation
      await expect(categoryNav).toBeVisible();

      // Check for specific category links/buttons
      await expect(categoryNav.getByRole('link', { name: '排球' })).toBeVisible();
      await expect(categoryNav.getByRole('link', { name: '籃球' })).toBeVisible();
      await expect(categoryNav.getByRole('link', { name: '壘球' })).toBeVisible();
      await expect(categoryNav.getByRole('link', { name: '羽球' })).toBeVisible();
      await expect(categoryNav.getByRole('link', { name: '桌球' })).toBeVisible();
      await expect(categoryNav.getByRole('link', { name: '沙排' })).toBeVisible();
      await expect(categoryNav.getByRole('link', { name: '其他' })).toBeVisible();
    });
  });
});
```
```typescript
// tests/homepage/TC-M-081_homepageHeaderSearch.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-081: 首頁搜尋功能', () => {
  const searchKeyword = '籃球'; // Example keyword to search

  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
    await page.waitForLoadState('networkidle');
  });

  test('Header 可展開搜尋框能導向搜尋結果', async ({ page }) => {
    await test.step('在首頁 Header 右側點擊搜尋圖示（放大鏡 icon）', async () => {
      const searchIcon = page.getByRole('button', { name: '搜尋' }).or(page.locator('.search-icon')); // Assuming a search icon button or a class
      await expect(searchIcon).toBeVisible();
      await searchIcon.click();
    });

    await test.step('預期結果: 搜尋框展開，顯示輸入框', async () => {
      const searchInput = page.getByPlaceholder('搜尋盃賽、隊伍、會員...');
      await expect(searchInput).toBeVisible();
      await expect(searchInput).toBeEnabled();
      // Optional: Check for animation-related CSS properties if needed for '流暢'
    });

    await test.step('輸入關鍵字並按 Enter', async () => {
      const searchInput = page.getByPlaceholder('搜尋盃賽、隊伍、會員...');
      await searchInput.fill(searchKeyword);
      await searchInput.press('Enter');
    });

    await test.step('預期結果: 顯示搜尋結果下拉區塊 或 導向搜尋結果頁', async () => {
      // This outcome depends on implementation: overlay vs. full page.
      // Assuming it navigates to a search results page for simplicity.
      await page.waitForURL(`${BASE_URL}/search?q=${encodeURIComponent(searchKeyword)}`); // Adjust URL
      await expect(page.getByRole('heading', { name: `搜尋結果：${searchKeyword}` })).toBeVisible(); // Example search results page title
      // If it's an overlay/dropdown, expect the dropdown to be visible
      // const searchResultsDropdown = page.locator('.search-results-dropdown');
      // await expect(searchResultsDropdown).toBeVisible();
      // await expect(searchResultsDropdown.getByText(searchKeyword, { exact: false })).toBeVisible(); // Check for keyword in results
    });

    await test.step('預期結果: 可點擊 X 按鈕關閉搜尋框 (如果為展開式搜尋)', async () => {
      // This is for an expanded search box on the same page. If it redirects, this step is not applicable.
      // Assuming it's an overlay that can be closed.
      // After redirection, the search box would typically reset or be on the new page.
      if (page.url() === BASE_URL) { // Only if still on the homepage with an overlay
        const closeButton = page.getByRole('button', { name: '關閉搜尋' }).or(page.locator('.search-close-button')); // Example close button
        await expect(closeButton).toBeVisible();
        await closeButton.click();
        await expect(page.getByPlaceholder('搜尋盃賽、隊伍、會員...')).not.toBeVisible(); // Search input should be hidden
      } else {
        test.info('搜尋功能導向新頁面，因此「關閉搜尋框」按鈕在當前頁面不適用。');
      }
    });
  });
});
```
```typescript
// tests/download/TC-M-090_downloadRegistrationForm.spec.ts
import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = 'http://localhost:3000';

test.describe('TC-M-090: 下載報名表', () => {
  // Pre-condition: A user is logged in and has an '已付款' (or '已確認') registration record.
  let loggedInPage;
  const confirmedOrderId = 'some-confirmed-order-id-090'; // Replace with a valid order ID
  const expectedFileName = `registration-form-${confirmedOrderId}.pdf`; // Example file name

  test.beforeEach(async ({ browser }) => {
    // Setup: Log in a user
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('請輸入 Email 或帳號').fill('test_user_with_orders@example.com');
    await page.getByLabel('密碼').fill('Password123A');
    await page.getByRole('button', { name: '登入' }).click();
    await page.waitForURL(BASE_URL);
    loggedInPage = page;

    // Optional: Ensure the order with confirmedOrderId exists and is in a downloadable state.
  });

  test.afterEach(async () => {
    await loggedInPage.close();
  });

  test('會員下載報名表', async () => {
    await test.step('進入「我的報名紀錄」頁面', async () => {
      await loggedInPage.goto(`${BASE_URL}/my-registrations`);
      await loggedInPage.waitForLoadState('networkidle');
      await expect(loggedInPage.getByRole('heading', { name: '我的報名紀錄' })).toBeVisible();
    });

    await test.step('找到一筆已確認的報名紀錄卡片', async () => {
      const orderCard = loggedInPage.locator(`.registration-card[data-order-id="${confirmedOrderId}"]`); // Assuming data-order-id attribute
      await expect(orderCard).toBeVisible();
      await expect(orderCard.locator('.status-tag', { hasText: '已付款' }).or(orderCard.locator('.status-tag', { hasText: '已完成' }))).toBeVisible(); // Ensure it's confirmed
    });

    await test.step('點擊卡片底部的「下載報名表」按鈕', async () => {
      const orderCard = loggedInPage.locator(`.registration-card[data-order-id="${confirmedOrderId}"]`);
      const downloadButton = orderCard.getByRole('button', { name: '下載報名表' });
      await expect(downloadButton).toBeVisible();

      // Start waiting for the download before clicking the button
      const downloadPromise = loggedInPage.waitForEvent('download');
      await downloadButton.click();
      const download = await downloadPromise;

      // Wait for the download process to complete and save the downloaded file
      const downloadsPath = path.resolve(__dirname, 'downloads');
      if (!fs.existsSync(downloadsPath)) {
        fs.mkdirSync(downloadsPath);
      }
      const filePath = path.join(downloadsPath, download.suggestedFilename());
      await download.saveAs(filePath);
      test.info(`Downloaded file to: ${filePath}`);
    });

    await test.step('預期結果: 系統生成並下載報名確認單', async () => {
      // Re-trigger the download to get the `Download` object for assertions
      const downloadPromise = loggedInPage.waitForEvent('download');
      const orderCard = loggedInPage.locator(`.registration-card[data-order-id="${confirmedOrderId}"]`);
      await orderCard.getByRole('button', { name: '下載報名表' }).click();
      const download = await downloadPromise;

      // Check file name
      expect(download.suggestedFilename()).toBe(expectedFileName); // Or check for partial match if dynamic
      // Check file type (MIME type)
      expect(download.mimeType()).toBe('application/pdf'); // Expecting PDF
      // Check file size (ensure it's not empty, but precise size can vary)
      expect(download.url()).toMatch(/\/api\/downloads\/registration-form\//); // Check download URL pattern

      const downloadsPath = path.resolve(__dirname, 'downloads');
      const filePath = path.join(downloadsPath, download.suggestedFilename());
      
      // Verify the file exists locally and has some content (minimal check)
      await download.saveAs(filePath);
      expect(fs.existsSync(filePath)).toBeTruthy();
      expect(fs.statSync(filePath).size).toBeGreaterThan(100); // Expect file to be larger than 100 bytes
    });

    await test.step('預期結果: 確認單包含賽事名稱、項目、隊員資料、訂單編號等 (需人工或專用工具驗證 PDF 內容)', async () => {
      // Directly asserting content within a PDF file requires a separate PDF parsing library.
      // For a pure Playwright E2E test, we verify the download mechanism and file properties.
      // Content verification would typically be a separate, more complex step or manual.
      test.info('PDF 內容的詳細驗證超出 Playwright E2E 腳本的範圍，需搭配 PDF 內容解析工具進行。');
    });
  });
});
```