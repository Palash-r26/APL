// ── FILE: components/ChatBubble.jsx ── Chat message bubble for triage conversation
import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

/**
 * Chat bubble component for the symptom triage conversation.
 * @param {'user'|'model'} role - Message sender
 * @param {string} content - Message text
 */
export default function ChatBubble({ role, content }) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser
            ? 'bg-kiosk-blue text-white'
            : 'bg-gradient-to-br from-kiosk-green to-emerald-500 text-white'
        }`}
      >
        {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
      </div>

      {/* Bubble */}
      <div
        className={`max-w-[75%] rounded-2xl px-5 py-4 text-base leading-relaxed ${
          isUser
            ? 'bg-kiosk-blue text-white rounded-br-md'
            : 'bg-white text-text-primary border border-border-light rounded-bl-md kiosk-shadow'
        }`}
      >
        {/* Render markdown-style bold text */}
        {content.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>
            {line.split(/(\*\*.*?\*\*)/).map((part, j) =>
              part.startsWith('**') && part.endsWith('**') ? (
                <strong key={j} className="font-bold">
                  {part.slice(2, -2)}
                </strong>
              ) : (
                <span key={j}>{part}</span>
              )
            )}
          </p>
        ))}
      </div>
    </motion.div>
  );
}

/**
 * Animated typing indicator (3 bouncing dots).
 */
export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-kiosk-green to-emerald-500 flex items-center justify-center flex-shrink-0">
        <Bot className="w-5 h-5 text-white" />
      </div>
      <div className="bg-white border border-border-light rounded-2xl rounded-bl-md px-5 py-4 kiosk-shadow flex items-center gap-1.5">
        <span className="typing-dot w-2.5 h-2.5 rounded-full bg-text-muted" />
        <span className="typing-dot w-2.5 h-2.5 rounded-full bg-text-muted" />
        <span className="typing-dot w-2.5 h-2.5 rounded-full bg-text-muted" />
      </div>
    </motion.div>
  );
}
