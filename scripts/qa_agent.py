import os, sys, time
import google.generativeai as genai

def ask_gemini(content):
    api_key = os.getenv("AI_API_KEY")
    genai.configure(api_key=api_key)
    
    # 增加穩定性等待
    time.sleep(5)
    
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    # 修改 Prompt，強制 AI 加入截圖代碼
    prompt = f"""你是一位專業的 QA 工程師。請根據以下 PRD 產出 Playwright TypeScript 測試。
    
    要求：
    1. 只能輸出程式碼，不要 Markdown 標籤。
    2. 在每個關鍵步驟（如 click, goto）後，加入 await page.screenshot({{ path: 'screenshot.png' }}); 
    3. 確保包含 import {{ test, expect }} from '@playwright/test';
    
    PRD 內容：
    {content}
    """
    
    try:
        response = model.generate_content(prompt)
        # 剝掉可能出現的 Markdown 標籤
        return response.text.replace("```typescript", "").replace("```ts", "").replace("```", "").strip()
    except Exception as e:
        print(f"❌ AI 請求失敗: {e}")
        sys.exit(1)

if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        clean_code = ask_gemini(f.read())
        
    os.makedirs('tests', exist_ok=True)
    with open('tests/gen_playwright.spec.ts', 'w', encoding='utf-8') as f:
        f.write(clean_code)
    print("✅ 成功寫入乾淨的測試腳本")
