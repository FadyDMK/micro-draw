import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { useGame } from '../hooks/useGame';
import '../styles/Chat.css';

function Chat() {
  const { chatMessages, sendGuess, isDrawer } = useGame();
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sendGuess(message.trim());
    setMessage('');
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Chat</h3>
        {isDrawer && (
          <span className="chat-disabled">Drawer cannot chat</span>
        )}
      </div>

      <div className="messages-list">
        {chatMessages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet...</p>
            <p className="empty-hint">
              {isDrawer ? 'Draw your word!' : 'Start guessing!'}
            </p>
          </div>
        ) : (
          chatMessages.map((msg, index) => {
            const isSystem = msg.from === 'SYSTEM';
            return (
              <div
                key={index}
                className={`message ${isSystem ? 'system' : 'user'}`}
              >
                <span className="message-sender">{msg.from}:</span>
                <span className="message-text">{msg.message}</span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isDrawer ? "You cannot chat while drawing" : "Type your guess..."}
          disabled={isDrawer}
          className="chat-input"
          autoComplete="off"
        />
        <button
          type="submit"
          disabled={isDrawer || !message.trim()}
          className="send-button"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default Chat;
