# LexHub 全链路测试报告（定稿版）

> 更新时间：2026-07-05  
> 状态：**可定稿** — 自动化检查全部通过

## 快速测试命令

```bash
# 综合回归（22 项，推荐定稿前执行）
python scripts/debug_lexhub.py --skip-llm

# 知识库专项
python scripts/test_knowledge_ingest.py
python scripts/test_task_backfill.py

# 管理端模型/API 切换
python scripts/test_admin_model_api_switch.py

# 全链路审计（上传 + 实时 WS + 回放，约 3–4 分钟）
python scripts/full_chain_audit.py --timeout 360

# 仅实时任务流（跳过回放 API）
python scripts/full_chain_audit.py --timeout 360 --skip-replay

# 工作台 WebSocket 端到端
python scripts/e2e_workspace_test.py --timeout 360

# 前端生产构建
cd cosight_frontend && npm run build
```

---

## 定稿自动化结果（2026-07-05）

| 套件 | 结果 | 说明 |
|------|------|------|
| `debug_lexhub.py --skip-llm` | **22/22 PASS** | 环境、Chroma、NPC、混合检索、入库、调度 |
| `test_knowledge_ingest.py` | **PASS** | 文本入库 + 文件上传 + 混合检索 |
| `test_task_backfill.py` | **PASS** | 关键词提取 + 本地有命中时跳过补爬 |
| `full_chain_audit.py --skip-replay` | **12/12 PASS** | 上传 → WS → DAG → legal_search → 完成 |
| `npm run build` | **PASS** | TypeScript + Vite 生产包 |

### Chroma 向量库快照

| 集合 | 数量 |
|------|------|
| statutes（法规条文） | 1261 |
| templates（文书模板） | 3 |
| knowledge（规则/知识） | 7+ |

---

## 功能交付清单

### 管理端运行时配置

- 模型 / API / MCP 写入 `config/runtime/admin_settings.json`
- 任务启动前 `apply_admin_runtime_config()` 生效
- 管理页 **测试连接** + `POST /demo/admin/settings/test`

### 知识库（简化三步方案 — 全部完成）

| 步骤 | 能力 |
|------|------|
| **Step 1** | NPC 种子爬取、bbbs 去重、定时同步（默认关，周日 03:00）、管理页 5 种子 + 关键词 |
| **Step 2** | `POST /knowledge/ingest`、文件上传 txt/md/docx、混合检索含 templates |
| **Step 3** | 任务结束 local=0 → NPC 关键词补爬（`KNOWLEDGE_TASK_BACKFILL_ENABLED`，默认 true） |

### 主链路

```
/workspace 输入 + 上传 + 场景
  → WebSocket → POST /deep-research/search
  → CoSight DAG → legal_search / file_* / tavily 等
  → control-status-message 完成
  → （可选）任务补爬写入 Chroma
  → /workspace/result · /replay
```

---

## 浏览器手动验收（定稿前建议勾选）

- [ ] `/workspace` 上传合同 → 选场景 → 提交
- [ ] `/workspace/run` DAG 三阶段 + `legal_search` 可见
- [ ] `/research` 检索「合同违约」→ 法规 + 本地 + 模板卡片
- [ ] `/admin` 知识库：NPC 同步 / 文件上传 / 定时开关
- [ ] `/admin` 概览：**测试连接** 通过
- [ ] `/documents` LLM 文书生成
- [ ] `/replay` 最新工作区回放

---

## 已知限制（文档说明即可，非阻塞）

| 项 | 说明 |
|----|------|
| Chroma telemetry 警告 | 无害，不影响功能 |
| Google Custom Search | 可能 403，Tavily 正常 |
| `EvidencePage` | 仍为静态展示 |
| 定时爬取 | 默认关闭，需在管理页手动开启 |
| 后端热更新 | 改 Python 后需重启 7788 服务 |

---

## 服务启动

```bash
# 后端（7788）
python cosight_server/deep_research/main.py

# 前端开发
cd cosight_frontend && npm run dev

# 生产静态资源已由后端挂载 /cosight
# http://localhost:7788/cosight/
```

---

## 测试材料

合法样例材料位于仓库根目录 `test/`（5 份 txt + `materials-index.txt`），可用于上传与 NPC/入库联调。
