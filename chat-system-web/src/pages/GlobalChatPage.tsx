import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import MessageBubble from '../components/MessageBubble';
import { useChatSession } from '../hooks/useChatSession';
import { useQuickAccount } from '../hooks/useQuickAccount';

const GLOBAL_SESSION_ID = 'global-lobby';

const GlobalChatPage = () => {
  const { messages, isLoading, isSending, error, connectionState, sendUserMessage } = useChatSession({
    initialSessionId: GLOBAL_SESSION_ID,
    persist: false,
  });
  const { accountName, isAccountReady, accountDisplayName, saveAccountName, resetAccountName } = useQuickAccount();
  const [nameDraft, setNameDraft] = useState(accountName);
  const [draft, setDraft] = useState('');
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
    } catch (submitError) {
      console.error(submitError);
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

  const statusLabel = {
    connecting: 'Connecting',
    open: 'Live',
    closed: 'Offline',
    idle: 'Idle',
  }[connectionState];

  return (
    <div className="page chat-page global-chat">
      <section className="insight-panel">
        <p className="eyebrow">Community channel</p>
        <h2>Hang out with everyone exploring Chat System right now.</h2>
        <p className="muted-copy">
          The global lobby is a shared canvas. Messages arrive instantly for every participant, making it the perfect
          place to compare prompts, swap tips, and co-create better assistants.
        </p>

        <div className="global-meta">
          <article>
            <p className="eyebrow">Room</p>
            <strong>#{GLOBAL_SESSION_ID}</strong>
          </article>
          <article>
            <p className="eyebrow">Mode</p>
            <strong>Public</strong>
          </article>
        </div>

        <div className="account-card">
          {isAccountReady ? (
            <div className="account-ready">
              <div>
                <p className="eyebrow">Quick account</p>
                <h4>{accountName}</h4>
                <p className="muted-copy">Your name appears with every lobby post.</p>
              </div>
              <button type="button" className="pill-btn" onClick={handleAccountReset}>
                Switch name
              </button>
            </div>
          ) : (
            <form className="account-form" onSubmit={handleAccountSubmit}>
              <p className="eyebrow">Quick account</p>
              <h4>Pick a display name</h4>
              <p className="muted-copy">Introduce yourself once to start posting instantly.</p>
              <input
                type="text"
                className="input-field"
                placeholder="Ex: Sam from design"
                value={nameDraft}
                onChange={(event) => setNameDraft(event.target.value)}
              />
              <button type="submit" className="pill-btn is-primary" disabled={!nameDraft.trim()}>
                Save name
              </button>
            </form>
          )}
        </div>

        <div className="session-card global-session-card">
          <div>
            <p className="eyebrow">Connection state</p>
            <h4>{statusLabel}</h4>
          </div>
          <p className="muted-copy">Your message history resets automatically every few hours.</p>
        </div>
      </section>

      <section className="chat-panel">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Global chat</p>
            <h3>Live community feed</h3>
            <p className="chat-subtitle">
              {isAccountReady ? (
                <>
                  Signed in as <strong>{accountDisplayName}</strong>
                </>
              ) : (
                'Add your name on the left to post in the lobby.'
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
              <h4>Say hello to the community</h4>
              <p>Ask for feedback, swap prompt ideas, or simply drop a status update.</p>
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
          <p className="account-warning">Create a quick account on the left to post in the lobby.</p>
        )}

        <form className="composer" onSubmit={handleSubmit}>
          <textarea
            placeholder={
              isAccountReady ? "Share what you're working on" : 'Add your name to post in the lobby'
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
              onClick={() => setDraft('')}
              disabled={!isAccountReady || draft.length === 0}
            >
              Clear draft
            </button>
            <button type="submit" className="primary" disabled={!isAccountReady || !draft.trim() || isSending}>
              {isSending ? 'Sending…' : 'Post to lobby'}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default GlobalChatPage;
