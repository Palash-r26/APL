// ── FILE: hooks/useSymptomChat.js ── Custom hook for symptom triage chat
import { useState, useCallback } from 'react';
import { analyzeSymptoms } from '../api/client';

/**
 * Custom hook managing the multi-turn symptom chat with Gemini AI.
 * Handles message history, loading state, and triage result.
 */
export function useSymptomChat() {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content:
        "Hello! I'm your triage assistant. Please describe your main symptom or what brings you to the hospital today.",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [triageResult, setTriageResult] = useState(null);

  /**
   * Send a user message and get AI response.
   * Handles multi-turn follow-ups and final triage completion.
   */
  const sendMessage = useCallback(
    async (userText) => {
      if (!userText.trim() || loading) return;

      // Append user message
      const userMsg = { role: 'user', content: userText.trim() };
      const updatedMessages = [...messages, userMsg];
      setMessages(updatedMessages);
      setLoading(true);

      try {
        // Send full conversation history to the API
        const result = await analyzeSymptoms(updatedMessages);

        if (result.triageComplete) {
          // Triage is done — show the final assessment
          const aiMsg = {
            role: 'model',
            content: `Based on your symptoms, I've completed the assessment:\n\n**Department:** ${result.department}\n**Priority:** ${result.priorityTier}\n**Reasoning:** ${result.reasoning}`,
          };
          setMessages((prev) => [...prev, aiMsg]);
          setTriageResult(result);
        } else if (result.followUpQuestion) {
          // AI needs more info — relay the follow-up question
          const aiMsg = { role: 'model', content: result.followUpQuestion };
          setMessages((prev) => [...prev, aiMsg]);
        } else {
          // Edge case: no follow-up but not complete — treat as complete
          setTriageResult(result);
        }
      } catch (err) {
        // On network/API failure — show error message + fallback
        const errorMsg = {
          role: 'model',
          content:
            "I'm having trouble connecting to the AI service. You'll be routed to General Medicine for a standard check-up.",
        };
        setMessages((prev) => [...prev, errorMsg]);
        setTriageResult({
          department: 'General Medicine',
          priorityTier: 'GREEN',
          reasoning: 'AI analysis unavailable — default routing applied.',
          followUpQuestion: null,
          triageComplete: true,
          isFallback: true,
        });
      } finally {
        setLoading(false);
      }
    },
    [messages, loading]
  );

  /** Reset the chat for a new session */
  const resetChat = useCallback(() => {
    setMessages([
      {
        role: 'model',
        content:
          "Hello! I'm your triage assistant. Please describe your main symptom or what brings you to the hospital today.",
      },
    ]);
    setLoading(false);
    setTriageResult(null);
  }, []);

  return { messages, sendMessage, loading, triageResult, resetChat };
}
