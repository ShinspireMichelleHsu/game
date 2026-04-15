import os, sys
import google.generativeai as genai

def ask_gemini(content):
    api_key = os.getenv("AI_API_KEY")
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    
    # 強制模板：要求 AI 填空，而不是寫作文
    prompt = f"""
    你是一位 Playwright 專家。請將以下需求轉換為一個 Playwright 測試。
    
    規則：
    1. 輸出必須是純 TypeScript 程式碼。
    2. 不要 Markdown 區塊（不准有 ```）。
    3. 必須包含截圖指令：await page.screenshot({{ path: 'screenshot.png' }});
    
    需求：
    {content}
    """
    
    try:
        response = model.generate_content(prompt)
        text = response.text
        # 強制清理：防止 AI 不聽話加上 Markdown 標籤
        clean = text.replace("```typescript", "").replace("```ts", "").replace("```", "").strip()
        return clean
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        code = ask_gemini(f.read())
        
    # 確保寫入 tests 目錄
    os.makedirs('tests', exist_ok=True)
    with open('tests/gen_playwright.spec.ts', 'w', encoding='utf-8') as f:
        f.write(code)
    print("Code Generated Successfully")
