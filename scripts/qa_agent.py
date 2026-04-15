import os, sys
import google.generativeai as genai

def ask_gemini(content):
    api_key = os.getenv("AI_API_KEY")
    genai.configure(api_key=api_key)
    
    try:
        # --- 核心改動：自動列出這把 Key 權限內所有可用的生成模型 ---
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        
        if not available_models:
            print("❌ 錯誤：你的 API Key 權限內找不到任何可用模型。")
            sys.exit(1)
            
        # 自動選擇第一個可用的（通常是 1.5-flash 或 gemini-pro）
        target_model = available_models[0]
        print(f"✅ 自動偵測到可用模型：{target_model}")
        
        model = genai.GenerativeModel(target_model)
        prompt = f"你是一位 Playwright 專家。請將以下需求轉換為純 TypeScript 代碼，不要 Markdown 標籤：\n\n{content}"
        
        response = model.generate_content(prompt)
        # 清理可能存在的標籤
        clean = response.text.replace("```typescript", "").replace("```ts", "").replace("```", "").strip()
        return clean
        
    except Exception as e:
        print(f"❌ 發生錯誤: {e}")
        sys.exit(1)

if __name__ == "__main__":
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        code = ask_gemini(f.read())
    os.makedirs('tests', exist_ok=True)
    with open('tests/gen_playwright.spec.ts', 'w', encoding='utf-8') as f:
        f.write(code)
