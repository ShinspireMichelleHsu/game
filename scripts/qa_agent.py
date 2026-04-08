import os, sys
import google.generativeai as genai

def ask_gemini(content):
    api_key = os.getenv("AI_API_KEY")
    genai.configure(api_key=api_key)
    
    try:
        # 終極招式：直接問 Google 我能用什麼？
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        
        if not available_models:
            print("❌ 錯誤：你的 API Key 權限內沒有任何可用模型。請檢查 Google AI Studio 設定。")
            sys.exit(1)
            
        target = available_models[0] # 自動選第一個活著的模型
        print(f"✅ 找到活的模型：{target}")
        
        model = genai.GenerativeModel(target)
        prompt = f"你是一位自動化測試工程師。請根據以下規格，產出 Playwright TypeScript 腳本。只給程式碼：\n\n{content}"
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        print(f"❌ 發生錯誤：{str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        ai_code = ask_gemini(f.read())
    
    os.makedirs('tests', exist_ok=True)
    with open('tests/gen_playwright.spec.ts', 'w', encoding='utf-8') as f:
        f.write(ai_code)
    print("🎉 任務完成！")
