import { useState } from 'react';
import { getUrgencyColor, getUrgencyLabel, getStatusColor, formatTime, formatDateTime, timeUntil } from '../utils/helpers';

export default function TaskList({ tasks, onSubtaskDone, onSubtaskMissed }) {
  const [expandedTask, setExpandedTask] = useState(null);

  if (tasks.length === 0) {
    return (
      <div className="task-list-empty">
        <span className="empty-icon">📝</span>
        <p>No tasks yet. Add a task and let the AI agent plan it for you!</p>
      </div>
    );
  }

  return (
    <div className="task-list">
      <h3 className="section-title">
        <span className="section-icon">📊</span>
        Tasks & Schedule
      </h3>
      {tasks.map(task => {
        const isExpanded = expandedTask === task.id;
        const urgencyColor = getUrgencyColor(task.urgencyScore);
        const completedCount = task.subtasks.filter(st => st.status === 'done').length;
        const totalCount = task.subtasks.length;

        return (
          <div key={task.id} className={`task-card ${isExpanded ? 'task-card--expanded' : ''}`}>
            <div
              className="task-card-header"
              onClick={() => setExpandedTask(isExpanded ? null : task.id)}
            >
              <div className="task-card-left">
                <div className="task-urgency-bar" style={{ backgroundColor: urgencyColor }}>
                  {task.urgencyScore}
                </div>
                <div className="task-info">
                  <h4 className="task-card-title">{task.title}</h4>
                  <div className="task-meta">
                    <span className="task-deadline-chip">
                      ⏳ {timeUntil(task.deadline)}
                    </span>
                    <span className="task-deadline-full">
                      Due: {formatDateTime(task.deadline)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="task-card-right">
                <span className="task-progress">
                  {completedCount}/{totalCount}
                </span>
                <span
                  className="task-status-badge"
                  style={{ backgroundColor: getStatusColor(task.status) }}
                >
                  {task.status}
                </span>
                <span className={`task-expand-icon ${isExpanded ? 'rotated' : ''}`}>▾</span>
              </div>
            </div>

            {isExpanded && (
              <div className="task-card-body">
                {task.nudgeMessage && (
                  <div className="task-nudge-inline">
                    <span className="nudge-message-icon">💡</span>
                    {task.nudgeMessage}
                  </div>
                )}
                <div className="subtask-list">
                  {task.subtasks.map(st => (
                    <div key={st.id} className={`subtask-item subtask-item--${st.status}`}>
                      <div className="subtask-status-dot" style={{ backgroundColor: getStatusColor(st.status) }} />
                      <div className="subtask-info">
                        <span className="subtask-title">{st.title}</span>
                        <div className="subtask-meta">
                          <span className="subtask-duration">{st.estimatedMinutes}m</span>
                          {st.assignedSlot && (
                            <span className="subtask-time">
                              {formatTime(st.assignedSlot.start)} – {formatTime(st.assignedSlot.end)}
                            </span>
                          )}
                          {!st.assignedSlot && <span className="subtask-unscheduled">Unscheduled</span>}
                        </div>
                      </div>
                      <div className="subtask-actions">
                        {st.status !== 'done' && (
                          <>
                            <button
                              className="subtask-btn subtask-btn--done"
                              onClick={(e) => { e.stopPropagation(); onSubtaskDone(task.id, st.id); }}
                              title="Mark done"
                            >
                              ✓
                            </button>
                            <button
                              className="subtask-btn subtask-btn--missed"
                              onClick={(e) => { e.stopPropagation(); onSubtaskMissed(task.id, st.id); }}
                              title="Mark missed — triggers re-plan"
                            >
                              ✗
                            </button>
                          </>
                        )}
                        {st.status === 'done' && (
                          <span className="subtask-done-check">✓</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
