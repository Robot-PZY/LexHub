import { useMemo } from 'react';
import type { ChatMessage } from '../../types/chat';
import { compactSessionMessages, feedMessageLabel, formatFeedContent } from '../../lib/feed-utils';

type SessionFeedProps = {
  messages: ChatMessage[];
  connectionLabel: string;
};

function SessionFeed({ messages, connectionLabel }: SessionFeedProps) {
  const displayMessages = useMemo(() => compactSessionMessages(messages), [messages]);

  const getMessageClass = (message: ChatMessage) => {
    if (message.messageType === 'lui-message-tool-event') {
      if (message.content.includes('执行失败') || message.content.includes('出错')) {
        return 'system-tool-event system-tool-error';
      }
      return 'system-tool-event';
    }
    if (message.messageType === 'lui-message-manus-step') {
      return 'system-step-update';
    }
    if (message.messageType === 'control-status-message') {
      return 'system-complete-event';
    }
    return '';
  };

  return (
    <section className="records-panel-react session-feed-react">
      <div className="records-head-react">
        <strong>阶段事件</strong>
        <span className="workspace-side-caption-react">{connectionLabel} · 处理动作见右下角提示</span>
      </div>
      <div className="session-feed-list-react">
        {displayMessages.length === 0 && (
          <article className="session-message-react empty">
            <strong>尚未启动事项</strong>
            <span>提交事项后，这里会按时间记录阶段推进、处理动作和系统输出。</span>
          </article>
        )}
        {displayMessages.map((message) => (
          <article
            key={message.id}
            className={`session-message-react ${message.role} ${getMessageClass(message)}`}
          >
            <div className="session-message-head-react">
              <div className="message-header-info">
                <strong>{feedMessageLabel(message)}</strong>
                {message.messageType && message.role !== 'human' ? (
                  <span className={`message-type-tag${message.content.includes('失败') ? ' error' : ''}`}>
                    {message.messageType === 'lui-message-tool-event' ? 'Action' : 'Plan'}
                  </span>
                ) : null}
              </div>
              <time>{new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}</time>
            </div>
            <p>{formatFeedContent(message)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export default SessionFeed;
