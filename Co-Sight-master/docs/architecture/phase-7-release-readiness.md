# Phase 7：发布就绪与最终审计

## 完成标准

- 8 个智能体 ID 唯一，所有已注册工具都能在统一工具目录中找到。
- 三个验收场景覆盖合同审查、争议计算和无材料简单咨询。
- `.env_template` 只包含空密钥占位，不携带真实凭证。
- 原生 `Co-Sight-master-raw` 保持独立且不修改。
- 前端页面按路由懒加载，入口 JavaScript 不再触发 500KB 构建警告。
- 阶段 1–6 的能力、智能体、动态 DAG、结果展示、收敛和交付验收全部可重复运行。
- 评委演示具备主线、备用场景和失败预案。
- Planner 省略 `parallel_groups` 时，由 DAG 层级确定性推导并行组，避免展示与执行语义受模型字段完整性影响。

## 性能结果

路由级代码拆分后，生产构建入口 JavaScript 从约 529KB 降至约 255KB；工作台、回放和管理端页面按需加载，构建不再出现超 500KB 警告。

## 验收入口

```powershell
python tools/validate_phase7_release.py
python scripts/full_chain_audit.py --timeout 180
```

第一条命令执行离线发布契约和阶段回归；第二条命令要求后端服务与模型/API 可用，用于真实在线链路验收。
