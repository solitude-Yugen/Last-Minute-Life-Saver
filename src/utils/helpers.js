/**
 * Generate a unique ID
 */
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

/**
 * Format a Date object to a readable time string (e.g., "2:30 PM")
 */
export function formatTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

/**
 * Format a Date object to a readable date+time string
 */
export function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Get urgency color based on score (0-100)
 */
export function getUrgencyColor(score) {
  if (score >= 80) return '#ef4444'; // red
  if (score >= 60) return '#f59e0b'; // amber
  if (score >= 40) return '#fb923c'; // orange
  return '#10b981'; // green
}

/**
 * Get urgency label
 */
export function getUrgencyLabel(score) {
  if (score >= 80) return 'Critical';
  if (score >= 60) return 'High';
  if (score >= 40) return 'Medium';
  return 'Low';
}

/**
 * Get status badge color
 */
export function getStatusColor(status) {
  switch (status) {
    case 'done': return '#10b981';
    case 'in-progress': return '#3b82f6';
    case 'missed': return '#ef4444';
    case 'scheduled': return '#8b5cf6';
    case 'planning': return '#f59e0b';
    default: return '#64748b';
  }
}

/**
 * Calculate minutes between two dates
 */
export function minutesBetween(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 60000);
}

/**
 * Check if a date is today
 */
export function isToday(date) {
  const d = new Date(date);
  const today = new Date();
  return d.toDateString() === today.toDateString();
}

/**
 * Get time remaining until deadline as a human-readable string
 */
export function timeUntil(deadline) {
  const now = new Date();
  const dl = new Date(deadline);
  const diffMs = dl - now;

  if (diffMs < 0) return 'Overdue!';

  const hours = Math.floor(diffMs / 3600000);
  const minutes = Math.floor((diffMs % 3600000) / 60000);

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h left`;
  }
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}
