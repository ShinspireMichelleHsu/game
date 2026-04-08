import os, sys, requests

def diagnose_and_ask(content):
    api_key = os.getenv("AI_API_KEY")
    headers = {"Content-Type": "application/json"}
    
    # 第一步：先列出這個 API Key 到底支援哪些模型
    list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}"
    try:
        list_res = requests.get(list_url)
        models = list_res.json().get('models', [])
        # 過濾出支援 "generateContent" 的模型名稱
        available_models = [m['name'] for m in models if 'generateContent' in m['supportedGenerationMethods']]
        
        if not available_models:
            print(f"❌ 嚴重錯誤：你的 API Key 似乎不支援任何生成模型。")
            print(f"❌ API 回傳：{list_res.json()}")
            sys.exit(1)
            
        # 挑選第一個可用的模型來跑
        target_model = available_models[0]
        print(f"✅ 發現可用模型：{target_model}，正在嘗試調用...")
        
        # 第二步：使用發現的模型進行請求
        # target_model 格式通常是 "models/gemini-pro"
        url = f"https://generativelanguage.googleapis.com/v1beta/{target_model}:generateContent?key={api_key}"
        data = {
            "contents": [{"parts": [{"text": f"你是一位 QA，請分析：\n\n{content}"}]}]
        }
        
        response = requests.post(url, json=data, headers=headers)
        if response.status_code == 200:
            return response.json()['candidates'][0]['content']['parts'][0]['text']
        else:
            print(f"❌ 調用 {target_model} 失敗：{response.json()}")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ 診斷過程發生意外：{str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    file_path = sys.argv[1]
    with open(file_path, 'r', encoding='utf-8') as f:
        print(diagnose_and_ask(f.read()))
