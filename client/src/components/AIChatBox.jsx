import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import useAIChat from '../hooks/useAIChat';

export default function AIChatBox() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const { messages, loading, sendMessage, clearChat, suggestedPrompts } = useAIChat();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-5 right-5 w-12 h-12 rounded-full bg-accent-green text-bg-primary flex items-center justify-center shadow-lg z-40 float-glow"
      >
        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
          {isOpen ? 'close' : 'chat'}
        </span>
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-5 w-[380px] max-h-[520px] bg-surface-container border border-outline-variant/30 rounded-xl shadow-2xl shadow-black/60 z-40 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
                <h3 className="text-sm font-semibold text-text-primary">CineMind AI</h3>
              </div>
              {messages.length > 0 && (
                <button onClick={clearChat} className="text-metadata text-text-muted hover:text-accent-green transition-colors">
                  Clear
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px]">
              {messages.length === 0 ? (
                <div className="space-y-2">
                  <p className="text-xs text-text-muted text-center mb-3">Ask me anything about shows!</p>
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => { setInput(prompt); inputRef.current?.focus(); }}
                      className="block w-full text-left px-3 py-2.5 rounded-lg bg-surface-container-high/60 border border-outline-variant/30 text-xs text-text-secondary hover:text-text-primary hover:border-accent-green/30 transition-all"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] px-3 py-2 text-xs leading-relaxed ${
                        msg.role === 'user' ? 'chat-bubble-user text-bg-primary font-medium' : 'chat-bubble-ai text-text-primary'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex gap-1.5 px-3 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-green typing-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-green typing-dot" />
                  <div className="w-1.5 h-1.5 rounded-full bg-accent-green typing-dot" />
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-outline-variant/30">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about shows..."
                  className="flex-1 px-3 py-2 rounded-lg bg-surface-container-high border border-outline-variant/30 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-accent-green/50 transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="px-3 py-2 rounded-lg bg-accent-green text-bg-primary disabled:opacity-40 hover:bg-accent-green-container transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">send</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
