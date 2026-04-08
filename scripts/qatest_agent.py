import os, sys, requests

def ask_ai(content):
    api_key = os.getenv("AI_API_KEY")
    headers = {"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
    data = {
        "model": "gpt-4o", # 確保模型名稱正確
        "messages": [
            {"role": "system", "content": "你是一位專業 QA，請審核規格並產出 Gherkin 腳本。"},
            {"role": "user", "content": content}
        ]
    }
    response = requests.post("https://api.openai.com/v1/chat/completions", json=data, headers=headers)
    return response.json()['choices'][0]['message']['content']

if __name__ == "__main__":
    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        print(ask_ai(f.read()))
