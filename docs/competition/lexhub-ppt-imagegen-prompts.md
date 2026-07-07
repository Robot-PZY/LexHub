# 律枢 LexHub PPT 图片生成提示词

> 用于生成 `docs/competition/assets/ppt-imagegen/` 下的 PPT 配图。  
> 所有图片建议 16:9 横版，风格统一为：白底、深蓝标题、青色流程、金色强调、圆角卡片、轻阴影、竞赛答辩 PPT 成稿风。

## 通用风格提示词

```text
Create a polished 16:9 Chinese PowerPoint slide infographic for LexHub, national competition final presentation style. Clean white background, deep navy title and outlines, teal process accents, gold numbered highlights, rounded cards, subtle shadows, professional consulting PPT design. Keep Chinese text large and readable. Avoid fake logos, watermark, random text, clutter, decorative blobs, excessive gradients, and tiny labels.
```

## P1 需求来源

```text
Slide title: “1 需求来源”. Left 60%: large rounded panel titled “传统法律工作流程”, five process cards connected by teal arrows: 材料整理, 法规检索, 证据核对, 文书撰写, 人工复核. Right 35%: three stacked pain cards with gold number circles: 效率低, 过程不透明, 交付成本高. Bottom full-width emphasis bar: “法律业务需要 ‘事实、依据、过程、交付’ 的完整链路”.
```

## P2 用户场景

```text
Slide title: “2 用户场景”. Left column: four user cards: 个人律师, 律所团队, 企业法务, 合规人员. Right large scenario matrix titled “典型业务任务”, columns: 场景, 输入材料, 输出结果. Rows: 合同审查, 争议解决, 公司事务, 合规研究. Bottom emphasis strip: “从个人办案到机构协作，LexHub 覆盖高频法律任务场景”.
```

## P3 产品定位

```text
Slide title: “3 产品定位”. Center large product card: “律枢 LexHub / 基于 Co-Sight 的法律行业超级智能体工作台”. Below it a capability chain: 材料接入 → 依据检索 → 智能体协作 → 结果交付 → 过程复盘. Add scenario tags: 合同审查, 争议解决, 公司事务, 合规研究, 文书起草. Bottom: “把高频法律任务转为系统化、可复核、可交付的工作流程”.
```

## P4 双端架构

```text
Slide title: “4 双端架构”. Left panel: 用户端 User Portal with 场景选择, 任务描述, 材料上传, DAG 执行跟踪, 结果查看与导出. Right panel: 管理端 Admin Console with 模型与 API 配置, 法律知识库维护, 工作流与策略规则, 智能体与工具目录, 用户与会员标注. Bottom shared platform bar: “共享中台：FastAPI + Co-Sight 执行引擎 + Legal KB + Replay / Audit”.
```

## P5 Co-Sight 改造

```text
Slide title: “5 Co-Sight 改造”. Left panel: 原生 Co-Sight with Planner, Actor, Tool Call, Replay. Center teal transformation arrow: 法律场景化改造. Right larger panel: 律枢 LexHub with 法律场景入口, 法律任务 DAG, 法规 RAG, 文书导出, 审计链, 用户端 + 管理端. Bottom: “从通用智能体框架，升级为法律业务智能服务平台”.
```

## P6 系统架构

```text
Slide title: “6 系统架构”. Five stacked architecture layers: 用户交互层, 后端服务层, 智能体编排层, 工具与知识层, 可信数据层. Add right-side keyword rail: 可扩展, 可配置, 可复核. Bottom emphasis strip: “前后端分离 + Co-Sight 编排 + 法律知识增强”.
```

## P7 智能体协同

```text
Slide title: “7 智能体协同”. Center circular node: 任务理解智能体. Around it five connected cards: 证据质检智能体, 法规研究智能体, 文书生成智能体, 交叉审查智能体, 合规监测智能体. Use teal for working agents and gold for review agents. Bottom: “多智能体分工协作，贴近真实法律业务流程”.
```

## P8 DAG 编排

```text
Slide title: “8 DAG 编排”. Main flow: 材料接入 → 任务理解 → 材料完整度判断 → 法规研究 → 文书生成 → 结果导出. Branch: 材料不足 → 证据质检 → 缺口清单 → 材料补充, returning to decision node. Right vertical review chain: 交叉审查 → 合规监测 → 导出交付. Left bottom callout: 条件触发规则.
```

## P9 可信复核

```text
Slide title: “9 可信复核”. Top traceability chain: 任务输入 → DAG 阶段 → 工具调用 → Replay → Snapshot → Audit Log → 导出溯源. Center shield/check labeled “可信输出”. Bottom four cards: Replay, Snapshot, Audit Log, 权限边界. Bottom strip: “让法律结果有依据、过程可追踪、导出可复核”.
```

## P10 用户端闭环

```text
Slide title: “10 用户端闭环”. Left large browser UI mockup titled “LexHub · 任务工作台” with sections: 选择场景, 任务描述, 材料上传, 启动执行. Right vertical step cards: 场景选择, 任务描述, 材料上传, 启动执行, 结果导出. Bottom pills: 任务输入 → Plan 拆解 → Tool Call → Agent Result → Replay. Include subtle play icon overlay area for video replacement.
```

## P11 管理端支撑

```text
Slide title: “11 管理端支撑”. Left large browser admin console mockup titled “LexHub · 管理控制台”, with panels: 模型与 API 配置, 法律知识库维护, 工作流与策略规则, 用户与会员标注, 运行状态, 审计记录. Right stacked cards: 模型与 API 配置, 法律知识库维护, 工作流与策略规则, 用户与会员标注. Bottom: “后台配置 → Co-Sight 执行能力 → 用户端任务效果”.
```

## P12 会员方案

```text
Slide title: “12 会员方案”. Top path: 体验使用 → 标准办案 → 深度使用 → 机构定制. Middle three membership cards: 体验版 Trial, 专业版 Pro, 旗舰版 Ultra. Pro card centered and highlighted. Bottom dark navy bar: “机构定制：私有化部署 / 专属知识库 / 行业工作流 / 工具 API 对接”. Do not include prices.
```

## P13 社会价值

```text
Slide title: “13 社会价值”. Center circular core visual with keywords: 可编排, 可追溯, 可交付. Four surrounding cards: 降低成本, 提升可及性, 强化追溯, 行业扩展. Bottom gold emphasis bar: “让法律服务更高效、更透明、更容易被复核”.
```
