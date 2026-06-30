import { useState } from 'react';

export default function TaskForm({ onAddTask, disabled }) {
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !deadline) return;
    onAddTask(title.trim(), deadline);
    setTitle('');
    setDeadline('');
  };

  // Default deadline to ~6 hours from now
  const getMinDeadline = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    return now.toISOString().slice(0, 16);
  };

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h3 className="form-title">
        <span className="form-icon">📋</span>
        Add Task
      </h3>
      <div className="form-group">
        <label htmlFor="task-title">What do you need to do?</label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Finish presentation slides"
          className="form-input"
          disabled={disabled}
        />
      </div>
      <div className="form-group">
        <label htmlFor="task-deadline">Deadline</label>
        <input
          id="task-deadline"
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          min={getMinDeadline()}
          className="form-input"
          disabled={disabled}
        />
      </div>
      <button
        type="submit"
        className="btn btn-primary"
        disabled={!title.trim() || !deadline || disabled}
      >
        <span className="btn-icon">🤖</span>
        Add & Let AI Plan
      </button>
    </form>
  );
}
