import { useEffect, useState } from 'react';

export default function ReplanReport({ explanation, onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  if (!explanation) return null;

  return (
    <div className={`replan-overlay ${isVisible ? 'replan-overlay--visible' : ''}`} onClick={handleDismiss}>
      <div className={`replan-modal ${isVisible ? 'replan-modal--visible' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="replan-header">
          <div className="replan-icon">🤖</div>
          <h3 className="replan-title">Agent Re-Planned Your Schedule</h3>
        </div>
        <div className="replan-body">
          <p className="replan-explanation">{explanation}</p>
        </div>
        <div className="replan-footer">
          <button className="btn btn-primary" onClick={handleDismiss}>
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
