import { Wrench } from 'lucide-react';
import type { ToolCallTrace } from '../../types/chat';
import { TOOLCHAIN_CATEGORIES } from '../../lib/cosight-narrative';
import { resolveToolCategory, resolveToolCategoryLabel, summarizeToolCategories } from '../../lib/tool-catalog';

type ToolchainSummaryPanelProps = {
  toolCalls: ToolCallTrace[];
};

function ToolchainSummaryPanel({ toolCalls }: ToolchainSummaryPanelProps) {
  const uniqueTools = [...new Set(toolCalls.map((tool) => tool.toolName))];
  const categories = summarizeToolCategories(uniqueTools);
  const activeCategoryCount = categories.length;

  return (
    <section className="ds-card toolchain-summary-panel">
      <div className="toolchain-summary-head">
        <Wrench size={18} />
        <div>
          <strong>处理能力覆盖</strong>
          <span>当前事项已触发 {activeCategoryCount} 类能力</span>
        </div>
      </div>

      <div className="toolchain-category-grid">
        {TOOLCHAIN_CATEGORIES.map((category) => {
          const matchedTools = uniqueTools.filter((tool) => resolveToolCategory(tool) === category.id);
          const active = matchedTools.length > 0;
          return (
            <article key={category.id} className={`toolchain-category-card ${active ? 'active' : ''}`}>
              <strong>{category.label}</strong>
              <span>{active ? `${matchedTools.length} 个动作` : '待触发'}</span>
              <em>{active ? matchedTools.join('、') : category.examples.join(' / ')}</em>
            </article>
          );
        })}
      </div>

      {toolCalls.length > 0 && (
        <div className="toolchain-recent">
          <span>最近处理</span>
          <div className="toolchain-recent-list">
            {toolCalls.slice(0, 4).map((tool) => (
              <span key={tool.id} className="ds-chip">
                {resolveToolCategoryLabel(tool.toolName)} · {tool.toolName}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default ToolchainSummaryPanel;
