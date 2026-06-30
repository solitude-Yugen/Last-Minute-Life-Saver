import { useEffect, useState } from 'react';

const thinkingMessages = [
  'Analyzing task complexity...',
  'Decomposing into subtasks...',
  'Evaluating deadline urgency...',
  'Finding optimal time slots...',
  'Computing schedule...',
  'Preparing your action plan...',
];

export default function AgentThinking({ isVisible }) {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setMessageIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % thinkingMessages.length);
    }, 1800);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <div className="agent-thinking-overlay">
      <div className="agent-thinking-card">
        <div className="agent-thinking-brain">
          <div className="brain-ring brain-ring-1" />
          <div className="brain-ring brain-ring-2" />
          <div className="brain-ring brain-ring-3" />
          <span className="brain-emoji">🧠</span>
        </div>
        <h3 className="agent-thinking-title">AI Agent is Working</h3>
        <p className="agent-thinking-message">{thinkingMessages[messageIndex]}</p>
        <div className="agent-thinking-dots">
          <span className="dot dot-1" />
          <span className="dot dot-2" />
          <span className="dot dot-3" />
        </div>
      </div>
    </div>
  );
}
