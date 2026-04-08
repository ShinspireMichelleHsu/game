1. 自動化流程架構 (GitHub Actions)
我們成功建立了一個名為 AI_QA_Flow 的工作流，實現了 「規格一改，AI 自動審核」 的機制：

觸發機制：設定為當 requirements/ 資料夾下的檔案變動時自動執行，並加上 workflow_dispatch 讓你可以隨時手動點擊執行。

虛擬環境：學會了在 GitHub 的 Ubuntu 伺服器上安裝 Python 環境，並透過 pip install -U google-generativeai 安裝必要的官方工具包。

2. AI 代理人開發 (Python Script)
我們反覆優化了 scripts/qa_agent.py，最終版本是一個具有 「自我診斷功能」 的智慧腳本：

自動偵測模型：代碼會自動詢問 Google 伺服器「現在這個 Key 能用哪個模型」，解決了 404 Not Found 的名稱匹配問題。

SDK 整合：從原始的 HTTP 請求進化到使用 Google 官方 SDK，提高了連線穩定性並能自動處理複雜的通訊協定。

3. API 除錯與權限管理
這是最耗時但也最有收穫的部分，我們一起解決了：

401 Unauthorized：識別出 OpenAI 與 Google Gemini 金鑰的差異，並學會正確設定 GitHub Secrets。

404 Not Found：修正了 API 版本（v1/v1beta）與模型型號之間的對應關係。

429 Rate Limit：理解了免費版 AI API 的流量限制（Quota）以及「等待冷卻」的重要性。

AI QA 機器人能做什麼

1.需求撰寫	你編輯 PRD.md	(等待觸發)
2. 邏輯審查	機器人自動啟動	找出需求中的漏洞（例如：沒考慮到驗證碼逾時）。
3. 腳本產出	查看 Action 日誌	生成 Gherkin 腳本（Given/When/Then 格式）。
4. 持續集成	每次 Commit 存檔	確保測試案例永遠跟隨最新的產品規格。

