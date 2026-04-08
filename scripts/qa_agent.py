import os, sys, requests

def ask_ai(content):
    api_key = os.getenv("AI_API_KEY")
    if not api_key:
        print("❌ 錯誤：GitHub Secrets 中沒有設定 AI_API_KEY")
        sys.exit(1)

    # 嘗試使用 v1 穩定版路徑
    url = f"https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key={api_key}"
    
    headers = {"Content-Type": "application/json"}
    
    data = {
        "contents": [{
            "parts": [{
                "text": f"你是一位專業 QA。請審核以下規格，找出漏洞並產出 Gherkin 腳本：\n\n{content}"
            }]
        }]
    }
    
    try:
        response = requests.post(url, json=data, headers=headers)
        res_json = response.json()
        
        if response.status_code != 200:
            # 如果 v1 失敗，嘗試 v1beta
            print(f"⚠️ v1 嘗試失敗，切換至 v1beta...")
            url_beta = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            response = requests.post(url_beta, json=data, headers=headers)
            res_json = response.json()

        if response.status_code == 200:
            return res_json['candidates'][0]['content']['parts'][0]['text']
        else:
            print(f"❌ API 最終呼叫失敗！狀態碼：{response.status_code}")
            print(f"❌ 錯誤內容：{res_json}")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ 發生意外錯誤：{str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        print(ask_ai(f.read()))
