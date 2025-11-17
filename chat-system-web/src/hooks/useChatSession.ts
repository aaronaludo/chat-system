import { useCallback, useEffect } from 'react';
import { subscribeToSession } from '../api/chatClientApis';
import type { ChatStreamEvent } from '../api/chatClientApis';
import {
  appendMessage,
  clearChatHistory,
  loadSession,
  resetMessages,
  sendChatMessage,
  setConnectionState,
  setError,
  setSessionId,
  syncMessages,
} from '../features/chat/chatSlice';
import type { AppDispatch } from '../store';
import { useAppDispatch, useAppSelector } from '../store/hooks';

const DEFAULT_SESSION_STORAGE_KEY = 'chatsystem.session-id';

export interface UseChatSessionOptions {
  initialSessionId?: string;
  persist?: boolean;
  storageKey?: string;
}

const createSessionId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `session-${Math.random().toString(36).slice(2, 10)}`;
};

const getStoredSessionId = (storageKey: string): string => {
  if (typeof window === 'undefined') {
    return '';
  }
  return window.localStorage.getItem(storageKey) ?? '';
};

const persistSessionId = (storageKey: string, sessionId: string) => {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(storageKey, sessionId);
};

const createEventHandler = (dispatch: AppDispatch) => (event: ChatStreamEvent) => {
  switch (event.type) {
    case 'session.sync':
      dispatch(syncMessages(event.session.messages));
      dispatch(setError(null));
      break;
    case 'message.created':
      dispatch(appendMessage(event.message));
      break;
    case 'session.cleared':
      dispatch(resetMessages());
      break;
    case 'error':
      dispatch(setError(event.detail));
      break;
    default:
      break;
  }
};

export const useChatSession = (options?: UseChatSessionOptions) => {
  const { initialSessionId, persist = true, storageKey = DEFAULT_SESSION_STORAGE_KEY } = options ?? {};
  const dispatch = useAppDispatch();
  const { sessionId, messages, isLoading, isSending, error, connectionState } = useAppSelector((state) => state.chat);

  useEffect(() => {
    if (!initialSessionId) {
      return;
    }
    if (sessionId === initialSessionId) {
      return;
    }
    dispatch(setSessionId(initialSessionId));
  }, [dispatch, initialSessionId, sessionId]);

  useEffect(() => {
    if (sessionId || initialSessionId) {
      if (!initialSessionId && sessionId && persist) {
        persistSessionId(storageKey, sessionId);
      }
      return;
    }
    let nextSessionId = persist ? getStoredSessionId(storageKey) : '';
    if (!nextSessionId) {
      nextSessionId = createSessionId();
    }
    dispatch(setSessionId(nextSessionId));
    if (persist) {
      persistSessionId(storageKey, nextSessionId);
    }
  }, [dispatch, initialSessionId, persist, sessionId, storageKey]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    dispatch(loadSession(sessionId));

    const disconnect = subscribeToSession(
      sessionId,
      createEventHandler(dispatch),
      (state) => dispatch(setConnectionState(state)),
    );

    return () => {
      disconnect();
    };
  }, [dispatch, sessionId]);

  const sendUserMessage = useCallback(
    async (content: string, authorName?: string) => {
      if (!sessionId) {
        return;
      }
      await dispatch(sendChatMessage({ sessionId, content, authorName })).unwrap();
    },
    [dispatch, sessionId],
  );

  const clearConversation = useCallback(async () => {
    if (!sessionId) {
      return;
    }
    await dispatch(clearChatHistory(sessionId)).unwrap();
  }, [dispatch, sessionId]);

  const activateSession = useCallback(
    (nextId: string) => {
      if (!nextId || nextId === sessionId) {
        return;
      }
      dispatch(resetMessages());
      dispatch(setError(null));
      dispatch(setConnectionState('idle'));
      dispatch(setSessionId(nextId));
      if (persist) {
        persistSessionId(storageKey, nextId);
      }
    },
    [dispatch, persist, sessionId, storageKey],
  );

  const startNewSession = useCallback(
    (preferredId?: string) => {
      if (initialSessionId) {
        return;
      }
      const normalized = preferredId?.trim();
      const nextId = normalized && normalized.length > 0 ? normalized : createSessionId();
      activateSession(nextId);
    },
    [activateSession, initialSessionId],
  );

  const joinSession = useCallback(
    (targetId: string) => {
      if (initialSessionId) {
        return;
      }
      const normalized = targetId.trim();
      if (!normalized) {
        return;
      }
      activateSession(normalized);
    },
    [activateSession, initialSessionId],
  );

  return {
    sessionId,
    messages,
    isLoading,
    isSending,
    error,
    connectionState,
    sendUserMessage,
    clearConversation,
    startNewSession,
    joinSession,
  };
};

export type UseChatSessionReturn = ReturnType<typeof useChatSession>;
