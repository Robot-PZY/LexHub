# 律枢 LexHub 评委演示手册

## 演示目标

用一条真实法律任务展示：用户提交需求与材料后，Planner 动态生成 DAG，专业智能体按依赖并行/串行工作，工具调用和阶段产物持续可见，核验智能体自动校验，最后形成可回放、可导出的结果。

## 演示前检查

在项目根目录执行：

```powershell
python tools/validate_phase7_release.py
cd cosight_frontend
npm.cmd run build
```

检查 `.env` 已配置主模型与百度 OCR。密钥申请入口、变量和降级说明见 [API-CONFIGURATION.md](API-CONFIGURATION.md)。不要在投屏、终端日志或演示材料中显示 `.env`。

## 启动

Windows 推荐直接双击仓库最外层的 `start-lexhub.bat`。启动器会检查 `.env`、Python 和前端依赖，避免重复占用端口；它会分别打开前后端日志窗口，等待健康检查通过后自动打开浏览器。双击最外层的 `stop-lexhub.bat` 可停止由启动器创建的进程。项目内的 `start-cosight.bat` 仅保留兼容。

命令行等价方式：

```powershell
python start_lexhub.py
```

只检查环境而不启动：

```powershell
python start_lexhub.py --check
```

默认访问地址为 `http://127.0.0.1:5174`。

## 推荐主线：服务合同审查

上传 `fixtures/contracts/service-contract.txt`，输入：

> 请审查上传的技术服务合同，识别付款、违约、解除、知识产权与争议解决风险，引用有效法律依据并生成审查报告。

按以下顺序讲解：

1. Planner 根据场景选择证据、争点、法规、条款、文书和核验智能体，不是固定播放动画。
2. 证据质检与法规准备可并行，后续节点由依赖关系自动释放。
3. 点击阶段查看智能体身份、能力/API、工具开始/完成/失败事件、来源与结构化结果。
4. 最终结果由 Finalizer 确定性收敛；外部接口失败时显示降级证据，不会无限等待。
5. 在结果页导出 DOCX/PDF，再进入回放中心展示阶段数、智能体数、工具事件数和完整轨迹。

## 备用场景

- 欠款纠纷：使用 `fixtures/disputes/debt-dispute.txt`，突出时效计算智能体与代码执行工具。
- 简单法律咨询：不上传材料，突出动态裁剪——不会调度证据、条款、计算和文书智能体。

## 失败预案

- 外部法律检索失败：展示工具错误事件及本地知识库/通用搜索降级，不刷新页面。
- 百度接口限流：保留原文件文本解析或逐页 OCR 结果，说明 capability executor 已记录降级链路。
- 模型响应超时：任务预算会将未完成节点置为阻塞，并基于已完成证据生成带警告的最终结果。
- 网络不稳定：从回放中心选择最近一条完整任务，仍可演示 DAG、工具证据和导出。

## 完整链路审计

后端启动后运行：

```powershell
python scripts/full_chain_audit.py --timeout 180
```

该审计覆盖上传、实时 WebSocket 任务、动态规划、专业智能体、工具事件、最终结果、回放 API 与回放 WebSocket。
