import os
import requests
import sys

# 設定 AI 指令（這就是我們之前討論的角色設定）
SYSTEM_PROMPT = """
你是一位資深軟體品管工程師 (QA)。
請分析使用者提供的規格書內容，並執行以下任務：
1. 找出規格中邏輯模糊或缺失的 Edge Cases。
2. 產出對應的 Gherkin (Given/When/Then) 測試腳本。
請用繁體中文回覆，並保持專業與嚴謹。
"""

def ask_ai(content):
    api_key = os.getenv("AI_API_KEY")
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    data = {
        "model": "gpt-4o", # 確保你的 Key 支援此模型，或改用 "gpt-3.5-turbo"
        "messages": [
            {"role": "system", "content": "你是一位專業 QA，請審核規格並產出 Gherkin 腳本。"},
            {"role": "user", "content": content}
        ]
    }
    response = requests.post("https://api.openai.com/v1/chat/completions", json=data, headers=headers)
    
    # --- 新增這幾行來抓壞蛋 ---
    res_json = response.json()
    if "error" in res_json:
        print(f"AI 報錯了：{res_json['error']['message']}")
        sys.exit(1) # 強制停止
    # -----------------------
    
    return res_json['choices'][0]['message']['content']


if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        prd_content = f.read()
    
    report = ask_ai(prd_content)
    print(report) # 這會輸出到 GitHub 的紀錄中
