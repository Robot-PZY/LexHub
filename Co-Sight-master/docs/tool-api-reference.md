# 律枢 LexHub 工具 API 集成说明

> 赛题可选要求：工具封装的标准化接口描述与使用示例。

## 1. 工具分类（满足 ≥3 类）

| 类别 | 代表工具 | 环境变量 / 端点 | 前端入口 |
|------|----------|-----------------|----------|
| 联网搜索 | `tavily_search`, `search_google` | `TAVILY_API_KEY`, `GOOGLE_API_KEY` | `/research` |
| 代码执行 | `execute_code` | 内置 | `/workspace` 工具轨迹 |
| 文档/OCR | `file_upload`, 文档解析 | `POST /api/.../upload/files` | `/evidence` |
| 法规检索 | `legal_rag` | `LEGAL_SEARCH_API_KEY`, `VECTOR_DB_URL` | `/research` |
| 结果导出 | `export` | `DOCX_EXPORT_ENABLED`, `PDF_EXPORT_ENABLED` | `/documents` |

## 2. 材料上传 API

```
POST /api/nae-deep-research/v1/upload/files
Content-Type: multipart/form-data
```

**响应**：文件 ID 列表，供工作台任务引用。

**开发环境**：经 Vite 代理 `5174 → 7788`，避免 CORS。

## 3. Demo API（能力展示）

| 端点 | 说明 |
|------|------|
| `GET /demo/overview` | 产品概览与赛题能力 |
| `GET /demo/workflow-config` | 读取 legal-workflow.json |
| `GET /demo/execution-snapshot?workspace=` | 解析 replay 执行快照 |
| `POST /demo/export-document` | DOCX/PDF 导出（真实执行优先） |
| `GET /demo/toolchain-status` | 工具链就绪状态 |
| `GET /demo/performance-benchmark` | 性能对比数据 |

## 4. Co-Sight 执行（核心）

- **协议**：WebSocket（开发环境直连 `7788`）
- **事件类型**：`lui-message-manus-step`、`lui-message-tool-event`
- **持久化**：`work_space/replay_history/*/replay.json`

## 5. 配置示例（legal-workflow.json 片段）

```json
{
  "tools": [
    { "id": "web_search", "category": "search", "envKeys": ["TAVILY_API_KEY"] },
    { "id": "code_exec", "category": "code", "builtin": true },
    { "id": "file_upload", "category": "document", "endpoint": "/api/nae-deep-research/v1/upload/files" }
  ]
}
```

## 6. 接入新工具（扩展指南）

1. 在 `cosight_server` 注册 Co-Sight 工具实现
2. 在 `legal-workflow.json` 的 `tools` 数组声明
3. 管理端 `/admin/apis` 配置 Key 与端点
4. 前端 `tool-catalog.ts` 补充分类映射
