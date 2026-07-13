# LexHub API 配置清单

所有密钥优先写入项目根目录 `.env`，不要提交到 Git。管理后台也支持将百度 OCR 的 `API Key|Secret Key` 写入当前运行环境。

## 百度智能云 OCR 与文档解析（已接入）

- 产品与开通入口：https://ai.baidu.com/tech/ocr/general
- OCR 控制台：https://console.bce.baidu.com/ai/#/ai/ocr/overview/index
- OCR 文档中心：https://ai.baidu.com/ai-doc/OCR/
- 免费测试资源：https://ai.baidu.com/ai-doc/OCR/fk3h7xu7h
- 高精度通用文字识别：https://ai.baidu.com/ai-doc/OCR/rkibizxtw
- 表格文字识别 V2：https://ai.baidu.com/ai-doc/OCR/Al1zvpylt

需要在控制台创建文字识别应用，取得同一应用的 API Key 和 Secret Key，并确认已开通：

1. 通用文字识别（高精度版）
2. 表格文字识别 V2
3. 印章识别

同一百度应用的凭证可配置给通用 OCR、表格、印章和智能文档解析；具体能力仍需在控制台开通并确认资源包可用。凭证只写入 `.env` 或管理后台，文档与截图中不要展示明文。

```env
BAIDU_OCR_API_KEY=
BAIDU_OCR_SECRET_KEY=
BAIDU_OCR_ENDPOINT=https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic
BAIDU_OCR_TABLE_ENDPOINT=https://aip.baidubce.com/rest/2.0/ocr/v1/table
BAIDU_OCR_SEAL_ENDPOINT=https://aip.baidubce.com/rest/2.0/ocr/v1/seal
BAIDU_OCR_FEATURES=table,seal
BAIDU_OCR_ENRICH_MAX_PAGES=5
BAIDU_DOCUMENT_PARSER_ENABLED=true
```

复杂或扫描 PDF 会优先调用百度“文档解析”，获得标题层级、阅读顺序和 Markdown 表格；接口失败或超时后自动回退到逐页 OCR。

## 已有或后续可选 API

| 能力 | 配置变量 | 当前状态 |
| --- | --- | --- |
| 得理法律检索 | `DELILEGAL_APPID`、`DELILEGAL_SECRET` | 已接入 |
| Tavily 联网搜索 | `TAVILY_API_KEY` | 已接入 |
| Google 搜索 | `GOOGLE_API_KEY`、`SEARCH_ENGINE_ID` | 已接入 |
| 百度 TextReview | `BAIDU_TEXTREVIEW_API_KEY`、`BAIDU_TEXTREVIEW_SECRET_KEY` | 可选外部审查 |
| Langfuse | `LANGFUSE_PUBLIC_KEY`、`LANGFUSE_SECRET_KEY` | 可选可观测性 |
| PaddleOCR | `PADDLE_OCR_ENDPOINT` | 本地降级方案，待接服务端 |

密钥配置完成后，应使用真实图片和扫描 PDF 进行一次连通性测试，检查免费资源、接口权限、QPS 和返回错误码。

## 比赛演示配置优先级

1. 必需：主模型 `API_KEY`、`API_BASE_URL`、`MODEL_NAME`。
2. 强烈建议：百度 OCR/文档解析，用于扫描件、表格和印章材料展示。
3. 建议：得理法律检索；未配置时会降级到本地法规知识库或通用搜索。
4. 可选：Tavily 或 Google 二选一，用于公开资料补充。
5. 可选：Langfuse，仅用于链路观测，不影响核心任务执行。

系统对外部 API 均保留超时、错误事件和本地/模板降级路径。演示前应运行 `python tools/validate_phase7_release.py`，真实联网全链路则运行 `python scripts/full_chain_audit.py --timeout 180`。
