import os, sys
import google.generativeai as genai

def ask_gemini(content):
    api_key = os.getenv("AI_API_KEY")
    if not api_key:
        print("❌ 錯誤：找不到 AI_API_KEY")
        sys.exit(1)

    genai.configure(api_key=api_key)
    
    try:
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        model = genai.GenerativeModel(available_models[0]) 
        
        prompt = f"你是一位專業自動化測試工程師。請根據以下規格書，產出完整的 Playwright TypeScript 測試腳本。只需輸出程式碼，不要包含任何解釋文字或 Markdown 的包裝符號：\n\n{content}"
        
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        print(f"❌ 發生錯誤：{str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        ai_code = ask_gemini(f.read())
        
    # 建立 tests 資料夾（如果不存在）
    os.makedirs('tests', exist_ok=True)
    
    # 將結果存入檔案
    output_file = 'tests/gen_playwright.spec.ts'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(ai_code)
        
    print(f"✅ 成功將腳本寫入 {output_file}")
