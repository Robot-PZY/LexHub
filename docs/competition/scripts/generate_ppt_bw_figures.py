from __future__ import annotations

from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "ppt-bw"
OUT.mkdir(parents=True, exist_ok=True)

W, H = 1600, 900


def svg_page(title: str, body: str) -> str:
    return f"""<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">
  <defs>
    <style>
      .bg{{fill:#fff}}
      .line{{stroke:#111;stroke-width:3;fill:none}}
      .thin{{stroke:#444;stroke-width:2;fill:none}}
      .box{{fill:#fff;stroke:#111;stroke-width:3;rx:18}}
      .soft{{fill:#f5f5f5;stroke:#111;stroke-width:2;rx:14}}
      .dark{{fill:#111}}
      .title{{font:700 52px "Microsoft YaHei",Arial,sans-serif;fill:#111}}
      .h{{font:700 30px "Microsoft YaHei",Arial,sans-serif;fill:#111}}
      .t{{font:400 24px "Microsoft YaHei",Arial,sans-serif;fill:#111}}
      .s{{font:400 20px "Microsoft YaHei",Arial,sans-serif;fill:#333}}
      .w{{font:700 24px "Microsoft YaHei",Arial,sans-serif;fill:#fff}}
      .arrow{{stroke:#111;stroke-width:4;fill:none;marker-end:url(#arrow)}}
    </style>
    <marker id="arrow" markerWidth="12" markerHeight="12" refX="10" refY="6" orient="auto">
      <path d="M0,0 L12,6 L0,12 Z" fill="#111"/>
    </marker>
  </defs>
  <rect class="bg" width="{W}" height="{H}"/>
  <text class="title" x="70" y="95">{title}</text>
  <line class="line" x1="70" y1="135" x2="1530" y2="135"/>
  {body}
</svg>
"""


def text(x: int, y: int, value: str, cls: str = "t") -> str:
    return f'<text class="{cls}" x="{x}" y="{y}">{value}</text>'


def box(x: int, y: int, w: int, h: int, label: str, sub: str = "", cls: str = "box") -> str:
    sub_svg = f'{text(x + 28, y + 82, sub, "s")}' if sub else ""
    return f'<rect class="{cls}" x="{x}" y="{y}" width="{w}" height="{h}"/>{text(x + 28, y + 48, label, "h")}{sub_svg}'


def arrow(x1: int, y1: int, x2: int, y2: int) -> str:
    return f'<path class="arrow" d="M{x1} {y1} H{x2}"/>'


def write(name: str, title: str, body: str) -> None:
    (OUT / name).write_text(svg_page(title, body), encoding="utf-8")


write(
    "bw-p01-background-pain.svg",
    "P1 业务背景与痛点",
    f"""
  <rect class="soft" x="80" y="200" width="1440" height="520"/>
  {box(145, 275, 560, 330, "传统法律工作方式", "", "box")}
  {text(205, 385, "材料分散：文件、聊天记录、检索结果分离")}
  {text(205, 455, "依据难追溯：法规、案例、观点散落各处")}
  {text(205, 525, "过程不可见：只看到结论，难复盘过程")}
  {text(205, 595, "文书整理耗时：事实、依据、模板人工拼接")}
  <path class="arrow" d="M735 440 H865"/>
  {box(895, 275, 560, 330, "LexHub 工作方式", "", "box")}
  {text(955, 385, "工作台统一接入任务与材料")}
  {text(955, 455, "法规 RAG、来源摘要和引用记录")}
  {text(955, 525, "DAG、工具轨迹、Replay 回放")}
  {text(955, 595, "结构化报告与 DOCX/PDF 导出")}
  <rect class="soft" x="270" y="750" width="1060" height="72"/>
  {text(325, 794, "从人工分散处理，转向统一工作台协同处理", "h")}
""",
)

write(
    "bw-p02-users-scenarios.svg",
    "P2 目标场景与用户",
    f"""
  {box(100, 205, 360, 470, "目标用户", "", "box")}
  {text(165, 310, "个人律师")}
  {text(165, 385, "律所团队")}
  {text(165, 460, "企业法务")}
  {text(165, 535, "合规人员")}
  {box(520, 205, 980, 470, "重点场景与交付物", "", "box")}
  <line class="thin" x1="580" y1="330" x2="1440" y2="330"/>
  {text(600, 305, "场景", "h")}{text(900, 305, "输入材料", "h")}{text(1200, 305, "输出结果", "h")}
  {text(600, 380, "劳动争议")}{text(900, 380, "通知 / 考勤 / 工资")}{text(1200, 380, "争议焦点 / 证据缺口")}
  {text(600, 450, "公司治理")}{text(900, 450, "股权 / 决议 / 章程")}{text(1200, 450, "程序风险 / 补正建议")}
  {text(600, 520, "数据合规")}{text(900, 520, "SDK / 投诉 / 评估")}{text(1200, 520, "风险分级 / 整改建议")}
  {text(600, 590, "合同审查")}{text(900, 590, "合同 / 协议 / 履约")}{text(1200, 590, "条款风险 / 审查报告")}
  <rect class="soft" x="130" y="730" width="1340" height="64"/>
  {text(165, 770, "覆盖：通用分析、材料解读、合同审查、公司事务、争议解决、合规知产、法规研究、文书起草", "s")}
""",
)

write(
    "bw-p03-solution-overview.svg",
    "P3 方案总览",
    f"""
  {box(115, 330, 210, 120, "输入材料", "合同 / 证据", "box")}
  {arrow(330, 390, 435, 390)}
  {box(455, 330, 210, 120, "法规检索", "法规 / 案例", "box")}
  {arrow(670, 390, 775, 390)}
  {box(795, 330, 210, 120, "DAG 协作", "智能体执行", "box")}
  {arrow(1010, 390, 1115, 390)}
  {box(1135, 330, 240, 120, "结构化成果", "报告 / 文书", "box")}
  <path class="arrow" d="M1255 455 V560 H795 V485"/>
  {box(650, 600, 290, 110, "审计复核", "Replay / Snapshot / Audit", "soft")}
  <rect class="soft" x="300" y="765" width="1000" height="66"/>
  {text(390, 806, "材料、依据、流程、交付、复核形成连续任务链路", "h")}
""",
)

write(
    "bw-p04-architecture.svg",
    "P4 技术架构",
    "\n".join(
        [
            box(170, 205 + i * 105, 1260, 80, label, desc, "box")
            for i, (label, desc) in enumerate(
                [
                    ("用户交互层", "工作台 / 执行页 / 结果页 / 材料库 / 回放页 / 管理端"),
                    ("后端服务层", "上传 / 知识库 / 文书导出 / 审计日志 / 运行配置"),
                    ("智能体编排层", "Co-Sight 多智能体 / DAG / 工具调用 / Replay"),
                    ("工具与知识层", "法规 RAG / 联网搜索 / 文档处理 / DOCX/PDF 导出"),
                    ("可信与数据层", "Execution Snapshot / Audit Log / 权限边界"),
                ]
            )
        ]
    ),
)

write(
    "bw-p05-cosight-comparison.svg",
    "P5 Co-Sight 改进对比",
    f"""
  <rect class="box" x="95" y="205" width="1410" height="420"/>
  {text(150, 270, "维度", "h")}{text(500, 270, "原生 Co-Sight", "h")}{text(970, 270, "律枢 LexHub", "h")}
  <line class="line" x1="130" y1="300" x2="1470" y2="300"/>
  {text(150, 360, "产品定位")}{text(500, 360, "通用任务执行框架")}{text(970, 360, "法律业务智能服务平台")}
  {text(150, 435, "任务流程")}{text(500, 435, "通用 Agent / Tool / Replay")}{text(970, 435, "法律 DAG + 导出前复核")}
  {text(150, 510, "工具体系")}{text(500, 510, "搜索 / 文件 / 代码执行")}{text(970, 510, "法规 RAG / 材料库 / 文书导出")}
  {text(150, 585, "展示交付")}{text(500, 585, "执行日志与 replay")}{text(970, 585, "工作台 / 结果页 / 审计链")}
  <rect class="soft" x="190" y="720" width="1220" height="70"/>
  {text(265, 765, "继承底座能力 + 法律工作流 + 知识库工具 + 业务页面 + 审计交付", "h")}
""",
)

write(
    "bw-p06-agents.svg",
    "P6 智能体角色分工",
    f"""
  <circle cx="800" cy="405" r="115" fill="#111"/>
  {text(720, 395, "任务理解", "w")}{text(720, 435, "智能体", "w")}
  {box(180, 230, 330, 105, "证据质检", "材料清单 / 证据缺口", "box")}
  {box(1090, 230, 330, 105, "法规研究", "法规检索 / 引用溯源", "box")}
  {box(180, 510, 330, 105, "文书生成", "报告 / 律师函 / 结论", "box")}
  {box(1090, 510, 330, 105, "交叉审查", "一致性 / 风险标记", "box")}
  {box(635, 650, 330, 105, "合规监测", "审计链 / 导出门禁", "soft")}
  <line class="thin" x1="510" y1="282" x2="700" y2="360"/><line class="thin" x1="1090" y1="282" x2="900" y2="360"/>
  <line class="thin" x1="510" y1="560" x2="700" y2="455"/><line class="thin" x1="1090" y1="560" x2="900" y2="455"/>
  <line class="thin" x1="800" y1="520" x2="800" y2="650"/>
""",
)

write(
    "bw-p07-dag.svg",
    "P7 法律任务 DAG",
    f"""
  {box(90, 305, 170, 82, "材料接入", "", "box")}{arrow(265, 346, 340, 346)}
  {box(360, 305, 170, 82, "任务理解", "", "box")}{arrow(535, 346, 610, 346)}
  <polygon points="710,265 820,346 710,427 600,346" fill="#fff" stroke="#111" stroke-width="3"/>
  {text(650, 340, "材料完整", "h")}{text(675, 375, "判断", "h")}
  {arrow(820, 346, 925, 346)}{box(945, 305, 170, 82, "法规研究", "", "box")}{arrow(1120, 346, 1195, 346)}
  {box(1215, 305, 170, 82, "文书生成", "", "box")}
  <path class="arrow" d="M710 427 V455 H345 V490"/>
  {box(260, 500, 170, 82, "证据质检", "", "box")}{arrow(435, 541, 510, 541)}
  {box(530, 500, 170, 82, "缺口清单", "", "box")}{arrow(705, 541, 780, 541)}
  {box(800, 500, 170, 82, "材料补充", "", "box")}
  <path class="arrow" d="M1300 387 V500"/>
  {box(1215, 500, 170, 82, "交叉审查", "", "soft")}
  <path class="arrow" d="M1300 582 V665"/>
  {box(1215, 680, 170, 82, "合规监测", "", "soft")}
  {box(80, 665, 560, 115, "条件触发", "材料完整度 / 引用覆盖 / 风险等级", "soft")}
""",
)

write(
    "bw-p08-task-demo.svg",
    "P8 功能演示：任务执行",
    f"""
  {box(100, 220, 640, 420, "工作台任务提交截图", "场景选择 / 材料上传 / Prompt / 任务提交", "box")}
  {box(860, 220, 640, 420, "DAG 执行与工具轨迹截图", "阶段状态 / 工具调用 / 智能体输出", "box")}
  <rect class="soft" x="160" y="720" width="1280" height="70"/>
  {text(250, 765, "登录系统 → 选择场景 → 上传材料 → 提交任务 → 查看 DAG", "h")}
""",
)

write(
    "bw-p09-result-demo.svg",
    "P9 功能演示：结果交付",
    f"""
  {box(100, 220, 420, 260, "结果页", "结构化结论 / 法规依据 / 风险提示", "box")}
  {box(590, 220, 420, 260, "DOCX/PDF 导出", "文书初稿 / 归档 / 交付", "box")}
  {box(1080, 220, 420, 260, "Replay 回放", "阶段回放 / 工具轨迹 / 审计摘要", "box")}
  {box(380, 560, 840, 110, "管理端配置", "模型 / API / 知识库 / 策略", "soft")}
  <rect class="soft" x="290" y="745" width="1020" height="66"/>
  {text(380, 786, "结构化结果 / 文书导出 / 过程复盘 / 策略配置", "h")}
""",
)

write(
    "bw-p10-knowledge-tools.svg",
    "P10 法律知识与工具集成",
    f"""
  {box(105, 250, 360, 350, "知识来源", "法规库 / 案例 / 裁判文书 / 本地知识库", "box")}
  {arrow(475, 425, 590, 425)}
  {box(610, 310, 300, 230, "法规 RAG", "检索 / 摘要 / 引用", "soft")}
  {arrow(920, 425, 1035, 425)}
  {box(1055, 250, 430, 350, "工具调用", "legal_rag / search / document_parse / export / audit_write", "box")}
  <rect class="soft" x="300" y="725" width="1000" height="66"/>
  {text(395, 766, "权威来源 / 本地知识库 / 工具调用记录 / 法律成果", "h")}
""",
)

write(
    "bw-p11-trust.svg",
    "P11 可信安全与可复核",
    f"""
  {box(90, 270, 180, 80, "任务输入", "", "box")}{arrow(275, 310, 355, 310)}
  {box(375, 270, 180, 80, "DAG 阶段", "", "box")}{arrow(560, 310, 640, 310)}
  {box(660, 270, 180, 80, "工具调用", "", "box")}{arrow(845, 310, 925, 310)}
  {box(945, 270, 180, 80, "Replay", "", "box")}{arrow(1130, 310, 1210, 310)}
  {box(1230, 270, 230, 80, "导出溯源", "", "box")}
  {box(140, 500, 300, 140, "Replay", "复盘阶段进展与工具输出", "soft")}
  {box(485, 500, 300, 140, "Snapshot", "保存执行状态与结果摘要", "soft")}
  {box(830, 500, 300, 140, "Audit Log", "留痕、哈希与导出门禁", "soft")}
  {box(1175, 500, 300, 140, "权限边界", "用户端与管理端分离", "soft")}
""",
)

write(
    "bw-p12-business-value.svg",
    "P12 商业方案与社会价值",
    f"""
  {box(105, 220, 640, 430, "商业路径", "", "box")}
  {text(165, 325, "体验版：低门槛体验")}
  {text(165, 395, "专业版：标准办案闭环")}
  {text(165, 465, "旗舰版：高频与深度能力")}
  {text(165, 535, "机构定制：私有化部署 / 行业知识库 / 工具接入")}
  {box(855, 220, 640, 430, "社会价值", "", "box")}
  {text(915, 325, "降低检索整理成本")}
  {text(915, 395, "提升中小主体可及性")}
  {text(915, 465, "强化依据追溯与留痕")}
  {text(915, 535, "扩展 Co-Sight 行业应用")}
""",
)

write(
    "bw-p13-deliverables.svg",
    "P13 总结与交付成果",
    f"""
  {box(130, 230, 300, 105, "前端工程", "用户端 / 管理端", "box")}
  {box(470, 230, 300, 105, "后端工程", "接口 / 服务 / 审计", "box")}
  {box(810, 230, 300, 105, "工作流配置", "法律任务 DAG", "box")}
  {box(1150, 230, 300, 105, "智能体配置", "六类法律智能体", "box")}
  {box(130, 410, 300, 105, "自定义工具", "法律检索 / 导出", "box")}
  {box(470, 410, 300, 105, "测试材料", "三类演示场景", "box")}
  {box(810, 410, 300, 105, "技术文档", "方案 / 创新总结", "box")}
  {box(1150, 410, 300, 105, "答辩材料", "PPT / 演示脚本", "box")}
  <rect class="soft" x="300" y="700" width="1000" height="70"/>
  {text(410, 745, "可运行工程 / 可复盘过程 / 可扩展场景 / 完整竞赛交付", "h")}
""",
)

print(f"generated {len(list(OUT.glob('*.svg')))} svg files in {OUT}")
