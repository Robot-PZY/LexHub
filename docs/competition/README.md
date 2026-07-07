# 律枢 LexHub 国赛文档索引

本目录用于存放国赛交付文档、补充说明和图表资产。当前正式交付建议以“技术方案文档”和“创新总结报告”两份为主，其余文件作为补充材料或历史素材。

统一命名口径：

| 类型 | 写法 |
|---|---|
| 中文简称 | 律枢 |
| 中英展示名 | 律枢 LexHub |
| 正式全称 | 律枢 LexHub：基于中兴 Co-Sight 的法律业务智能服务平台 |
| 一句话定位 | 面向法律业务的多智能体协同、法规检索、文书生成与过程复核平台 |

## 正式交付文档

| 文档 | 对应赛题要求 | 说明 |
|---|---|---|
| [`lexhub-technical-solution-delivery.md`](./lexhub-technical-solution-delivery.md) | 技术方案文档 | 业务场景、技术架构、核心算法、可信安全、性能评估、功能演示、可运行代码说明 |
| [`lexhub-innovation-summary-delivery.md`](./lexhub-innovation-summary-delivery.md) | 创新总结报告 | 创新点、技术难点、推广应用前景、团队协作经验 |

## 补充材料

| 文档 | 用途 |
|---|---|
| [`lexhub-national-final-presentation.pptx`](./lexhub-national-final-presentation.pptx) | 国赛答辩 PPT 初稿，15 页固定结构，可直接打开继续替换真实系统截图 |
| [`lexhub-vs-cosight-comparison.md`](./lexhub-vs-cosight-comparison.md) | 说明 LexHub 相比原生 Co-Sight 的改造点，可用于答辩补充 |
| [`lexhub-ppt-plan.md`](./lexhub-ppt-plan.md) | 国赛答辩 PPT 方案，包含页码结构、讲解重点、图表建议和分工 |
| [`national-final-documentation-framework.md`](./national-final-documentation-framework.md) | 早期文档框架设计，作为素材参考 |
| [`lexhub-national-final-delivery.md`](./lexhub-national-final-delivery.md) | 早期综合版交付稿，作为素材参考 |
| `technical-solution.md`、`innovation-summary.md` 等 | 早期简版材料，不建议作为最终提交正文 |

## 图表资产

| 目录/文件 | 说明 |
|---|---|
| [`assets/`](./assets/) | 架构图、DAG 图、知识来源图、性能对比图、创新映射图等 SVG 图表 |
| [`assets/screenshots/`](./assets/screenshots/) | 真实页面截图制作说明与截图存放目录 |
| [`figure-data/metrics-baseline.json`](./figure-data/metrics-baseline.json) | 可复现图表的数据口径 |
| [`scripts/generate_research_figures.py`](./scripts/generate_research_figures.py) | 使用标准库生成技术报告风格 SVG 图 |

重新生成可复现图表：

```powershell
python "Co-Sight-master\docs\competition\scripts\generate_research_figures.py"
```

## 工程证据索引

| 能力 | 工程位置 |
|---|---|
| 法律 DAG 工作流 | `Co-Sight-master/config/legal-workflow.json` |
| 智能体角色注册 | `Co-Sight-master/config/agent-registry.json` |
| 法律检索工具 | `Co-Sight-master/app/cosight/tool/legal_search_toolkit.py` |
| 法律知识库服务 | `Co-Sight-master/cosight_server/deep_research/services/legal_kb/` |
| 执行快照 | `Co-Sight-master/cosight_server/deep_research/services/execution_snapshot.py` |
| 审计日志 | `Co-Sight-master/cosight_server/deep_research/services/audit_log.py` |
| 文书导出 | `Co-Sight-master/cosight_server/deep_research/services/document_export.py` |
| 演示测试材料 | `test/` |

## 导出建议

两份正式文档已包含 Markdown 目录。使用 Typora、Pandoc 或其他 Markdown 工具导出 PDF 时，标题层级可生成 PDF 书签；正文目录可用于检查章节顺序。

导出前建议检查：

- 图片路径是否正常显示。
- 表格是否因页面宽度过窄而换行过多。
- 代码块是否保留等宽字体。
- 附录 B 的参考资料仍保持外部资料口径。
- 正文不要加入内部写作说明、截图清单或占位文字。
