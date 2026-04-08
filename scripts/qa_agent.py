import os, sys
import google.generativeai as genai

def ask_gemini(content):
    api_key = os.getenv("AI_API_KEY")
    if not api_key:
        print("❌ 錯誤：找不到 AI_API_KEY")
        sys.exit(1)

    genai.configure(api_key=api_key)
    
    try:
        # 自動偵測模型
        available_models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]
        if not available_models:
            sys.exit(1)
            
        model = genai.GenerativeModel(available_models[0]) 
        
        # --- 修改指令內容 (Prompt) ---
        prompt = f"""
        你是一位專業的自動化測試工程師。請閱讀以下需求規格書 (PRD)：
        {content}
        
        請根據規格書內容執行以下任務：
        1. 找出潛在的邊界案例 (Edge Cases)。
        2. 針對主要功能流程，撰寫完整的 Playwright (TypeScript) 自動化測試腳本。
        3. 程式碼需包含註解說明，並假設頁面元素使用 data-testid 或 text 進行定位。
        """
        
        response = model.generate_content(prompt)
        return response.text
        
    except Exception as e:
        print(f"❌ 發生錯誤：{str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        result = ask_gemini(f.read())
        print(result)
