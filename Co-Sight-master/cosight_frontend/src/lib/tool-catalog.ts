import { TOOLCHAIN_CATEGORIES } from './cosight-narrative';

export type ToolCategoryId = typeof TOOLCHAIN_CATEGORIES[number]['id'];

export function resolveToolCategory(toolName: string): ToolCategoryId | 'other' {
  const normalized = toolName.toLowerCase();
  const matched = TOOLCHAIN_CATEGORIES.find((category) =>
    category.examples.some((example) => normalized.includes(example)),
  );
  return matched?.id ?? 'other';
}

export function resolveToolCategoryLabel(toolName: string): string {
  const category = resolveToolCategory(toolName);
  if (category === 'other') return '通用工具';
  return TOOLCHAIN_CATEGORIES.find((item) => item.id === category)?.label ?? '通用工具';
}

export function summarizeToolCategories(toolNames: string[]) {
  const counts = new Map<string, number>();
  toolNames.forEach((name) => {
    const label = resolveToolCategoryLabel(name);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  });
  return [...counts.entries()].map(([label, count]) => ({ label, count }));
}
