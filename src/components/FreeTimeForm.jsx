import { useState } from 'react';
import { formatTime } from '../utils/helpers';

export default function FreeTimeForm({ freeSlots, onAddSlot, onRemoveSlot, disabled }) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!startTime || !endTime) return;

    // Convert time inputs to full ISO date strings (today)
    const today = new Date().toISOString().split('T')[0];
    const start = new Date(`${today}T${startTime}`).toISOString();
    const end = new Date(`${today}T${endTime}`).toISOString();

    if (new Date(end) <= new Date(start)) return;

    onAddSlot(start, end);
    setStartTime('');
    setEndTime('');
  };

  return (
    <div className="free-time-form">
      <h3 className="form-title">
        <span className="form-icon">🕐</span>
        Free Time Slots
      </h3>
      <form onSubmit={handleSubmit}>
        <div className="time-picker-row">
          <div className="form-group">
            <label htmlFor="slot-start">From</label>
            <input
              id="slot-start"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="form-input"
              disabled={disabled}
            />
          </div>
          <span className="time-separator">→</span>
          <div className="form-group">
            <label htmlFor="slot-end">To</label>
            <input
              id="slot-end"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="form-input"
              disabled={disabled}
            />
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-secondary"
          disabled={!startTime || !endTime || disabled}
        >
          Add Slot
        </button>
      </form>

      {freeSlots.length > 0 && (
        <div className="slots-list">
          {freeSlots.map(slot => (
            <div key={slot.id} className="slot-chip">
              <span className="slot-time">
                {formatTime(slot.start)} – {formatTime(slot.end)}
              </span>
              <span className="slot-duration">
                {Math.round((new Date(slot.end) - new Date(slot.start)) / 60000)}m
              </span>
              <button
                className="slot-remove"
                onClick={() => onRemoveSlot(slot.id)}
                title="Remove slot"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {freeSlots.length === 0 && (
        <p className="empty-hint">Add your available time slots so the AI can schedule your tasks.</p>
      )}
    </div>
  );
}
