import os, sys
import google.generativeai as genai

def ask_gemini(content):
    api_key = os.getenv("AI_API_KEY")
    genai.configure(api_key=api_key)
    
    # 這裡我們換成 gemini-1.5-flash-latest，這是目前最穩定的名稱
    model = genai.GenerativeModel("gemini-1.5-flash-latest")
    
    prompt = f"你是一位專業 QA 工程師。請將以下需求轉換為 Playwright TypeScript 測試，只輸出純程式碼，不准有 Markdown 標籤：\n\n{content}"
    
    try:
        response = model.generate_content(prompt)
        # 強制過濾 Markdown 標籤，確保 Playwright 讀得懂
        clean_code = response.text.replace("```typescript", "").replace("```ts", "").replace("```", "").strip()
        return clean_code
    except Exception as e:
        # 如果 1.5-flash 不行，最後嘗試一次 gemini-pro
        print(f"嘗試 fallback 到 gemini-pro...")
        model = genai.GenerativeModel("gemini-pro")
        response = model.generate_content(prompt)
        return response.text.replace("```typescript", "").replace("```ts", "").replace("```", "").strip()

if __name__ == "__main__":
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        code = ask_gemini(f.read())
        
    os.makedirs('tests', exist_ok=True)
    with open('tests/gen_playwright.spec.ts', 'w', encoding='utf-8') as f:
        f.write(code)
    print("✅ 檔案生成成功！")
