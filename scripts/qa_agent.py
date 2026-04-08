import os, sys
import google.generativeai as genai

def ask_gemini(content):
    api_key = os.getenv("AI_API_KEY")
    if not api_key:
        print("❌ 錯誤：找不到 AI_API_KEY")
        sys.exit(1)

    genai.configure(api_key=api_key)
    
    # --- 關鍵修正：換成 1.5 版本，通常免費額度是開給這個版本的 ---
    model = genai.GenerativeModel('gemini-flash') 
    
    prompt = f"你是一位專業 QA。請審核以下規格，找出漏洞並產出 Gherkin 腳本：\n\n{content}"
    
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        # 如果 1.5-flash 也失敗，最後一試：gemini-pro
        try:
            print("🔄 嘗試切換至 gemini-pro...")
            model_pro = genai.GenerativeModel('gemini-pro')
            response = model_pro.generate_content(prompt)
            return response.text
        except:
            print(f"❌ Gemini SDK 報錯：{str(e)}")
            sys.exit(1)

if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        result = ask_gemini(f.read())
        print(result)
