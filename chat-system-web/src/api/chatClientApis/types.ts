export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  created_at: string;
  author_name?: string | null;
}

export interface ChatSession {
  session_id: string;
  messages: ChatMessage[];
}

export type ChatStreamEvent =
  | { type: 'session.sync'; session: ChatSession }
  | { type: 'message.created'; session_id: string; message: ChatMessage }
  | { type: 'session.cleared'; session_id: string }
  | { type: 'error'; detail: string };

export type SessionConnectionState = 'idle' | 'connecting' | 'open' | 'closed';

export interface MessagePayload {
  role: ChatRole;
  content: string;
  author_name?: string;
}
