import os, sys, time
import google.generativeai as genai

def ask_gemini(content):
    api_key = os.getenv("AI_API_KEY")
    genai.configure(api_key=api_key)
    
    # --- 關鍵修正：進入後先強制等待，確保冷卻時間 ---
    print("⏳ 正在進行冷卻等待 (30秒)，避免觸發流量限制...")
    time.sleep(30)
    
    try:
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        target = available_models[0]
        print(f"✅ 使用模型：{target}")
        
        model = genai.GenerativeModel(target)
        prompt = f"你是一位自動化測試工程師。請根據規格產出 Playwright TypeScript 腳本。請確保腳本中包含 test.use({ screenshot: 'only-on-failure', video: 'on' }); 以便記錄測試過程。只給程式碼：\n\n{content}"
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"❌ 錯誤：{str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        ai_code = ask_gemini(f.read())
    
    # --- 新增：清理 AI 產出的 Markdown 標籤 ---
    clean_code = ai_code.replace("```typescript", "").replace("```ts", "").replace("```", "").strip()
    
    os.makedirs('tests', exist_ok=True)
    with open('tests/gen_playwright.spec.ts', 'w', encoding='utf-8') as f:
        f.write(clean_code)  # 存入清理後的純程式碼
    print("✅ 成功寫入乾淨的腳本檔案")
