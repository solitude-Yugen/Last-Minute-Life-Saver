import { createContext, useContext, useReducer, useCallback } from 'react';
import { generateId } from '../utils/helpers';

const AppContext = createContext(null);

const initialState = {
  tasks: [],
  freeSlots: [],
  agentLog: [],
  isAgentThinking: false,
  replanReport: null,
};

function appReducer(state, action) {
  switch (action.type) {
    case 'ADD_TASK': {
      return {
        ...state,
        tasks: [...state.tasks, {
          id: generateId(),
          title: action.payload.title,
          deadline: action.payload.deadline,
          urgencyScore: 0,
          nudgeMessage: '',
          subtasks: [],
          status: 'planning',
        }],
      };
    }

    case 'APPLY_PLAN': {
      const { taskId, plan } = action.payload;
      // Find target: if taskId is __LAST__, apply to the last task still in 'planning' status
      const targetId = taskId === '__LAST__'
        ? [...state.tasks].reverse().find(t => t.status === 'planning')?.id
        : taskId;
      if (!targetId) return state;
      return {
        ...state,
        tasks: state.tasks.map(t => {
          if (t.id !== targetId) return t;
          const subtasks = plan.subtasks.map((st, i) => {
            const scheduleEntry = plan.schedule.find(s => s.subtaskIndex === i);
            return {
              id: generateId(),
              title: st.title,
              estimatedMinutes: st.estimatedMinutes,
              status: 'pending',
              assignedSlot: scheduleEntry ? {
                slotId: scheduleEntry.slotId || null,
                start: scheduleEntry.start,
                end: scheduleEntry.end,
              } : null,
            };
          });
          const hasScheduled = subtasks.some(st => st.assignedSlot);
          const allScheduled = subtasks.every(st => st.assignedSlot);
          return {
            ...t,
            urgencyScore: plan.urgencyScore,
            nudgeMessage: plan.nudgeMessage,
            subtasks,
            status: allScheduled ? 'scheduled' : hasScheduled ? 'partially-scheduled' : 'unscheduled',
          };
        }),
      };
    }

    case 'ADD_FREE_SLOT': {
      return {
        ...state,
        freeSlots: [...state.freeSlots, {
          id: generateId(),
          start: action.payload.start,
          end: action.payload.end,
        }].sort((a, b) => new Date(a.start) - new Date(b.start)),
      };
    }

    case 'REMOVE_FREE_SLOT': {
      return {
        ...state,
        freeSlots: state.freeSlots.filter(s => s.id !== action.payload),
      };
    }

    case 'UPDATE_SUBTASK_STATUS': {
      const { taskId, subtaskId, status } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map(t => {
          if (t.id !== taskId) return t;
          const updatedSubtasks = t.subtasks.map(st =>
            st.id === subtaskId ? { ...st, status } : st
          );
          const allDone = updatedSubtasks.every(st => st.status === 'done');
          return {
            ...t,
            subtasks: updatedSubtasks,
            status: allDone ? 'done' : t.status,
          };
        }),
      };
    }

    case 'SET_AGENT_THINKING': {
      return { ...state, isAgentThinking: action.payload };
    }

    case 'APPLY_REPLAN': {
      const { updatedSchedule, explanation, updatedUrgencyScores } = action.payload;
      let newTasks = state.tasks.map(t => {
        // Update urgency scores
        const scoreUpdate = updatedUrgencyScores.find(u => u.taskId === t.id);
        let updated = scoreUpdate ? { ...t, urgencyScore: scoreUpdate.newScore } : { ...t };

        // Update subtask schedules
        const relevantSchedules = updatedSchedule.filter(s => s.taskId === t.id);
        if (relevantSchedules.length > 0) {
          updated.subtasks = updated.subtasks.map(st => {
            const newSchedule = relevantSchedules.find(s => s.subtaskId === st.id);
            if (newSchedule && newSchedule.slotId) {
              return {
                ...st,
                status: st.status === 'missed' ? 'pending' : st.status,
                assignedSlot: {
                  slotId: newSchedule.slotId,
                  start: newSchedule.start,
                  end: newSchedule.end,
                },
              };
            }
            return st;
          });
        }

        return updated;
      });

      return {
        ...state,
        tasks: newTasks,
        replanReport: explanation,
        agentLog: [
          { timestamp: new Date().toISOString(), message: explanation },
          ...state.agentLog,
        ],
      };
    }

    case 'DISMISS_REPLAN_REPORT': {
      return { ...state, replanReport: null };
    }

    case 'ADD_AGENT_LOG': {
      return {
        ...state,
        agentLog: [
          { timestamp: new Date().toISOString(), message: action.payload },
          ...state.agentLog,
        ],
      };
    }

    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const addTask = useCallback((title, deadline) => {
    dispatch({ type: 'ADD_TASK', payload: { title, deadline } });
    // Return the task so callers can get the ID
    const id = state.tasks.length; // approximate, but we return for planning
    return { title, deadline };
  }, [state.tasks.length]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
}
