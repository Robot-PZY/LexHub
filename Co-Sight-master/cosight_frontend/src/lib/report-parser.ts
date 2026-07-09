export type ReportSection = {
  title: string;
  body: string;
  level: number;
};

export function parseMarkdownSections(markdown: string): ReportSection[] {
  const text = (markdown || '').trim();
  if (!text) return [];

  const lines = text.split('\n');
  const sections: ReportSection[] = [];
  let currentTitle = '办理摘要';
  let currentLevel = 2;
  let buffer: string[] = [];

  const flush = () => {
    const body = buffer.join('\n').trim();
    if (body) sections.push({ title: currentTitle, body, level: currentLevel });
    buffer = [];
  };

  for (const line of lines) {
    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      flush();
      currentLevel = heading[1].length;
      currentTitle = heading[2].trim();
      continue;
    }
    buffer.push(line);
  }
  flush();

  if (sections.length === 0) {
    return [{ title: '办理摘要', body: text, level: 2 }];
  }
  return sections;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineMarkdown(text: string): string {
  let html = escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  html = html
    .replace(/高风险/g, '<span class="report-risk-badge high">高风险</span>')
    .replace(/中风险|中等风险/g, '<span class="report-risk-badge medium">中风险</span>')
    .replace(/低风险/g, '<span class="report-risk-badge low">低风险</span>');

  return html;
}

function decorateTableCell(cell: string): string {
  const trimmed = cell.trim();
  if (/🔴|高风险/.test(trimmed)) {
    return `<td class="risk-cell high">${inlineMarkdown(trimmed)}</td>`;
  }
  if (/🟡|中风险|中等风险/.test(trimmed)) {
    return `<td class="risk-cell medium">${inlineMarkdown(trimmed)}</td>`;
  }
  if (/🟢|低风险/.test(trimmed)) {
    return `<td class="risk-cell low">${inlineMarkdown(trimmed)}</td>`;
  }
  return `<td>${inlineMarkdown(trimmed)}</td>`;
}

export function renderMarkdownHtml(markdown: string): string {
  const lines = (markdown || '').split('\n');
  const html: string[] = [];
  let inList = false;
  let listType: 'ul' | 'ol' | null = null;
  let inTable = false;

  const closeList = () => {
    if (inList && listType) {
      html.push(listType === 'ol' ? '</ol>' : '</ul>');
      inList = false;
      listType = null;
    }
  };

  const closeTable = () => {
    if (inTable) {
      html.push('</tbody></table>');
      inTable = false;
    }
  };

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (!line.trim()) {
      closeList();
      closeTable();
      continue;
    }

    if (line.startsWith('|') && line.includes('|')) {
      closeList();
      const cells = line.split('|').map((cell) => cell.trim()).filter(Boolean);
      if (line.includes('---')) continue;
      if (!inTable) {
        html.push('<table class="report-md-table"><tbody>');
        inTable = true;
        html.push(`<tr>${cells.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr>`);
      } else {
        html.push(`<tr>${cells.map((cell) => decorateTableCell(cell)).join('')}</tr>`);
      }
      continue;
    }

    closeTable();

    const heading = line.match(/^(#{1,4})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = heading[1].length;
      html.push(`<h${Math.min(level + 2, 6)}>${inlineMarkdown(heading[2])}</h${Math.min(level + 2, 6)}>`);
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      if (!inList || listType !== 'ul') {
        closeList();
        html.push('<ul>');
        inList = true;
        listType = 'ul';
      }
      html.push(`<li>${inlineMarkdown(line.replace(/^[-*]\s+/, ''))}</li>`);
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      if (!inList || listType !== 'ol') {
        closeList();
        html.push('<ol class="report-md-ol">');
        inList = true;
        listType = 'ol';
      }
      html.push(`<li>${inlineMarkdown(line.replace(/^\d+\.\s+/, ''))}</li>`);
      continue;
    }

    if (line.startsWith('>')) {
      closeList();
      html.push(`<blockquote class="report-md-quote">${inlineMarkdown(line.replace(/^>\s?/, ''))}</blockquote>`);
      continue;
    }

    closeList();
    html.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList();
  closeTable();
  return html.join('');
}
