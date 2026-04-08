import os, sys
import google.generativeai as genai

def ask_gemini(content):
    api_key = os.getenv("AI_API_KEY")
    if not api_key:
        print("❌ 錯誤：找不到 AI_API_KEY")
        sys.exit(1)

    # 設定 API
    genai.configure(api_key=api_key)
    
    # 使用最新的 Flash 模型，這也是你剛才診斷出來可用的模型
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    prompt = f"你是一位專業 QA。請審核以下規格，找出漏洞並產出 Gherkin 腳本：\n\n{content}"
    
    try:
        # 官方 SDK 會自動處理連線細節
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"❌ Gemini SDK 報錯：{str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        result = ask_gemini(f.read())
        print(result)
