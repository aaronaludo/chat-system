import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { deleteSession, fetchSession, sendMessage } from '../../api/chatClientApis';
import type { ChatMessage, ChatSession, SessionConnectionState } from '../../api/chatClientApis';

interface ChatState {
  sessionId: string;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;
  error: string | null;
  connectionState: SessionConnectionState;
}

const initialState: ChatState = {
  sessionId: '',
  messages: [],
  isLoading: false,
  isSending: false,
  error: null,
  connectionState: 'idle',
};

const getErrorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error ? error.message : fallback;

export const loadSession = createAsyncThunk<ChatSession, string, { rejectValue: string }>(
  'chat/loadSession',
  async (sessionId, { rejectWithValue }) => {
    try {
      return await fetchSession(sessionId);
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Unable to load chat history'));
    }
  },
);

export const sendChatMessage = createAsyncThunk<
  void,
  { sessionId: string; content: string; authorName?: string },
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

export const clearChatHistory = createAsyncThunk<void, string, { rejectValue: string }>(
  'chat/clearChatHistory',
  async (sessionId, { rejectWithValue }) => {
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
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },
    syncMessages: (state, action: PayloadAction<ChatMessage[]>) => {
      state.messages = action.payload;
      state.error = null;
    },
    appendMessage: (state, action: PayloadAction<ChatMessage>) => {
      if (state.messages.some((message) => message.id === action.payload.id)) {
        return;
      }
      state.messages.push(action.payload);
    },
    resetMessages: (state) => {
      state.messages = [];
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setConnectionState: (state, action: PayloadAction<SessionConnectionState>) => {
      state.connectionState = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loadSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload.messages;
        state.error = null;
      })
      .addCase(loadSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Unable to load chat history';
      })
      .addCase(sendChatMessage.pending, (state) => {
        state.isSending = true;
        state.error = null;
      })
      .addCase(sendChatMessage.fulfilled, (state) => {
        state.isSending = false;
      })
      .addCase(sendChatMessage.rejected, (state, action) => {
        state.isSending = false;
        state.error = action.payload ?? 'Unable to send message right now';
      })
      .addCase(clearChatHistory.pending, (state) => {
        state.error = null;
      })
      .addCase(clearChatHistory.fulfilled, (state) => {
        state.messages = [];
        state.error = null;
      })
      .addCase(clearChatHistory.rejected, (state, action) => {
        state.error = action.payload ?? 'Unable to clear the current session';
      });
  },
});

export const { setSessionId, syncMessages, appendMessage, resetMessages, setError, setConnectionState } =
  chatSlice.actions;

export default chatSlice.reducer;
