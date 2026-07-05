# 律枢 LexHub · 国赛交付文档索引

> 赛道六开放创新 · 基于 Co-Sight 的法律行业超级智能体示范系统

## 文档清单

| 文档 | 对应赛题要求 | 说明 |
|------|-------------|------|
| [technical-solution.md](./technical-solution.md) | 技术方案文档 | 场景、架构、DAG、工具、可信、性能 |
| [innovation-summary.md](./innovation-summary.md) | 创新总结报告（**必交**） | ≤5 条创新点、难点、推广前景 |
| [demo-script.md](./demo-script.md) | 演示视频脚本 | ≤3 分钟评委演示路线 |
| [submission-checklist.md](./submission-checklist.md) | 提交材料对照 | 赛题硬性要求自查 |
| [tool-api-reference.md](./tool-api-reference.md) | 工具封装说明 | API 集成位与示例 |
| [membership-plan.md](./membership-plan.md) | 商业与会员规划 | 个人三档 + 定制交付 |

## 代码与配置交付物

| 路径 | 说明 |
|------|------|
| `config/legal-workflow.json` | Co-Sight 工作流配置（DAG + 智能体 + 工具） |
| `config/knowledge/legal-knowledge-seed.json` | 知识库/规则库样例 |
| `start-lexhub.bat` | 一键启动脚本 |
| `cosight_frontend/` | React 用户端与管理端 |
| `cosight_server/` | FastAPI 后端与 Demo API |

## 推荐演示入口

1. `/board` — 赛题能力映射、提交就绪度、3 分钟演示路径
2. `/workspace` — 真实 Co-Sight 任务执行
3. `/replay` — 回放与真实执行导出
4. `/admin` — 模型/API/用户会员管理
