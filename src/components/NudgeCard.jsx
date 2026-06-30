import { getUrgencyColor, getUrgencyLabel, formatTime, timeUntil } from '../utils/helpers';

export default function NudgeCard({ task, subtask, onStart, onMissed }) {
  if (!task || !subtask) {
    return (
      <div className="nudge-card nudge-card--empty">
        <div className="nudge-icon">✨</div>
        <h2 className="nudge-title">All clear!</h2>
        <p className="nudge-subtitle">Add a task and free time slots to get started. Your AI agent will plan your work.</p>
      </div>
    );
  }

  const urgencyColor = getUrgencyColor(task.urgencyScore);
  const urgencyLabel = getUrgencyLabel(task.urgencyScore);

  return (
    <div className="nudge-card" style={{ '--urgency-color': urgencyColor }}>
      <div className="nudge-glow" />
      <div className="nudge-header">
        <div className="nudge-badge" style={{ backgroundColor: urgencyColor }}>
          🔥 {urgencyLabel} — Score {task.urgencyScore}
        </div>
        <span className="nudge-deadline">{timeUntil(task.deadline)}</span>
      </div>

      <h2 className="nudge-action-label">DO THIS NOW</h2>

      <div className="nudge-content">
        <h3 className="nudge-subtask-title">{subtask.title}</h3>
        <p className="nudge-task-parent">
          Part of: <strong>{task.title}</strong>
        </p>
        {subtask.assignedSlot && (
          <p className="nudge-time">
            ⏰ Scheduled: {formatTime(subtask.assignedSlot.start)} – {formatTime(subtask.assignedSlot.end)}
            <span className="nudge-duration"> ({subtask.estimatedMinutes}m)</span>
          </p>
        )}
      </div>

      <div className="nudge-message">
        <span className="nudge-message-icon">💡</span>
        {task.nudgeMessage}
      </div>

      <div className="nudge-actions">
        <button
          className="btn btn-success nudge-btn"
          onClick={() => onStart(task.id, subtask.id)}
        >
          ▶ Start Now
        </button>
        <button
          className="btn btn-danger nudge-btn"
          onClick={() => onMissed(task.id, subtask.id)}
        >
          ✗ I Missed This
        </button>
      </div>
    </div>
  );
}
