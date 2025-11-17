import type {
  ChatSession,
  ChatStreamEvent,
  MessagePayload,
  SessionConnectionState,
} from './types';
import { buildWsUrl, request } from './request';

const fetchSession = (sessionId: string): Promise<ChatSession> =>
  request(`/chat/sessions/${sessionId}/messages`);

const sendMessage = (sessionId: string, payload: MessagePayload): Promise<ChatSession> =>
  request(`/chat/sessions/${sessionId}/messages`, {
    method: 'POST',
    data: payload,
  });

const deleteSession = (sessionId: string): Promise<void> =>
  request(`/chat/sessions/${sessionId}`, { method: 'DELETE' });

const subscribeToSession = (
  sessionId: string,
  onEvent: (event: ChatStreamEvent) => void,
  onStateChange?: (state: SessionConnectionState) => void,
): (() => void) => {
  if (typeof window === 'undefined' || typeof window.WebSocket === 'undefined') {
    onStateChange?.('closed');
    return () => undefined;
  }

  let socket: WebSocket | null = null;
  try {
    socket = new WebSocket(buildWsUrl(`/chat/sessions/${sessionId}/ws`));
  } catch (error) {
    console.error('Unable to open chat websocket connection', error);
    onStateChange?.('closed');
    return () => undefined;
  }

  onStateChange?.('connecting');

  socket.onopen = () => onStateChange?.('open');
  socket.onclose = () => onStateChange?.('closed');
  socket.onerror = () => onStateChange?.('closed');
  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as ChatStreamEvent;
      onEvent(payload);
    } catch (error) {
      console.error('Unable to parse chat event', error);
    }
  };

  return () => {
    socket?.close();
  };
};

export { deleteSession, fetchSession, sendMessage, subscribeToSession };
