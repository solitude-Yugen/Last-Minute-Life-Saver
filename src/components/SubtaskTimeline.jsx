import { formatTime, getUrgencyColor } from '../utils/helpers';

export default function SubtaskTimeline({ tasks, freeSlots }) {
  // Collect all scheduled subtasks with their parent task info
  const scheduledItems = [];
  tasks.forEach(task => {
    task.subtasks.forEach(st => {
      if (st.assignedSlot) {
        scheduledItems.push({
          ...st,
          taskTitle: task.title,
          taskId: task.id,
          urgencyScore: task.urgencyScore,
        });
      }
    });
  });

  scheduledItems.sort((a, b) => new Date(a.assignedSlot.start) - new Date(b.assignedSlot.start));

  if (scheduledItems.length === 0 && freeSlots.length === 0) {
    return null;
  }

  return (
    <div className="timeline">
      <h3 className="section-title">
        <span className="section-icon">📅</span>
        Today's Schedule
      </h3>

      {freeSlots.length > 0 && scheduledItems.length === 0 && (
        <div className="timeline-empty">
          <p>Free time slots added. Add a task to see the AI schedule it!</p>
        </div>
      )}

      <div className="timeline-track">
        {freeSlots.map(slot => {
          const slotItems = scheduledItems.filter(item =>
            item.assignedSlot.slotId === slot.id
          );

          const slotDuration = Math.round((new Date(slot.end) - new Date(slot.start)) / 60000);
          const usedMinutes = slotItems.reduce((sum, item) => sum + item.estimatedMinutes, 0);
          const fillPercent = Math.min(100, (usedMinutes / slotDuration) * 100);

          return (
            <div key={slot.id} className="timeline-slot">
              <div className="timeline-slot-header">
                <span className="timeline-slot-time">
                  {formatTime(slot.start)} – {formatTime(slot.end)}
                </span>
                <span className="timeline-slot-duration">
                  {usedMinutes}/{slotDuration}m used
                </span>
              </div>

              <div className="timeline-slot-bar">
                <div
                  className="timeline-slot-fill"
                  style={{ width: `${fillPercent}%` }}
                />
              </div>

              {slotItems.length > 0 ? (
                <div className="timeline-items">
                  {slotItems.map(item => (
                    <div
                      key={item.id}
                      className={`timeline-item timeline-item--${item.status}`}
                      style={{ '--item-color': getUrgencyColor(item.urgencyScore) }}
                    >
                      <div className="timeline-item-color" style={{ backgroundColor: getUrgencyColor(item.urgencyScore) }} />
                      <div className="timeline-item-content">
                        <span className="timeline-item-title">{item.title}</span>
                        <span className="timeline-item-meta">
                          {item.taskTitle} · {item.estimatedMinutes}m · {formatTime(item.assignedSlot.start)}–{formatTime(item.assignedSlot.end)}
                        </span>
                      </div>
                      <span className={`timeline-item-status timeline-item-status--${item.status}`}>
                        {item.status === 'done' ? '✓' : item.status === 'missed' ? '✗' : item.status === 'in-progress' ? '▶' : '○'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="timeline-slot-empty">Available</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
