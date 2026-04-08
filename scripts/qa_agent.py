import os, sys, requests

def ask_ai(content):
    api_key = os.getenv("AI_API_KEY")
    if not api_key:
        print("❌ 錯誤：找不到 AI_API_KEY")
        sys.exit(1)

    # 改用最通用的 gemini-pro 模型
    # 如果 gemini-1.5-flash 報 404，gemini-pro 通常是保險的選擇
    model_name = "gemini-pro" 
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
    
    headers = {"Content-Type": "application/json"}
    
    # 這是 Gemini 1.0 Pro 的資料格式
    data = {
        "contents": [{
            "parts": [{
                "text": f"你是一位專業軟體 QA。請審核以下規格書，找出漏洞並產出 Gherkin 腳本：\n\n{content}"
            }]
        }]
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        res_json = response.json()
        
        if response.status_code == 200:
            # 成功時回傳結果
            return res_json['candidates'][0]['content']['parts'][0]['text']
        else:
            # 失敗時印出錯誤，幫助診斷
            print(f"❌ API 呼叫失敗！型號：{model_name}, 狀態碼：{response.status_code}")
            print(f"❌ 詳情：{res_json}")
            
            # 如果連 gemini-pro 都 404，我們試試最後一個可能：gemini-1.0-pro
            if response.status_code == 404:
                print("🔄 嘗試最後的備用模型 gemini-1.0-pro...")
                url_alt = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.0-pro:generateContent?key={api_key}"
                response = requests.post(url_alt, json=data, headers=headers)
                if response.status_code == 200:
                    return response.json()['candidates'][0]['content']['parts'][0]['text']

            sys.exit(1)
            
    except Exception as e:
        print(f"❌ 發生意外：{str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        print(ask_ai(f.read()))
