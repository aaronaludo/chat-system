import { useMemo } from 'react';
import type { ChatMessage } from '../api/chatClientApis';

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: 'numeric',
  minute: '2-digit',
});

interface MessageBubbleProps {
  message: ChatMessage;
  viewerName?: string;
}

const MessageBubble = ({ message, viewerName }: MessageBubbleProps) => {
  const isUser = message.role === 'user';
  const authorName = typeof message.author_name === 'string' ? message.author_name.trim() : '';
  const displayName = authorName || (isUser ? 'You' : 'Assistant');
  const normalizedViewerName =
    typeof viewerName === 'string' ? viewerName.trim().toLocaleLowerCase('en-US') : '';
  const normalizedAuthorName = authorName.toLocaleLowerCase('en-US');
  const isViewerMessage =
    Boolean(normalizedViewerName) && Boolean(normalizedAuthorName) && normalizedViewerName === normalizedAuthorName;
  const alignmentClass = isViewerMessage || (!normalizedViewerName && isUser) ? 'outbound' : 'inbound';
  const timestamp = useMemo(() => {
    try {
      return timeFormatter.format(new Date(message.created_at));
    } catch {
      return '';
    }
  }, [message.created_at]);

  return (
    <div className={`message-row ${alignmentClass}`}>
      <div className="message-meta">
        <span className="message-role">{displayName}</span>
        <span className="message-timestamp">{timestamp}</span>
      </div>
      <div className="message-body">
        <p>{message.content}</p>
      </div>
    </div>
  );
};

export default MessageBubble;
