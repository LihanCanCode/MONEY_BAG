/**
 * @fileoverview MoneyCoach — AI-powered floating chat advisor
 *
 * A floating chat bubble fixed at bottom-right of the screen.
 * Sends user messages + conversation history to the backend Money Coach
 * endpoint, which grounds Gemini answers in the user's real financial data.
 *
 * State is kept entirely client-side (history array), making the backend
 * completely stateless.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../utils/api';

// ─── Suggested starter prompts ──────────────────────────────────────────────
const STARTER_PROMPTS = [
  'Am I spending too much on food this month?',
  'How long until I reach my vacation goal?',
  'Where am I wasting money?',
  'What is my current financial health?',
  'Which debt should I pay off first?',
];

// ─── Component ───────────────────────────────────────────────────────────────
const MoneyCoach = () => {
  const { currentUser } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role: 'user'|'coach', text: string }
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      setHasNewMessage(false);
    }
  }, [isOpen]);

  /**
   * Build the Gemini-compatible history array from our messages array.
   * We exclude the last user message (it will be sent as `message`).
   */
  const buildHistory = (msgs) => {
    return msgs.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text }],
    }));
  };

  const sendMessage = async (text) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg = { role: 'user', text: trimmed };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const token = await currentUser.getIdToken();
      // history = all previous messages (before the current one)
      const history = buildHistory(messages);

      const response = await fetch(API_ENDPOINTS.COACH_CHAT, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: trimmed, history }),
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        const coachMsg = { role: 'coach', text: data.reply };
        setMessages(prev => [...prev, coachMsg]);
        if (!isOpen) setHasNewMessage(true);
      } else {
        setMessages(prev => [...prev, {
          role: 'coach',
          text: data.message || 'Sorry, I couldn\'t process that. Try again in a moment.',
          isError: true,
        }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'coach',
        text: 'Connection error. Please check your network and try again.',
        isError: true,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleStarterClick = (prompt) => {
    sendMessage(prompt);
  };

  const handleClear = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <>
      {/* ── Floating Action Button ── */}
      <motion.button
        className="coach-fab"
        onClick={() => setIsOpen(prev => !prev)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.93 }}
        aria-label="Open Ask AI"
        title="Ask AI"
      >
        <span className="coach-fab-icon">{isOpen ? '✕' : '✨'}</span>
        {!isOpen && (
          <span className="coach-fab-label">Ask AI</span>
        )}
        {hasNewMessage && !isOpen && <span className="coach-fab-badge" />}
      </motion.button>

      {/* ── Chat Drawer ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="coach-drawer"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
          >
            {/* Header */}
            <div className="coach-header">
              <div className="coach-header-left">
                <span className="coach-avatar">🧠</span>
                <div>
                  <div className="coach-title">Ask AI</div>
                  <div className="coach-subtitle">Powered by Gemini · Your financial data</div>
                </div>
              </div>
              <div className="coach-header-actions">
                {messages.length > 0 && (
                  <button className="coach-clear-btn" onClick={handleClear} title="Clear chat">
                    🗑
                  </button>
                )}
                <button className="coach-close-btn" onClick={() => setIsOpen(false)} title="Close">
                  ✕
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="coach-messages">
              {messages.length === 0 ? (
                <div className="coach-empty">
                  <div className="coach-welcome-icon">✨</div>
                  <p className="coach-welcome-title">Hi! How can I help?</p>
                  <p className="coach-welcome-sub">
                    Ask me anything about your finances — I have access to your real data.
                  </p>
                  <div className="coach-starters">
                    {STARTER_PROMPTS.map((p, i) => (
                      <button
                        key={i}
                        className="coach-starter-btn"
                        onClick={() => handleStarterClick(p)}
                        disabled={isLoading}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    className={`coach-bubble-wrap ${msg.role}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {msg.role === 'coach' && (
                      <span className="coach-bubble-avatar">🧠</span>
                    )}
                    <div className={`coach-bubble ${msg.role} ${msg.isError ? 'error' : ''}`}>
                      {msg.text}
                    </div>
                  </motion.div>
                ))
              )}

              {/* Typing indicator */}
              {isLoading && (
                <motion.div
                  className="coach-bubble-wrap coach"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <span className="coach-bubble-avatar">🧠</span>
                  <div className="coach-bubble coach typing">
                    <span className="dot" /><span className="dot" /><span className="dot" />
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form className="coach-input-area" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                className="coach-input"
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about your finances…"
                disabled={isLoading}
                autoComplete="off"
              />
              <button
                type="submit"
                className="coach-send-btn"
                disabled={isLoading || !input.trim()}
                aria-label="Send"
              >
                ➤
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MoneyCoach;
