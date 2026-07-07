from __future__ import annotations

import html
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
ASSET_DIR = ROOT / "assets" / "ppt"
OUT_HTML = ROOT / "lexhub-ppt-designer-brief-final.html"
OUT_PDF = ROOT / "lexhub-ppt-designer-brief-final.pdf"


PAGES = [
    {
        "no": "P1",
        "title": "需求来源",
        "bullets": [
            "传统法律工作依赖人工拆解、人工检索、人工整理",
            "材料、依据、流程和交付环节容易分散",
            "过程记录不足时，后续复盘和审核成本较高",
            "LexHub 将材料接入、依据检索、流程执行和结果交付统一到工作台",
        ],
        "figure": "fig-ppt-01-demand-chain.svg",
        "figure_note": "按图展示法律任务链路和传统工作痛点。",
    },
    {
        "no": "P2",
        "title": "用户场景",
        "bullets": [
            "个人律师：合同审查、争议整理、文书起草",
            "律所团队：案件归档、文书标准、流程复盘",
            "企业法务：合同风险、公司事务、合规内控",
            "合规人员：法规研究、风险识别、整改建议",
            "法律学习者：案例推演、法规研究、文书训练",
        ],
        "extra": "底部场景标签：通用分析、材料解读、调研摘要、合同审查、公司事务、争议解决、合规知产、法规研究、文书起草。",
        "figure": "fig-ppt-02-user-scenarios.svg",
        "figure_note": "按图制作用户-场景-交付物矩阵。",
    },
    {
        "no": "P3",
        "title": "产品定位",
        "bullets": [
            "法律行业超级智能体工作台",
            "围绕法律业务流程组织任务办理",
            "连接任务入口、材料、法规检索、智能体执行、结果导出、过程回放",
            "核心能力：场景入口、材料归档、法规检索、DAG 执行、文书导出、Replay 回放",
        ],
        "figure": "fig-ppt-03-product-positioning.svg",
        "figure_note": "按图制作中心辐射结构。",
    },
    {
        "no": "P4",
        "title": "双端架构",
        "bullets": [
            "用户端：场景选择、任务描述、材料上传、DAG 执行跟踪、结果查看与导出",
            "管理端：模型与 API 配置、法律知识库维护、工作流与策略规则、智能体与工具目录、用户与会员标注",
            "共享中台：FastAPI + Co-Sight + Legal KB + Replay / Audit",
        ],
        "figure": "fig-ppt-04-dual-architecture.svg",
        "figure_note": "按图制作左右双端和底部共享中台。",
    },
    {
        "no": "P5",
        "title": "底座改造",
        "bullets": [
            "原生 Co-Sight：Planner、Actor、Tool Call、Replay",
            "LexHub 改造：法律场景、法律 DAG、法规工具、文书导出、双端界面",
            "最终形态：法律行业双端应用系统",
            "五条改造路径：场景化、工作流化、知识增强、双端产品化、可信交付",
        ],
        "figure": "fig-ppt-05-cosight-upgrade.svg",
        "figure_note": "按图制作三段式转化图。",
    },
    {
        "no": "P6",
        "title": "系统架构",
        "bullets": [
            "应用层：用户端 React、管理端 React",
            "服务层：FastAPI、上传、导出、审计、配置接口",
            "执行层：Co-Sight Planner、Actor、Tool Call、Replay",
            "工具层：Legal KB、Search API、Document、Export",
            "配置层：Workflow、Agent Registry、Settings",
        ],
        "figure": "fig-ppt-06-system-architecture.svg",
        "figure_note": "按图制作分层架构。",
    },
    {
        "no": "P7",
        "title": "智能体协同",
        "bullets": [
            "任务理解智能体：识别目标，拆解 Plan",
            "证据质检智能体：检查材料完整度",
            "法规研究智能体：检索法规、案例和模板",
            "文书生成智能体：生成报告、函件、合同草稿",
            "交叉审查智能体：复核高风险内容",
            "合规监测智能体：导出前检查和审计记录",
        ],
        "figure": "fig-ppt-07-agent-collaboration.svg",
        "figure_note": "按图制作智能体环形协同关系。",
    },
    {
        "no": "P8",
        "title": "DAG 编排",
        "bullets": [
            "主路径：任务输入 → 任务理解 → 法规研究 → 文书生成 → 结果交付",
            "材料不足：触发证据质检",
            "引用不足：触发法规研究",
            "高风险或导出前：触发交叉审查与合规监测",
            "工具能力：搜索、法规检索、文档处理、代码执行、文书导出",
        ],
        "figure": "fig-ppt-08-dag-workflow.svg",
        "figure_note": "可直接参考此流程图制作 PPT 页面。",
    },
    {
        "no": "P9",
        "title": "可信复核",
        "bullets": [
            "Replay 回放：记录执行过程",
            "Snapshot 快照：保存阶段状态",
            "Audit Log 审计：记录关键操作",
            "权限分离：用户端与管理端边界清晰",
            "导出复核：高风险或导出前触发审查",
        ],
        "figure": "fig-ppt-09-trust-review.svg",
        "figure_note": "按图制作可信链路和四个机制。",
    },
    {
        "no": "P10",
        "title": "用户端闭环",
        "bullets": [
            "场景选择：合同审查、争议解决、法规研究、文书起草",
            "任务描述：目标、事实背景、关注重点、输出要求",
            "材料上传：合同、证据、章程、通知书、合规材料",
            "执行过程：DAG、智能体状态、工具调用、阶段进展",
            "结果导出：结论、依据、风险提示、DOCX/PDF",
        ],
        "figure": "fig-ppt-10-user-loop.svg",
        "figure2": "fig-ppt-10-run-local.svg",
        "figure_note": "整体图展示用户端流程，局部图展示执行页元素。",
    },
    {
        "no": "P11",
        "title": "管理端支撑",
        "bullets": [
            "模型与 API 配置",
            "法律知识库维护",
            "工作流与策略规则",
            "用户与会员标注",
            "后台配置影响前台任务效果",
        ],
        "figure": "fig-ppt-11-admin-support.svg",
        "figure2": "fig-ppt-11-admin-local.svg",
        "figure_note": "整体图展示管理端页面，局部图展示用户会员模块。",
    },
    {
        "no": "P12",
        "title": "商业方案",
        "bullets": [
            "个人端：体验版、专业版、旗舰版三档会员",
            "体验版 Trial：低门槛体验",
            "专业版 Pro：标准办案闭环",
            "旗舰版 Ultra：高频与深度能力",
            "机构端：私有化部署、专属知识库、行业工作流、工具 API 对接、运维服务",
        ],
        "figure": "fig-ppt-12-business-model.svg",
        "figure_note": "按图制作权益卡和机构定制条，不写具体金额。",
    },
    {
        "no": "P13",
        "title": "社会价值",
        "bullets": [
            "降低门槛：基础法律材料整理能力",
            "提升效率：减少重复检索与初稿整理",
            "合规治理：风险识别、整改建议、审计留痕",
            "教育实践：法规研究、案例推演、文书训练",
            "可复制推广：工作流包、工具包、知识库包迁移到更多场景",
        ],
        "figure": "fig-ppt-13-social-value.svg",
        "figure_note": "按图制作中心价值地图。",
    },
]


def esc(text: str) -> str:
    return html.escape(text, quote=False)


def figure_tag(name: str, class_name: str = "figure") -> str:
    return f'<img class="{class_name}" src="assets/ppt/{html.escape(name)}" alt="{html.escape(name)}">'


def build_html() -> str:
    toc_items = "\n".join(
        f"<li>{esc(page['no'])} {esc(page['title'])}</li>" for page in PAGES
    )
    page_blocks = []
    for page in PAGES:
        bullets = "\n".join(f"<li>{esc(item)}</li>" for item in page["bullets"])
        extra = f"<p class='extra'>{esc(page['extra'])}</p>" if page.get("extra") else ""
        fig = figure_tag(page["figure"])
        if page.get("figure2"):
            fig = (
                "<div class='two-figures'>"
                + figure_tag(page["figure"], "figure smallfig")
                + figure_tag(page["figure2"], "figure smallfig")
                + "</div>"
            )
        page_blocks.append(
            f"""
            <section class="page content-page">
              <div class="section-label">{esc(page['no'])} {esc(page['title'])}</div>
              <h2>{esc(page['title'])}</h2>
              <div class="copy">
                <div class="block-title">固定文案</div>
                <ul>{bullets}</ul>
                {extra}
                <div class="note"><b>制作提示：</b>{esc(page['figure_note'])}</div>
              </div>
              <div class="visual">
                {fig}
              </div>
            </section>
            """
        )
    page_html = "\n".join(page_blocks)
    return f"""<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <title>律枢 LexHub 答辩 PPT 设计师制作稿</title>
  <style>
    @page {{ size: A4; margin: 18mm 17mm; }}
    * {{ box-sizing: border-box; }}
    body {{
      margin: 0;
      color: #1b2636;
      font-family: "Microsoft YaHei", "SimHei", Arial, sans-serif;
      background: #fff;
      line-height: 1.5;
      font-size: 14px;
    }}
    .page {{
      page-break-after: always;
      min-height: 257mm;
      position: relative;
      padding: 0;
    }}
    .page:last-child {{ page-break-after: auto; }}
    .cover h1 {{
      margin: 0 0 18px;
      padding-top: 18mm;
      text-align: center;
      font-size: 28px;
      color: #123A63;
      font-weight: 800;
    }}
    .cover .subtitle {{
      text-align: center;
      font-size: 15px;
      color: #26384d;
      margin-bottom: 42px;
    }}
    .cover .meta {{
      width: 80%;
      margin: 0 auto 34px;
      border: 1px solid #d7e0ea;
      border-radius: 10px;
      padding: 18px 22px;
      background: #f6f8fa;
    }}
    .cover .meta p {{ margin: 8px 0; }}
    .lead {{
      width: 80%;
      margin: 0 auto;
      border-left: 6px solid #1C8CA8;
      padding: 12px 16px;
      background: #eef6f8;
      color: #123A63;
      font-weight: 700;
    }}
    h2 {{
      font-size: 24px;
      margin: 12px 0 18px;
      color: #123A63;
      border-bottom: 2px solid #123A63;
      padding-bottom: 8px;
    }}
    .section-label {{
      display: inline-block;
      background: #fff36b;
      color: #111;
      padding: 3px 8px;
      margin-top: 8px;
      font-weight: 700;
      font-size: 15px;
    }}
    .toc ol {{
      margin-top: 24px;
      columns: 2;
      column-gap: 44px;
      font-size: 16px;
    }}
    .toc li {{
      break-inside: avoid;
      margin: 0 0 12px;
    }}
    .rules {{
      margin-top: 28px;
      border: 1px solid #d7e0ea;
      border-radius: 10px;
      padding: 14px 18px;
      background: #f6f8fa;
    }}
    .rules ul {{ margin: 8px 0 0 20px; }}
    .copy {{
      border: 1px solid #d7e0ea;
      border-radius: 10px;
      padding: 11px 15px;
      background: #fbfcfd;
      margin-bottom: 12px;
    }}
    .block-title {{
      font-size: 16px;
      font-weight: 800;
      color: #123A63;
      margin-bottom: 8px;
    }}
    ul {{ margin: 0 0 0 20px; padding: 0; }}
    li {{ margin: 0 0 4px; }}
    .extra {{
      margin-top: 10px;
      padding-top: 10px;
      border-top: 1px dashed #d7e0ea;
      color: #123A63;
    }}
    .note {{
      margin-top: 8px;
      border-left: 4px solid #D99A2B;
      background: #fff8e8;
      padding: 7px 10px;
      color: #26384d;
      font-size: 13px;
    }}
    .visual {{
      text-align: center;
    }}
    .figure {{
      width: 100%;
      max-height: 166mm;
      object-fit: contain;
      border: 1px solid #d7e0ea;
      border-radius: 8px;
      background: #f6f8fa;
    }}
    .two-figures {{
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }}
    .smallfig {{
      max-height: 128mm;
    }}
    .footer-note {{
      position: absolute;
      bottom: 2mm;
      left: 0;
      right: 0;
      font-size: 11px;
      color: #6b7280;
      text-align: center;
    }}
  </style>
</head>
<body>
  <section class="page cover">
    <h1>律枢 LexHub 答辩 PPT 设计师制作稿</h1>
    <div class="subtitle">基于 Co-Sight 的法律行业超级智能体工作台</div>
    <div class="meta">
      <p><b>团队名称：</b>六百六十六</p>
      <p><b>制作范围：</b>封面、封底沿用已有底板；本文只说明正文 13 页。</p>
      <p><b>制作方式：</b>每页按“页面标题 + 固定文案 + 配图”制作，设计师可自行美化。</p>
      <p><b>视觉风格：</b>深蓝、青蓝、金色；竞赛答辩风；图形化；少文字；不写具体金额。</p>
    </div>
    <div class="lead">交付目标：让设计师不需要理解全部工程细节，也能按页完成排版。</div>
  </section>

  <section class="page toc">
    <div class="section-label">目录</div>
    <h2>正文页结构</h2>
    <ol>{toc_items}</ol>
    <div class="rules">
      <b>统一要求</b>
      <ul>
        <li>每页只保留一个标题。</li>
        <li>正文尽量保留 3-5 个短句。</li>
        <li>优先使用真实系统截图；示意图可直接使用或照着重画。</li>
        <li>图形统一深蓝、青蓝、金色风格。</li>
      </ul>
    </div>
  </section>

  {page_html}
</body>
</html>
"""


def main() -> None:
    OUT_HTML.write_text(build_html(), encoding="utf-8")
    chrome = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    if not chrome.exists():
        chrome = Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe")
    cmd = [
        str(chrome),
        "--headless=new",
        "--disable-gpu",
        "--no-pdf-header-footer",
        f"--print-to-pdf={OUT_PDF}",
        OUT_HTML.as_uri(),
    ]
    subprocess.run(cmd, check=True)
    print(OUT_HTML)
    print(OUT_PDF)


if __name__ == "__main__":
    main()
