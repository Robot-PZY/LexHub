type SanitizePhaseNoteContext = {
  stepIndex: number;
  stepCount: number;
  stepTitle: string;
  completed: boolean;
};

function basenameFromPath(value: string): string {
  const normalized = value.replace(/\\/g, '/');
  const parts = normalized.split('/');
  return parts[parts.length - 1] || value;
}

export function sanitizePhaseNote(note: string, context: SanitizePhaseNoteContext): string {
  let text = (note || '').trim();
  if (!text) return '';

  text = text.replace(/[A-Za-z]:[\\/][^\s\n`"'<>|]+/g, (match) => {
    const name = basenameFromPath(match);
    return name ? `\`${name}\`` : match;
  });

  text = text.replace(/(?:^|\n)\s*[-*]\s*`([^`]+)`\s*$/gm, (_line, file: string) => `\n- 产出文件：${file}`);

  text = text.replace(/\*?\*?下一步建议\*?\*?[：:][^\n]*/gi, '');
  text = text.replace(/步骤\s*0/gi, '前置准备');
  text = text.replace(/步骤\s*(\d+)/gi, (_full, num: string) => `步骤 ${num}`);

  if (context.completed) {
    text = text.replace(/建议继续执行步骤\s*\d+[^。\n]*/gi, '');
    text = text.replace(/该步骤依赖于[^。\n]*/gi, '');
  }

  text = text.replace(/\n{3,}/g, '\n\n').trim();

  if (!text && context.completed) {
    return `本步「${context.stepTitle}」已完成，详细内容已写入历史回放。`;
  }

  return text;
}

export function buildStepNextHint(context: SanitizePhaseNoteContext): string | null {
  if (context.completed) {
    if (context.stepIndex >= context.stepCount - 1) {
      return '全部步骤已完成，可前往审查结论页查看总结报告与正式交付物。';
    }
    return `本步已完成。可继续查看后续步骤，或前往审查结论页获取完整报告。`;
  }

  if (context.stepIndex < context.stepCount - 1) {
    return `本步完成后，系统将按办理路径继续推进后续步骤。`;
  }

  return '最后一步办理中，完成后将生成事项总结。';
}
