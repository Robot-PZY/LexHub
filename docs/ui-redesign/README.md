# LexHub UI Redesign Plan

本目录用于沉淀 LexHub UI 全面优化方案。当前阶段只做方案设计，不改动前端实现。

## 目标

LexHub 的 UI 改版目标不是简单美化，而是建立一套可持续演进的法律业务智能工作台设计体系：

- 让用户清楚完成“事项受理 -> 材料上传 -> 智能体办理 -> 审查结论 -> 文书导出 -> 回放归档”的闭环。
- 让 AI 办理过程透明可追溯，突出智能体、证据、法条、工具调用和审计链。
- 让管理后台像可靠的配置控制台，而不是展示型页面。
- 让 Figma 设计稿、设计 token、React 组件和 CSS 变量保持一致。

## 推荐路线

LexHub 采用混合式设计体系：

- GitHub Primer：专业工具感、高密度工作流、可访问性、状态与导航。
- Figma SDS：Variables、Components、设计与代码同步方法。
- Radix UI / shadcn/ui：可访问交互组件、源码可控的组件封装思想。
- Ant Design：企业后台的信息架构、配置页和数据表格模式。
- LexHub 自身业务：法律文书、证据链、智能体 DAG、审查报告、知识库导入。

## 阶段文档

1. [00 项目审计与基线](./phase-00-audit-baseline.md)
2. [01 参考体系与竞品研究](./phase-01-reference-research.md)
   - [01 Figma Reference Board 施工清单](./phase-01-figma-reference-board.md)
3. [02 设计原则与产品信息架构](./phase-02-principles-ia.md)
   - [02 导航与页面地图](./phase-02-navigation-map.md)
4. [03 Figma 设计系统](./phase-03-figma-design-system.md)
   - [03 Token 规格与映射](./phase-03-token-spec.md)
   - [03 组件 Variants 规格](./phase-03-component-variants.md)
5. [04 核心页面高保真](./phase-04-key-screens.md)
   - [04 P0 页面规格](./phase-04-screen-specs.md)
   - [04 Figma 高保真验收清单](./phase-04-figma-checklist.md)
6. [05 前端设计系统落地](./phase-05-frontend-system.md)
   - [05 前端实施清单](./phase-05-implementation-checklist.md)
   - [05 CSS 收敛策略](./phase-05-css-migration-strategy.md)
   - [05 实施记录](./phase-05-implementation-log.md)
7. [06 核心业务页迁移](./phase-06-core-pages.md)
   - [06 页面迁移矩阵](./phase-06-migration-matrix.md)
8. [07 管理后台迁移](./phase-07-admin-console.md)
   - [07 管理端迁移矩阵](./phase-07-admin-migration-matrix.md)
9. [08 验收、打磨与回归](./phase-08-qa-polish.md)
   - [08 截图回归矩阵](./phase-08-screenshot-matrix.md)
   - [08 UI 验收报告模板](./phase-08-qa-report-template.md)

## 配套文档

- [Phase 00 当前审计快照](./phase-00-current-audit.md)
- [设计参考矩阵](./design-reference-matrix.md)
- [Figma 文件结构](./figma-file-structure.md)
- [组件清单](./component-inventory.md)
- [验收清单](./acceptance-checklist.md)

## 施工原则

- 先统一方向，再动代码。
- 先修复编码和文案，再做视觉升级。
- 先建立 token 和组件，再迁移页面。
- 先改核心闭环，再改边缘页面。
- 每个阶段都要有可验收产物，不做无边界重构。
