import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import MessageBubble from '../components/MessageBubble';
import { useChatSession } from '../hooks/useChatSession';
import { useQuickAccount } from '../hooks/useQuickAccount';

const metrics = [
  { label: 'Context window', value: '32k tokens' },
  { label: 'Guardrails', value: 'Active' },
  { label: 'Eval scenarios', value: '37 scripts' },
];

const normalizeSessionName = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32);

const ChatPage = () => {
  const {
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
  } = useChatSession();
  const { accountName, isAccountReady, accountDisplayName, saveAccountName, resetAccountName } = useQuickAccount();
  const [nameDraft, setNameDraft] = useState(accountName);
  const [joinCode, setJoinCode] = useState('');
  const [sessionLabel, setSessionLabel] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [copied, setCopied] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setNameDraft(accountName);
  }, [accountName]);

  useEffect(() => {
    const node = listRef.current;
    if (!node) {
      return;
    }
    node.scrollTop = node.scrollHeight;
  }, [messages, isLoading]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = draft.trim();
    if (!value || !isAccountReady) {
      return;
    }
    try {
      await sendUserMessage(value, accountDisplayName);
      setDraft('');
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopy = async () => {
    if (!sessionId || typeof navigator === 'undefined' || !navigator.clipboard) {
      return;
    }
    try {
      await navigator.clipboard.writeText(sessionId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAccountSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = nameDraft.trim();
    if (!value) {
      return;
    }
    setNameDraft(value);
    saveAccountName(value);
  };

  const handleAccountReset = () => {
    setNameDraft('');
    resetAccountName();
  };

  const handleJoinSession = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = joinCode.trim();
    if (!value) {
      setJoinError('Enter a session ID before joining.');
      return;
    }
    setJoinError(null);
    joinSession(value);
    setJoinCode('');
  };

  const handleCreateSession = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizeSessionName(sessionLabel);
    setJoinError(null);
    startNewSession(normalized || undefined);
    setSessionLabel('');
  };

  const statusLabel = {
    connecting: 'Connecting',
    open: 'Live',
    closed: 'Offline',
    idle: 'Idle',
  }[connectionState];

  return (
    <div className="page chat-page">
      <section className="insight-panel">
        <div className="account-card">
          {isAccountReady ? (
            <div className="account-ready">
              <div>
                <p className="eyebrow">Quick account</p>
                <h4>{accountName}</h4>
                <p className="muted-copy">Share this name when collaborating on a session.</p>
              </div>
              <button type="button" className="pill-btn" onClick={handleAccountReset}>
                Switch name
              </button>
            </div>
          ) : (
            <form className="account-form" onSubmit={handleAccountSubmit}>
              <p className="eyebrow">Quick account</p>
              <h4>Introduce yourself</h4>
              <p className="muted-copy">Add your name to unlock personal sessions in seconds.</p>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: Maya from research"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
              />
              <button type="submit" className="pill-btn is-primary" disabled={!nameDraft.trim()}>
                Save name
              </button>
            </form>
          )}
        </div>

        <p className="eyebrow">Prototype lab</p>
        <h2>Create a calm, focused environment for exploring assistant behaviors.</h2>
        <p className="muted-copy">
          Each session stores the full conversation, enabling you to retry prompts, export transcripts, or invite a
          teammate to pick up where you left off.
        </p>

        <div className="metric-grid">
          {metrics.map((metric) => (
            <article key={metric.label} className="metric-card">
              <p>{metric.label}</p>
              <strong>{metric.value}</strong>
            </article>
          ))}
        </div>

        <div className="session-card">
          <div>
            <p className="eyebrow">Session ID</p>
            <h4>{sessionId ? sessionId.slice(0, 8).toUpperCase() : 'Generating…'}</h4>
            <p className="muted-copy">Host: {accountDisplayName}</p>
          </div>
          <div className="session-actions">
            <button type="button" className="pill-btn" onClick={handleCopy}>
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button type="button" className="pill-btn" onClick={() => startNewSession()}>
              Start fresh
            </button>
          </div>
        </div>

        <form className="session-form" onSubmit={handleJoinSession}>
          <label htmlFor="join-session" className="eyebrow">
            Join a session
          </label>
          <div className="session-form-controls">
            <input
              id="join-session"
              type="text"
              className="input-field"
              placeholder="Paste a session ID"
              value={joinCode}
              onChange={(event) => {
                setJoinCode(event.target.value);
                if (joinError) {
                  setJoinError(null);
                }
              }}
            />
            <button type="submit" className="pill-btn is-primary">
              Join
            </button>
          </div>
          {joinError ? (
            <p className="form-hint error">{joinError}</p>
          ) : (
            <p className="form-hint">Anyone with the code can jump into the thread.</p>
          )}
        </form>

        <form className="session-form" onSubmit={handleCreateSession}>
          <label htmlFor="session-label" className="eyebrow">
            Create a session
          </label>
          <div className="session-form-controls">
            <input
              id="session-label"
              type="text"
              className="input-field"
              placeholder="Name your session (optional)"
              value={sessionLabel}
              onChange={(event) => setSessionLabel(event.target.value)}
            />
            <button type="submit" className="pill-btn">
              Create
            </button>
          </div>
          <p className="form-hint">Names are auto-lowercased—leave blank to spin up a private ID.</p>
        </form>

        <button type="button" className="text-link" onClick={clearConversation}>
          Clear conversation history
        </button>
      </section>

      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Conversation canvas</p>
            <h3>Realtime simulator</h3>
            <p className="chat-subtitle">
              {isAccountReady ? (
                <>
                  Signed in as <strong>{accountDisplayName}</strong>
                </>
              ) : (
                'Add your name on the left to start chatting.'
              )}
            </p>
          </div>
          <div className={`status-indicator ${connectionState}`}>
            <span className="dot" />
            {statusLabel}
          </div>
        </header>

        <div className="message-list" ref={listRef}>
          {isLoading && (
            <div className="skeleton-stack">
              {[0, 1, 2].map((index) => (
                <div key={index} className="skeleton-row" />
              ))}
            </div>
          )}

          {!isLoading && messages.length === 0 && (
            <div className="message-empty">
              <h4>Start the conversation</h4>
              <p>Ask a question, share feedback, or describe the behavior you expect from the assistant.</p>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              viewerName={isAccountReady ? accountDisplayName : undefined}
            />
          ))}
        </div>

        {error && <p className="error-banner">{error}</p>}

        {!isAccountReady && (
          <p className="account-warning">Create a quick account on the left to unlock the composer.</p>
        )}

        <form className="composer" onSubmit={handleSubmit}>
          <textarea
            placeholder={
              isAccountReady ? 'Type a prompt, press Shift + Enter for a new line' : 'Add your name to start chatting'
            }
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={3}
            disabled={!isAccountReady}
          />
          <div className="composer-actions">
            <button
              type="button"
              className="secondary"
              onClick={clearConversation}
              disabled={!isAccountReady || messages.length === 0}
            >
              Reset
            </button>
            <button type="submit" className="primary" disabled={!isAccountReady || !draft.trim() || isSending}>
              {isSending ? 'Sending…' : 'Send message'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default ChatPage;
