import { useState, useCallback } from 'react';

const suggestedPrompts = [
  'Shows to watch at 2AM',
  'Mind-blowing sci-fi with plot twists',
  'Feel-good shows like Friends',
  'Underrated crime dramas',
  'Shows that will make me cry',
];

export default function useAIChat() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (text) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text, id: Date.now() };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const history = messages.map(({ role, content }) => ({ role, content }));
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'chat', message: text, history }),
      });
      const data = await res.json();

      const aiMessage = {
        role: 'assistant',
        content: data.response || data.message || data.content || "I couldn't generate a response. Please try again.",
        id: Date.now() + 1,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch {
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: "Sorry, I'm having trouble connecting right now. Please try again in a moment.",
        id: Date.now() + 1,
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => setMessages([]), []);

  return { messages, loading, sendMessage, clearChat, suggestedPrompts };
}
