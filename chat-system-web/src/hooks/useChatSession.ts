import { useCallback, useEffect } from 'react';
import { subscribeToSession } from '../api/chatClientApis';
import type { ChatStreamEvent } from '../api/chatClientApis';
import {
  appendMessage,
  clearChatHistory,
  createChatContextState,
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
const FALLBACK_SCOPE_STATE = createChatContextState();

export interface UseChatSessionOptions {
  initialSessionId?: string;
  persist?: boolean;
  storageKey?: string;
  scope?: string;
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

const createEventHandler = (dispatch: AppDispatch, scope: string) => (event: ChatStreamEvent) => {
  switch (event.type) {
    case 'session.sync':
      dispatch(syncMessages({ scope, messages: event.session.messages }));
      dispatch(setError({ scope, error: null }));
      break;
    case 'message.created':
      dispatch(appendMessage({ scope, message: event.message }));
      break;
    case 'session.cleared':
      dispatch(resetMessages({ scope }));
      break;
    case 'error':
      dispatch(setError({ scope, error: event.detail }));
      break;
    default:
      break;
  }
};

export const useChatSession = (options?: UseChatSessionOptions) => {
  const { initialSessionId, persist = true, storageKey, scope = 'default' } = options ?? {};
  const resolvedStorageKey =
    storageKey ?? (scope === 'default' ? DEFAULT_SESSION_STORAGE_KEY : `${DEFAULT_SESSION_STORAGE_KEY}.${scope}`);
  const dispatch = useAppDispatch();
  const { sessionId, messages, isLoading, isSending, error, connectionState } = useAppSelector(
    (state) => state.chat.contexts[scope] ?? FALLBACK_SCOPE_STATE,
  );

  useEffect(() => {
    if (!initialSessionId) {
      return;
    }
    if (sessionId === initialSessionId) {
      return;
    }
    dispatch(resetMessages({ scope }));
    dispatch(setError({ scope, error: null }));
    dispatch(setConnectionState({ scope, connectionState: 'idle' }));
    dispatch(setSessionId({ scope, sessionId: initialSessionId }));
    if (persist) {
      persistSessionId(resolvedStorageKey, initialSessionId);
    }
  }, [dispatch, initialSessionId, persist, resolvedStorageKey, scope, sessionId]);

  useEffect(() => {
    if (sessionId || initialSessionId) {
      if (!initialSessionId && sessionId && persist) {
        persistSessionId(resolvedStorageKey, sessionId);
      }
      return;
    }
    let nextSessionId = persist ? getStoredSessionId(resolvedStorageKey) : '';
    if (!nextSessionId) {
      nextSessionId = createSessionId();
    }
    dispatch(setSessionId({ scope, sessionId: nextSessionId }));
    if (persist) {
      persistSessionId(resolvedStorageKey, nextSessionId);
    }
  }, [dispatch, initialSessionId, persist, resolvedStorageKey, scope, sessionId]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    dispatch(loadSession({ scope, sessionId }));

    const disconnect = subscribeToSession(
      sessionId,
      createEventHandler(dispatch, scope),
      (state) => dispatch(setConnectionState({ scope, connectionState: state })),
    );

    return () => {
      disconnect();
    };
  }, [dispatch, scope, sessionId]);

  const sendUserMessage = useCallback(
    async (content: string, authorName?: string) => {
      if (!sessionId) {
        return;
      }
      await dispatch(sendChatMessage({ scope, sessionId, content, authorName })).unwrap();
    },
    [dispatch, scope, sessionId],
  );

  const clearConversation = useCallback(async () => {
    if (!sessionId) {
      return;
    }
    await dispatch(clearChatHistory({ scope, sessionId })).unwrap();
  }, [dispatch, scope, sessionId]);

  const activateSession = useCallback(
    (nextId: string) => {
      if (!nextId || nextId === sessionId) {
        return;
      }
      dispatch(resetMessages({ scope }));
      dispatch(setError({ scope, error: null }));
      dispatch(setConnectionState({ scope, connectionState: 'idle' }));
      dispatch(setSessionId({ scope, sessionId: nextId }));
      if (persist) {
        persistSessionId(resolvedStorageKey, nextId);
      }
    },
    [dispatch, persist, resolvedStorageKey, scope, sessionId],
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
