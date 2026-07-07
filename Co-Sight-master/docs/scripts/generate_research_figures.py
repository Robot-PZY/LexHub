from __future__ import annotations

import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "figure-data" / "metrics-baseline.json"
ASSET_DIR = ROOT / "assets"


def esc(text: object) -> str:
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def svg_header(width: int, height: int, title: str) -> list[str]:
    return [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}">',
        "<defs>",
        "<style>",
        ".bg{fill:#ffffff}.title{font:700 30px 'Microsoft YaHei',Arial;fill:#1f2937}",
        ".h{font:700 16px 'Microsoft YaHei',Arial;fill:#1f3a5f}",
        ".s{font:500 13px 'Microsoft YaHei',Arial;fill:#64748b}",
        ".axis{stroke:#9ca3af;stroke-width:1.5}.grid{stroke:#e5e7eb;stroke-width:1}",
        ".base{fill:#cbd5e1}.lex{fill:#2f5597}.cell{fill:#f8fafc;stroke:#cbd5e1;stroke-width:1}",
        "</style>",
        "</defs>",
        '<rect class="bg" width="100%" height="100%"/>',
        f'<text class="title" x="56" y="58">{esc(title)}</text>',
    ]


def write_svg(path: Path, lines: list[str]) -> None:
    path.write_text("\n".join(lines + ["</svg>", ""]), encoding="utf-8")


def draw_metric_bars(data: dict) -> None:
    metrics = data["metrics"]
    width, height = 1280, 760
    left, top = 270, 115
    chart_w, row_h = 820, 95
    max_value = 100

    lines = svg_header(width, height, "端到端任务指标对比")
    lines += [
        '<text class="s" x="56" y="88">演示基准：传统处理方式 vs LexHub 任务链路</text>',
        f'<line class="axis" x1="{left}" y1="{top}" x2="{left}" y2="{top + row_h * len(metrics)}"/>',
        f'<line class="axis" x1="{left}" y1="{top + row_h * len(metrics)}" x2="{left + chart_w}" y2="{top + row_h * len(metrics)}"/>',
    ]
    for tick in range(0, 101, 20):
        x = left + chart_w * tick / max_value
        lines.append(f'<line class="grid" x1="{x:.1f}" y1="{top}" x2="{x:.1f}" y2="{top + row_h * len(metrics)}"/>')
        lines.append(f'<text class="s" x="{x - 8:.1f}" y="{top + row_h * len(metrics) + 24}">{tick}</text>')

    for i, metric in enumerate(metrics):
        y = top + i * row_h + 18
        label = metric["label"]
        trad = metric["traditional"]
        lex = metric["lexhub"]
        unit = metric["unit"]
        trad_w = chart_w * min(trad, 100) / max_value
        lex_w = chart_w * min(lex, 100) / max_value
        if metric["direction"] == "lower_better":
            # Convert time into visual efficiency score for comparable bar length.
            trad_score = 100 * (1 / trad) / (1 / lex)
            lex_score = 100
            trad_w = chart_w * trad_score / max_value
            lex_w = chart_w
        lines += [
            f'<text class="h" x="56" y="{y + 16}">{esc(label)}</text>',
            f'<text class="s" x="56" y="{y + 38}">{esc(metric["note"])}</text>',
            f'<rect class="base" x="{left}" y="{y}" width="{trad_w:.1f}" height="20" rx="4"/>',
            f'<rect class="lex" x="{left}" y="{y + 32}" width="{lex_w:.1f}" height="20" rx="4"/>',
            f'<text class="s" x="{left + trad_w + 8:.1f}" y="{y + 15}">传统：{trad}{unit}</text>',
            f'<text class="s" x="{left + lex_w + 8:.1f}" y="{y + 47}">LexHub：{lex}{unit}</text>',
        ]

    lines += [
        '<rect class="base" x="900" y="62" width="20" height="12" rx="2"/>',
        '<text class="s" x="928" y="73">传统方式</text>',
        '<rect class="lex" x="1015" y="62" width="20" height="12" rx="2"/>',
        '<text class="s" x="1043" y="73">LexHub</text>',
    ]
    write_svg(ASSET_DIR / "fig-5-2-research-metric-bars.svg", lines)


def draw_evidence_matrix(data: dict) -> None:
    rows = data["evidence_matrix"]
    width, height = 1280, 720
    x0, y0 = 70, 120
    col_w = [245, 275, 275, 275]
    row_h = 72
    headers = ["评审关注点", "代码/配置证据", "页面/服务证据", "文档/运行证据"]

    lines = svg_header(width, height, "交付证据矩阵")
    lines.append('<text class="s" x="56" y="88">将赛题要求映射到可检查的文件、页面和运行记录</text>')
    x = x0
    for j, header in enumerate(headers):
        lines.append(f'<rect class="cell" x="{x}" y="{y0}" width="{col_w[j]}" height="46"/>')
        lines.append(f'<text class="h" x="{x + 14}" y="{y0 + 29}">{esc(header)}</text>')
        x += col_w[j]
    for i, row in enumerate(rows):
        y = y0 + 46 + i * row_h
        x = x0
        for j, cell in enumerate(row):
            lines.append(f'<rect class="cell" x="{x}" y="{y}" width="{col_w[j]}" height="{row_h}"/>')
            parts = str(cell).split("、") if "、" in str(cell) else str(cell).split(", ")
            lines.append(f'<text class="s" x="{x + 14}" y="{y + 28}">{esc(parts[0])}</text>')
            if len(parts) > 1:
                lines.append(f'<text class="s" x="{x + 14}" y="{y + 50}">{esc(" / ".join(parts[1:]))}</text>')
            x += col_w[j]
    write_svg(ASSET_DIR / "fig-a-1-evidence-matrix.svg", lines)


def draw_legal_source_map(data: dict) -> None:
    rows = data["legal_sources"]
    width, height = 1280, 780
    x0, y0 = 64, 126
    row_h = 76
    col_w = [150, 230, 390, 300]
    headers = ["来源层级", "权威来源", "主要内容", "进入 LexHub 后的用途"]

    lines = svg_header(width, height, "法律知识来源与入库用途")
    lines.append('<text class="s" x="56" y="88">权威公开来源、本地知识库与任务执行链路的对应关系</text>')

    x = x0
    for j, header in enumerate(headers):
        lines.append(f'<rect class="cell" x="{x}" y="{y0}" width="{col_w[j]}" height="48"/>')
        lines.append(f'<text class="h" x="{x + 14}" y="{y0 + 30}">{esc(header)}</text>')
        x += col_w[j]

    for i, row in enumerate(rows):
        y = y0 + 48 + i * row_h
        x = x0
        for j, cell in enumerate(row):
            fill = "#f8fafc"
            if j == 0:
                fill = "#eef4ff"
            if j == 3:
                fill = "#f9fafb"
            lines.append(
                f'<rect x="{x}" y="{y}" width="{col_w[j]}" height="{row_h}" '
                f'fill="{fill}" stroke="#cbd5e1" stroke-width="1"/>'
            )
            text = str(cell)
            if len(text) > 22 and j in (2, 3):
                cut = 22 if j == 2 else 18
                lines.append(f'<text class="s" x="{x + 14}" y="{y + 30}">{esc(text[:cut])}</text>')
                lines.append(f'<text class="s" x="{x + 14}" y="{y + 52}">{esc(text[cut:])}</text>')
            else:
                cls = "h" if j == 0 else "s"
                lines.append(f'<text class="{cls}" x="{x + 14}" y="{y + 42}">{esc(text)}</text>')
            x += col_w[j]

    # Simple pipeline cue.
    lines += [
        '<line x1="1068" y1="210" x2="1168" y2="210" stroke="#2f5597" stroke-width="2"/>',
        '<path d="M1168 210 l-10 -6 v12 z" fill="#2f5597"/>',
        '<rect x="1176" y="174" width="70" height="72" rx="6" fill="#eef4ff" stroke="#2f5597"/>',
        '<text class="h" x="1192" y="204">检索</text>',
        '<text class="h" x="1192" y="228">增强</text>',
        '<line x1="1068" y1="438" x2="1168" y2="438" stroke="#2f5597" stroke-width="2"/>',
        '<path d="M1168 438 l-10 -6 v12 z" fill="#2f5597"/>',
        '<rect x="1176" y="402" width="70" height="72" rx="6" fill="#eef4ff" stroke="#2f5597"/>',
        '<text class="h" x="1192" y="432">文书</text>',
        '<text class="h" x="1192" y="456">依据</text>',
    ]
    write_svg(ASSET_DIR / "fig-b-1-legal-source-map.svg", lines)


def main() -> None:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    data = json.loads(DATA_PATH.read_text(encoding="utf-8"))
    draw_metric_bars(data)
    draw_evidence_matrix(data)
    draw_legal_source_map(data)


if __name__ == "__main__":
    main()
