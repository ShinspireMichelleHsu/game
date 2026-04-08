import os, sys, requests

def ask_ai(content):
    api_key = os.getenv("AI_API_KEY")
    if not api_key:
        print("❌ 錯誤：GitHub Secrets 中沒有設定 AI_API_KEY")
        sys.exit(1)

    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    
    # 使用目前最穩定且便宜的模型
    data = {
        "model": "gpt-4o-mini", 
        "messages": [
            {"role": "system", "content": "你是一位專業 QA，請審核規格並產出 Gherkin 腳本。"},
            {"role": "user", "content": content}
        ]
    }
    
    try:
        response = requests.post("https://api.openai.com/v1/chat/completions", json=data, headers=headers)
        res_json = response.json()
        
        # 如果失敗，印出完整錯誤訊息並停止，這樣我們才能在 GitHub Log 看到原因
        if response.status_code != 200:
            print(f"❌ API 呼叫失敗！狀態碼：{response.status_code}")
            print(f"❌ 錯誤內容：{res_json}")
            sys.exit(1)
            
        return res_json['choices'][0]['message']['content']
    except Exception as e:
        print(f"❌ 發生意外錯誤：{str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        print(ask_ai(f.read()))
