import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { deleteSession, fetchSession, sendMessage } from '../../api/chatClientApis';
import type { ChatMessage, ChatSession, SessionConnectionState } from '../../api/chatClientApis';

export interface ChatContextState {
  sessionId: string;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  connectionState: SessionConnectionState;
}

interface ChatState {
  contexts: Record<string, ChatContextState>;
}

export const createChatContextState = (): ChatContextState => ({
  sessionId: '',
  messages: [],
  isLoading: false,
  isSending: false,
  error: null,
  connectionState: 'idle',
});

const initialState: ChatState = {
  contexts: {
    default: createChatContextState(),
  },
};

const ensureContext = (state: ChatState, scope: string): ChatContextState => {
  if (!state.contexts[scope]) {
    state.contexts[scope] = createChatContextState();
  }
  return state.contexts[scope];
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const loadSession = createAsyncThunk<ChatSession, { scope: string; sessionId: string }, { rejectValue: string }>(
  'chat/loadSession',
  async ({ sessionId }, { rejectWithValue }) => {
    try {
      return await fetchSession(sessionId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Unable to load chat history'));
    }
  },
);

export const sendChatMessage = createAsyncThunk<
  void,
  { scope: string; sessionId: string; content: string; authorName?: string },
  { rejectValue: string }
>('chat/sendChatMessage', async ({ sessionId, content, authorName }, { rejectWithValue }) => {
  try {
    const payload = {
      role: 'user' as const,
      content,
      ...(authorName ? { author_name: authorName } : {}),
    };
    await sendMessage(sessionId, payload);
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Unable to send message right now'));
  }
});

export const clearChatHistory = createAsyncThunk<void, { scope: string; sessionId: string }, { rejectValue: string }>(
  'chat/clearChatHistory',
  async ({ sessionId }, { rejectWithValue }) => {
    try {
      await deleteSession(sessionId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Unable to clear the current session'));
    }
  },
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSessionId: (state, action: PayloadAction<{ scope: string; sessionId: string }>) => {
      ensureContext(state, action.payload.scope).sessionId = action.payload.sessionId;
    },
    syncMessages: (state, action: PayloadAction<{ scope: string; messages: ChatMessage[] }>) => {
      const context = ensureContext(state, action.payload.scope);
      context.messages = action.payload.messages;
      context.error = null;
    },
    appendMessage: (state, action: PayloadAction<{ scope: string; message: ChatMessage }>) => {
      const context = ensureContext(state, action.payload.scope);
      if (context.messages.some((message) => message.id === action.payload.message.id)) {
        return;
      }
      context.messages.push(action.payload.message);
    },
    resetMessages: (state, action: PayloadAction<{ scope: string }>) => {
      ensureContext(state, action.payload.scope).messages = [];
    },
    setError: (state, action: PayloadAction<{ scope: string; error: string | null }>) => {
      ensureContext(state, action.payload.scope).error = action.payload.error;
    },
    setConnectionState: (state, action: PayloadAction<{ scope: string; connectionState: SessionConnectionState }>) => {
      ensureContext(state, action.payload.scope).connectionState = action.payload.connectionState;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.pending, (state, action) => {
        const scope = action.meta.arg.scope;
        const context = ensureContext(state, scope);
        context.isLoading = true;
        context.error = null;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        const scope = action.meta.arg.scope;
        const context = ensureContext(state, scope);
        context.isLoading = false;
        context.messages = action.payload.messages;
        context.error = null;
      })
      .addCase(loadSession.rejected, (state, action) => {
        const scope = action.meta.arg.scope;
        const context = ensureContext(state, scope);
        context.isLoading = false;
        context.error = action.payload ?? 'Unable to load chat history';
      })
      .addCase(sendChatMessage.pending, (state, action) => {
        const scope = action.meta.arg.scope;
        const context = ensureContext(state, scope);
        context.isSending = true;
        context.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state, action) => {
        const scope = action.meta.arg.scope;
        ensureContext(state, scope).isSending = false;
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        const scope = action.meta.arg.scope;
        const context = ensureContext(state, scope);
        context.isSending = false;
        context.error = action.payload ?? 'Unable to send message right now';
      })
      .addCase(clearChatHistory.pending, (state, action) => {
        const scope = action.meta.arg.scope;
        ensureContext(state, scope).error = null;
      })
      .addCase(clearChatHistory.fulfilled, (state, action) => {
        const scope = action.meta.arg.scope;
        const context = ensureContext(state, scope);
        context.messages = [];
        context.error = null;
      })
      .addCase(clearChatHistory.rejected, (state, action) => {
        const scope = action.meta.arg.scope;
        ensureContext(state, scope).error = action.payload ?? 'Unable to clear the current session';
      });
  },
});

export const { setSessionId, syncMessages, appendMessage, resetMessages, setError, setConnectionState } =
  chatSlice.actions;

export default chatSlice.reducer;
