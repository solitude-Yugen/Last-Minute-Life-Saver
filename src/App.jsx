import { useState, useCallback, useMemo } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { planTask, replanAfterMiss } from './services/gemini';
import TaskForm from './components/TaskForm';
import FreeTimeForm from './components/FreeTimeForm';
import NudgeCard from './components/NudgeCard';
import TaskList from './components/TaskList';
import SubtaskTimeline from './components/SubtaskTimeline';
import ReplanReport from './components/ReplanReport';
import AgentThinking from './components/AgentThinking';

function Dashboard() {
  const { state, dispatch } = useApp();
  const { tasks, freeSlots, isAgentThinking, replanReport, agentLog } = state;

  // Find the highest-urgency next action for the nudge card
  const nudgeData = useMemo(() => {
    let bestTask = null;
    let bestSubtask = null;
    let bestScore = -1;

    tasks.forEach(task => {
      if (task.status === 'done') return;
      task.subtasks.forEach(st => {
        if (st.status === 'pending' || st.status === 'in-progress') {
          if (task.urgencyScore > bestScore) {
            bestScore = task.urgencyScore;
            bestTask = task;
            bestSubtask = st;
          }
        }
      });
    });

    return { task: bestTask, subtask: bestSubtask };
  }, [tasks]);

  // Get all currently scheduled items (for conflict avoidance)
  const getExistingSchedule = useCallback(() => {
    const scheduled = [];
    tasks.forEach(task => {
      task.subtasks.forEach(st => {
        if (st.assignedSlot && st.status !== 'done' && st.status !== 'missed') {
          scheduled.push({
            title: st.title,
            start: st.assignedSlot.start,
            end: st.assignedSlot.end,
          });
        }
      });
    });
    return scheduled;
  }, [tasks]);

  // Handle adding a new task
  const handleAddTask = useCallback(async (title, deadline) => {
    const taskId = Date.now().toString(36) + Math.random().toString(36).slice(2, 9);

    dispatch({
      type: 'ADD_TASK',
      payload: { title, deadline },
    });

    // Wait for state to update, then plan
    dispatch({ type: 'SET_AGENT_THINKING', payload: true });

    try {
      const plan = await planTask(
        { title, deadline },
        freeSlots,
        getExistingSchedule()
      );

      // Find the task we just added (it'll be the last one)
      dispatch({ type: 'SET_AGENT_THINKING', payload: false });

      // We need to get the actual task ID from state
      // Since we can't access updated state here, we'll dispatch with a finder
      dispatch({
        type: 'APPLY_PLAN',
        payload: {
          taskId: '__LAST__', // handled specially in reducer
          plan,
        },
      });

      const source = plan._fallback ? '(local fallback — Gemini quota exceeded)' : '(Gemini AI)';
      dispatch({
        type: 'ADD_AGENT_LOG',
        payload: `Planned "${title}" ${source}: ${plan.subtasks.length} subtasks, urgency ${plan.urgencyScore}/100.`,
      });
    } catch (err) {
      console.error('Planning failed:', err);
      dispatch({ type: 'SET_AGENT_THINKING', payload: false });
      dispatch({
        type: 'ADD_AGENT_LOG',
        payload: `Failed to plan "${title}": ${err.message}`,
      });
    }
  }, [freeSlots, getExistingSchedule, dispatch]);

  // Handle marking subtask as started
  const handleStart = useCallback((taskId, subtaskId) => {
    dispatch({
      type: 'UPDATE_SUBTASK_STATUS',
      payload: { taskId, subtaskId, status: 'in-progress' },
    });
  }, [dispatch]);

  // Handle marking subtask as done
  const handleSubtaskDone = useCallback((taskId, subtaskId) => {
    dispatch({
      type: 'UPDATE_SUBTASK_STATUS',
      payload: { taskId, subtaskId, status: 'done' },
    });
  }, [dispatch]);

  // Handle marking subtask as missed → trigger re-plan
  const handleMissed = useCallback(async (taskId, subtaskId) => {
    const task = tasks.find(t => t.id === taskId);
    const subtask = task?.subtasks.find(st => st.id === subtaskId);
    if (!task || !subtask) return;

    dispatch({
      type: 'UPDATE_SUBTASK_STATUS',
      payload: { taskId, subtaskId, status: 'missed' },
    });

    dispatch({ type: 'SET_AGENT_THINKING', payload: true });

    try {
      const result = await replanAfterMiss(
        tasks,
        freeSlots,
        {
          taskTitle: task.title,
          subtaskTitle: subtask.title,
          originalSlot: subtask.assignedSlot,
        }
      );

      dispatch({ type: 'SET_AGENT_THINKING', payload: false });
      dispatch({ type: 'APPLY_REPLAN', payload: result });
    } catch (err) {
      console.error('Re-planning failed:', err);
      dispatch({ type: 'SET_AGENT_THINKING', payload: false });
      dispatch({
        type: 'ADD_AGENT_LOG',
        payload: `Re-planning failed: ${err.message}. Try again in a moment.`,
      });
    }
  }, [tasks, freeSlots, dispatch]);

  // Handle adding a free time slot
  const handleAddSlot = useCallback((start, end) => {
    dispatch({ type: 'ADD_FREE_SLOT', payload: { start, end } });
  }, [dispatch]);

  // Handle removing a free time slot
  const handleRemoveSlot = useCallback((slotId) => {
    dispatch({ type: 'REMOVE_FREE_SLOT', payload: slotId });
  }, [dispatch]);

  // Handle dismissing re-plan report
  const handleDismissReplan = useCallback(() => {
    dispatch({ type: 'DISMISS_REPLAN_REPORT' });
  }, [dispatch]);

  return (
    <div className="app">
      <AgentThinking isVisible={isAgentThinking} />
      {replanReport && (
        <ReplanReport explanation={replanReport} onDismiss={handleDismissReplan} />
      )}

      <header className="app-header">
        <div className="header-content">
          <div className="header-left">
            <span className="header-logo">⚡</span>
            <div>
              <h1 className="header-title">Last-Minute Life Saver</h1>
              <p className="header-subtitle">AI-powered productivity agent</p>
            </div>
          </div>
          <div className="header-right">
            <div className="header-stat">
              <span className="stat-number">{tasks.length}</span>
              <span className="stat-label">Tasks</span>
            </div>
            <div className="header-stat">
              <span className="stat-number">{tasks.filter(t => t.status === 'done').length}</span>
              <span className="stat-label">Done</span>
            </div>
            <div className="header-stat">
              <span className="stat-number">{freeSlots.length}</span>
              <span className="stat-label">Slots</span>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <div className="nudge-section">
          <NudgeCard
            task={nudgeData.task}
            subtask={nudgeData.subtask}
            onStart={handleStart}
            onMissed={handleMissed}
          />
        </div>

        <div className="dashboard-grid">
          <aside className="sidebar">
            <TaskForm onAddTask={handleAddTask} disabled={isAgentThinking} />
            <FreeTimeForm
              freeSlots={freeSlots}
              onAddSlot={handleAddSlot}
              onRemoveSlot={handleRemoveSlot}
              disabled={isAgentThinking}
            />

            {agentLog.length > 0 && (
              <div className="agent-log">
                <h3 className="form-title">
                  <span className="form-icon">🤖</span>
                  Agent Log
                </h3>
                <div className="log-entries">
                  {agentLog.slice(0, 5).map((entry, i) => (
                    <div key={i} className="log-entry">
                      <span className="log-time">
                        {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </span>
                      <span className="log-message">{entry.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <section className="main-content">
            <SubtaskTimeline tasks={tasks} freeSlots={freeSlots} />
            <TaskList
              tasks={tasks}
              onSubtaskDone={handleSubtaskDone}
              onSubtaskMissed={handleMissed}
            />
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <p>Built with <span className="footer-heart">♥</span> using Google Gemini AI · Vibe2Ship Hackathon 2026</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Dashboard />
    </AppProvider>
  );
}

export default App;
