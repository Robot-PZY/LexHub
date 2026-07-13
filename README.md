# 律枢 LexHub

> 开源仓库：[github.com/Robot-PZY/LexHub](https://github.com/Robot-PZY/LexHub)

律枢 LexHub 是基于 [Co-Sight](https://github.com/ZTE-AICloud/Co-Sight) 二次开发的法律业务智能工作台。项目把多智能体协同、DAG 任务编排、法规检索、材料分析和文书生成放到同一套 Web 应用中，重点服务合同审查、争议解决、合规分析和法规研究等法律辅助场景。

**核心能力**

- **智能工作台** — 场景化任务接入（合同审查、争议解决、合规分析等），支持任务表单和材料上传
- **DAG 执行视图** — 可视化任务拆解、工具调用与阶段推进
- **法规研究** — 本地 Chroma 知识库 + 可选外部法律检索 API
- **文书引擎** — LLM + 模板/法规 RAG，生成审查报告、合同草稿等，支持 DOCX/PDF 导出
- **管理控制台** — 模型与 API 配置、知识库维护、策略规则和用户管理

---

## 目录结构

```
LexHub/
├── README.md                 # 本文件
├── start-lexhub.bat          # Windows 一键启动脚本
├── start-lexhub.sh           # macOS / Linux 启动脚本
├── Co-Sight-master/          # 主工程
│   ├── cosight_frontend/     # 前端（React + Vite）
│   ├── cosight_server/       # 后端（FastAPI + Co-Sight 引擎）
│   ├── config/               # 场景、知识库种子、运行时配置
│   ├── .env_template         # 环境变量模板
│   └── requirements.txt      # Python 依赖
├── test/                     # 演示测试材料
└── docs/                     # 国赛文档、PPT 策划和参考资料
```

---

## 克隆与更新

```bash
git clone https://github.com/Robot-PZY/LexHub.git
cd LexHub
```

后续拉取更新：`git pull origin main`

---

## 环境要求

| 组件 | 版本 |
|------|------|
| Python | 3.11 及以上 |
| Node.js | 18 及以上（含 npm） |
| 操作系统 | Windows 10/11、macOS、Linux |

---

## 快速启动

### 方式一：启动脚本（推荐）

1. 克隆或解压项目到本地
2. Windows 双击根目录 **`start-lexhub.bat`**；macOS/Linux 执行 `bash start-lexhub.sh`
3. Windows 启动器会检查 `.env`、Python 后端依赖、npm 与前端依赖，分别启动前后端，等待健康检查通过后打开浏览器；若环境缺失，会给出需要执行的安装命令。

| 入口 | 地址 |
|------|------|
| 用户端（登录页） | http://127.0.0.1:5174 |
| 管理端 | http://127.0.0.1:5174/admin |
| 后端 API | http://127.0.0.1:7788 |

Windows 下双击根目录 **`stop-lexhub.bat`** 即可停止本次启动的前后端；macOS/Linux 下在启动终端按 `Ctrl+C` 停止服务。

Windows 可先执行 `start-lexhub.bat --check` 做环境检查，或执行 `start-lexhub.bat --no-browser` 禁止自动打开浏览器。

macOS/Linux 脚本支持以下环境变量：

```bash
BACKEND_PORT=7788
FRONTEND_PORT=5174
LEXHUB_PIP_INDEX_URL=https://pypi.tuna.tsinghua.edu.cn/simple
LEXHUB_NPM_REGISTRY=https://registry.npmmirror.com
LEXHUB_SKIP_INSTALL=1
LEXHUB_OPEN_BROWSER=0
```

### 方式二：手动启动

**后端**

```bash
cd Co-Sight-master
cp .env_template .env    # Windows: copy .env_template .env
pip install -r requirements.txt
python cosight_server/deep_research/main.py
```

**前端**（新开终端）

```bash
cd Co-Sight-master/cosight_frontend
npm install
npm run dev
```

前端开发服务器默认监听 `5174`，并通过 Vite 代理将 `/api` 转发到后端 `7788`。

---

## 环境配置

编辑 **`Co-Sight-master/.env`**。完整可选项及注释见 `.env_template`。

### 必填（核心功能）

```env
# 主 LLM — 任务理解、分析、文书生成均依赖此项
API_KEY=你的_API_Key
API_BASE_URL=https://api.deepseek.com/v1
MODEL_NAME=deepseek-chat

# 本地向量知识库路径
CHROMA_PERSIST_DIR=./chroma_lexhub
```

### 推荐配置

| 变量 | 用途 | 说明 |
|------|------|------|
| `TAVILY_API_KEY` | 联网搜索 | 补充公开资料检索 |
| `DELILEGAL_APPID` / `DELILEGAL_SECRET` | 得理法律检索 | 外部法规案例 API |
| `TOOL_API_KEY` 等 | 多角色模型 | 可为研究、文书、审查单独指定模型（见 `.env_template`） |

### 管理端在线配置

登录管理端后，可在 **能力总览** 页面配置模型与 API 密钥。保存后写入 `Co-Sight-master/config/runtime/admin_settings.json`，并在运行时覆盖部分环境变量。

### 知识库初始化

首次使用文书生成或法规检索前，建议：

1. 登录管理端 → **知识库**
2. 点击 **导入合同文书种子包**（写入模板与类案）
3. 可选：同步 NPC 法规（民法典、劳动法等）

---

## 账号说明

> ⚠️ 当前版本为**演示级鉴权**：账号密码校验在前端完成，会话保存在浏览器 `localStorage`，**不适用于生产环境**。部署上线前请替换为服务端认证。

### 用户端

访问 http://127.0.0.1:5174 ，默认进入用户登录页。

| 类型 | 账号 | 密码 | 说明 |
|------|------|------|------|
| 内置演示账号 | `user` | `user123456` | Ultra 会员权限，可直接体验全部用户功能 |
| 自助注册 | 自行填写 | ≥ 6 位 | 登录页切换「注册」标签，账号 ≥ 3 字符；`Admin` 保留不可注册 |

登录后进入 **智能工作台**，典型流程：

1. 选择专项场景（或不选，走通用分析）
2. 填写文书表单（部分场景）
3. 描述任务 / 上传材料（可使用 `test/` 目录样例）
4. **任务执行** → 查看 DAG 与工具调用
5. **任务结果** → 查看结论、生成文书、导出 DOCX/PDF

### 管理端

访问 http://127.0.0.1:5174/admin ，或在登录页切换至 **管理端入口**。

| 账号 | 密码 |
|------|------|
| `Admin` | `123456` |

管理端主要模块：

| 模块 | 路径 | 功能 |
|------|------|------|
| 系统概览 | `/admin` | 运行状态与数据概览 |
| 能力总览 | `/admin/connections` | LLM、搜索、RAG 等 API 配置与探测 |
| 知识库 | `/admin/knowledge` | 法规 / 模板 / 类案浏览与导入 |
| 策略规则 | `/admin/policies` | 审查规则与工作流策略 |
| 用户管理 | `/admin/users` | 会员与演示用户运营数据 |

---

## 测试用例

`test/` 提供 **3 套** 不同领域的演示用例（无重复合同样例），每套含 PDF 材料 + `prompt.md`：

| 文件夹 | 建议场景 | 领域 |
|--------|----------|------|
| `case-01-labor-dispute/` | 争议解决 | 劳动争议（解除、工资、考勤、仲裁） |
| `case-02-corporate-governance/` | 公司事务 | 股权回购、对外担保、董事辞任 |
| `case-03-data-compliance/` | 合规知产 | App 个人信息保护、SDK 披露、监管整改 |

**使用步骤**：选择场景 → 上传文件夹内全部 PDF → 粘贴 `prompt.md` 中的任务描述 → 提交。

重新生成：`python test/generate_materials.py`

---

## 开发说明

### 前端构建

```bash
cd Co-Sight-master/cosight_frontend
npm run build        # 产物输出至 dist/
npm run preview      # 本地预览生产构建
```

### 仅启动后端

```bash
cd Co-Sight-master
python cosight_server/deep_research/main.py
```

### 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 · TypeScript · Vite · React Router |
| 后端 | FastAPI · Co-Sight 多智能体引擎 · WebSocket |
| 知识库 | Chroma · 本地 JSON 种子数据 |
| 文书 | LLM 结构化生成 · python-docx · PyMuPDF |

更详细的设计与模块说明见 `Co-Sight-master/DESIGN.md`。

---

## 常见问题

**页面能打开，但提交任务无响应？**  
检查 `.env` 中 `API_KEY` 是否有效，查看 Backend 窗口报错；确认 WebSocket 未被防火墙拦截。

**文书生成失败？**  
确认 LLM 已配置；在管理端知识库导入「合同文书种子包」；任务结果页查看具体错误提示。

**法规检索无结果？**  
确认 `CHROMA_PERSIST_DIR` 路径可写，并已在知识库完成种子导入或 NPC 同步。

**端口被占用？**  
后端默认 `7788`，前端默认 `5174`。可在 `cosight_server/deep_research/main.py` 与 `cosight_frontend/vite.config.ts` 中调整。

---

## 致谢

- [Co-Sight](https://github.com/ZTE-AICloud/Co-Sight) — 多智能体协同与 DAG 编排底座

---

**律枢 LexHub** · Legal Intelligence Workbench
