import os, sys
import google.generativeai as genai

def ask_gemini(content):
    api_key = os.getenv("AI_API_KEY")
    if not api_key:
        print("❌ 錯誤：找不到 AI_API_KEY")
        sys.exit(1)

    genai.configure(api_key=api_key)
    
    try:
        # --- 自動導航開始 ---
        print("🔍 正在偵測你帳號中可用的模型...")
        available_models = []
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                available_models.append(m.name)
        
        if not available_models:
            print("❌ 嚴重錯誤：你的 API Key 雖然正確，但權限內沒有任何可用的生成模型。")
            print("💡 建議：請去 Google AI Studio 重新建立一個新的 API Key。")
            sys.exit(1)
            
        target_model = available_models[0]
        print(f"✅ 找到可用模型：{target_model}，發送請求中...")
        # ------------------

        model = genai.GenerativeModel(target_model) 
        response = model.generate_content(f"你是一位專業 QA。請審核以下規格：\n\n{content}")
        return response.text
        
    except Exception as e:
        print(f"❌ 發生錯誤：{str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        result = ask_gemini(f.read())
        print(result)
