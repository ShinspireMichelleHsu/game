import os, sys, requests

def ask_ai(content):
    api_key = os.getenv("AI_API_KEY")
    if not api_key:
        return "錯誤：找不到 API 金鑰，請檢查 GitHub Secrets 設定。"
    
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    
    # 這裡我們換成最通用的 gpt-3.5-turbo，確保相容性
    data = {
        "model": "gpt-3.5-turbo", 
        "messages": [
            {"role": "system", "content": "你是一位專業 QA，請審核規格並產出 Gherkin 腳本。"},
            {"role": "user", "content": content}
        ]
    }
    
    try:
        response = requests.post("https://api.openai.com/v1/chat/completions", json=data, headers=headers)
        res_json = response.json()
        
        # 如果 AI 回傳錯誤訊息，直接印出來
        if "error" in res_json:
            return f"❌ AI 服務報錯：{res_json['error']['message']}"
            
        return res_json['choices'][0]['message']['content']
    except Exception as e:
        return f"❌ 程式執行出錯：{str(e)}"

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("錯誤：未提供 PRD 檔案路徑")
        sys.exit(1)
        
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(f"錯誤：找不到檔案 {file_path}")
        sys.exit(1)
        
    with open(file_path, 'r', encoding='utf-8') as f:
        print(ask_ai(f.read()))
