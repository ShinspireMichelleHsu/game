import os, sys, time, random
import google.generativeai as genai

def ask_gemini(content):
    api_key = os.getenv("AI_API_KEY")
    if not api_key: sys.exit(1)
    genai.configure(api_key=api_key)
    
    # 稍微等待，避開流量高峰
    time.sleep(random.uniform(2, 5))
    
    # 嘗試不同的模型名稱寫法
    model_names = [
        "gemini-1.5-flash",        # 簡寫版
        "models/gemini-1.5-flash", # 完整版
        "gemini-pro"               # 備用版
    ]
    
    last_error = ""
    for name in model_names:
        try:
            print(f"🚀 嘗試使用模型：{name}")
            model = genai.GenerativeModel(name)
            prompt = f"你是一位專業自動化測試工程師。請根據以下規格書，產出 Playwright TypeScript 測試腳本。只輸出程式碼，不要 Markdown 格式：\n\n{content}"
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            last_error = str(e)
            print(f"⚠️ {name} 失敗，嘗試下一個...")
            continue
            
    print(f"❌ 所有模型嘗試均失敗。最後錯誤：{last_error}")
    sys.exit(1)

if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        ai_code = ask_gemini(f.read())
        
    os.makedirs('tests', exist_ok=True)
    with open('tests/gen_playwright.spec.ts', 'w', encoding='utf-8') as f:
        f.write(ai_code)
    print("✅ 成功寫入檔案：tests/gen_playwright.spec.ts")
