import os, sys, time, random
import google.generativeai as genai

def ask_gemini(content):
    api_key = os.getenv("AI_API_KEY")
    if not api_key: sys.exit(1)
    genai.configure(api_key=api_key)
    
    # 增加隨機等待，避免被 Google 視為機器人攻擊
    time.sleep(random.uniform(5, 10))
    
    # 強制使用 1.5-flash，這是目前免費版最穩定的模型
    model = genai.GenerativeModel('gemini-1.5-flash') 
    
    prompt = f"你是一位專業自動化測試工程師。請根據以下規格書，產出 Playwright TypeScript 測試腳本。只輸出程式碼：\n\n{content}"
    
    try:
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
    print("✅ 成功寫入檔案")
