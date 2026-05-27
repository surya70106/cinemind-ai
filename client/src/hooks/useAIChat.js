import { useState, useCallback } from 'react';
import api from '../services/api';

const suggestedPrompts = [
  'Movies to watch at 2AM',
  'Mindfuck films with plot twists',
  'Feel-good movies like Amélie',
  'Underrated sci-fi gems',
  'Movies that will make me cry',
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
      const { data } = await api.post('/ai/chat', {
        message: text,
        history,
      });

      const aiMessage = {
        role: 'assistant',
        content: data.response || data.message || data.content || 'I couldn\'t generate a response. Please try again.',
        movies: data.movies || [],
        id: Date.now() + 1,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      const errorMessage = {
        role: 'assistant',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        id: Date.now() + 1,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    loading,
    sendMessage,
    clearChat,
    suggestedPrompts,
  };
}
