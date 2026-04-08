import os, sys
import google.generativeai as genai

def ask_gemini(content):
    api_key = os.getenv("AI_API_KEY")
    if not api_key:
        print("❌ 錯誤：找不到 AI_API_KEY")
        sys.exit(1)

    genai.configure(api_key=api_key)
    
    # 使用官方最通用的簡稱，SDK 會自動幫你對應到最新的穩定版
    try:
        print("🚀 正在嘗試使用 gemini-1.5-flash...")
        model = genai.GenerativeModel('gemini-1.5-flash') 
        response = model.generate_content(f"你是一位專業 QA。請審核以下規格，找出漏洞並產出 Gherkin 腳本：\n\n{content}")
        return response.text
    except Exception as e:
        print(f"⚠️ Flash 嘗試失敗，原因：{str(e)}")
        try:
            print("🔄 正在嘗試使用 gemini-pro (1.0 版本)...")
            model_pro = genai.GenerativeModel('gemini-pro')
            response = model_pro.generate_content(f"你是一位專業 QA。請審核規格：\n\n{content}")
            return response.text
        except Exception as e2:
            print(f"❌ 所有模型均呼叫失敗。最後報錯：{str(e2)}")
            sys.exit(1)

if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        result = ask_gemini(f.read())
        print(result)
