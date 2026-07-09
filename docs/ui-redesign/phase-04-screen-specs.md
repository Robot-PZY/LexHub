# Phase 04 - P0 页面规格

本文件是 Figma 高保真施工时的页面规格表。每个页面都要按“页面任务、布局、组件、状态、验收”落地。

## 1. Login

### 页面任务

让用户明确 LexHub 是可信法律业务智能工作台，并顺利以用户或管理员身份进入。

### 桌面布局

```txt
Auth Shell
├─ Left Brand Panel
│  ├─ Logo / Product name
│  ├─ Value statement
│  ├─ Capability bullets
│  └─ Trust notes
└─ Login Panel
   ├─ Role selector
   ├─ Account input
   ├─ Password input
   ├─ Error / hint
   ├─ Primary login button
   └─ Demo account hint
```

### 移动端

- 品牌说明压缩到表单上方。
- 表单单列。
- Demo hint 放在表单底部。

### 验收

- 主按钮只有一个。
- 错误态清晰，不挤压表单。
- 管理员入口不干扰普通用户登录。

## 2. Workspace Intake

### 页面任务

帮助用户把模糊的法律需求整理成可办理事项。

### 桌面布局

```txt
App Shell
└─ Page Content
   ├─ PageHeader
   └─ Intake Workspace
      ├─ Stepper Rail
      ├─ Main Form
      │  ├─ ScenarioSelector
      │  ├─ DocumentRequirementForm
      │  ├─ FactTextarea
      │  └─ UploadPanel
      └─ Context Panel
         ├─ SubmitSummary
         ├─ Validation status
         ├─ Material list
         └─ Draft / continue entry
```

### 关键交互

- 选择场景后，文书要素区动态出现。
- 上传材料后，右侧材料清单更新。
- 缺少必要信息时，提交按钮 disabled，并显示校验提示。
- 提交后进入 Workspace Run。

### 验收

- 用户不需要理解 prompt，也知道下一步该填什么。
- 主操作“启动办理”在 ready 状态明显。
- 空状态和草稿恢复状态都有设计。

## 3. Workspace Run

### 页面任务

让用户看懂智能体办理过程，知道当前状态、进展、工具调用和中间产物。

### 桌面布局

```txt
App Shell
└─ Run Page
   ├─ PageHeader
   │  ├─ Matter title
   │  ├─ Status / elapsed time
   │  └─ Actions
   ├─ Main Execution Area
   │  ├─ AgentPipeline / DAG
   │  └─ Timeline
   └─ Context Panel
      ├─ ToolCallLog
      ├─ Evidence references
      ├─ Current phase output
      └─ Toast / recent events
```

### 关键交互

- 点击 Agent node 展示该阶段详情。
- 点击工具调用展示输入、输出、耗时和状态。
- 完成后出现“查看结论”主操作。

### 验收

- 运行中不是空白 loading。
- 用户能看出当前处于哪个阶段。
- warning 和 failed 状态有恢复或查看原因入口。

## 4. Workspace Result

### 页面任务

展示可信审查结论，并支持依据追溯和文书导出。

### 桌面布局

```txt
App Shell
└─ Result Page
   ├─ Result Summary Bar
   │  ├─ ReviewScore
   │  ├─ Matter metadata
   │  └─ Export actions
   ├─ Report Body
   │  ├─ Fact summary
   │  ├─ Legal issues
   │  ├─ Analysis
   │  ├─ Conclusion
   │  └─ Suggested actions
   └─ Right Context
      ├─ CitationBlock list
      ├─ EvidenceList
      ├─ RiskPanel
      └─ AuditTrail entry
```

### 关键交互

- 点击引用跳到对应依据。
- 点击证据打开详情。
- 点击导出显示 loading 和完成反馈。
- 高风险结果引导进入 Review。

### 验收

- 结论、依据、风险三者同时可见。
- 报告像法律文书，而不是聊天消息。
- 导出入口稳定可见。

## 5. Review

### 页面任务

支持人工复核，处理需要确认或高风险的事项。

### 桌面布局

```txt
App Shell
└─ Review Workspace
   ├─ Review Queue
   │  ├─ Filter toolbar
   │  └─ Item list
   ├─ Review Report
   │  ├─ ReviewScore
   │  ├─ Key findings
   │  ├─ Manual notes
   │  └─ Approve / Flag actions
   └─ Evidence Context
      ├─ Citations
      ├─ Evidence
      ├─ Risk
      └─ Audit log
```

### 验收

- 没有待审事项时有可行动空状态。
- 待审、通过、需复核、高风险状态明确。
- 人工操作有确认和反馈。

## 6. Admin Overview

### 页面任务

让管理员快速判断系统是否可用，发现配置缺失或同步异常。

### 桌面布局

```txt
Admin Shell
└─ Overview
   ├─ Health Summary
   ├─ Status Grid
   │  ├─ Runtime
   │  ├─ Models
   │  ├─ APIs
   │  ├─ Knowledge
   │  └─ Agents
   ├─ Recent Errors / Audit Events
   └─ Quick Config Links
```

### 验收

- 第一屏能判断 all ready / partial warning / error。
- 每个异常状态都有下一步入口。
- 不使用营销式大 banner 代替状态信息。

## 7. Admin Knowledge

### 页面任务

管理法规、案例、模板、合同包，并处理导入、同步、校验。

### 桌面布局

```txt
Admin Shell
└─ Knowledge
   ├─ Knowledge Status Header
   ├─ Tabs: Browse / Import / Config
   └─ Knowledge Browser
      ├─ Library nav
      ├─ Search and filters
      ├─ Result list
      └─ Preview panel
```

### 导入布局

```txt
Import
├─ Source selector
├─ Upload / sync action
├─ Validation result
└─ Import history
```

### 验收

- 能区分法规、案例、模板、合同包。
- 搜索、列表、预览在一个工作区内完成。
- 同步异常和空知识库有明确下一步。

## 原型点击点

必须连通：

- Login primary button -> Workspace Intake
- Workspace Intake submit -> Workspace Run
- Workspace Run completed action -> Workspace Result
- Workspace Result review action -> Review
- Workspace Result export action -> export success state
- Admin login -> Admin Overview
- Admin Overview knowledge card -> Admin Knowledge
- Admin Knowledge import action -> import state

