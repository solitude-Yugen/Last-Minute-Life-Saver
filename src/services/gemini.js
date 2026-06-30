import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

// Models to try in order of preference
const MODELS = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'];

/**
 * Try calling Gemini with fallback models and retry logic
 */
async function callGeminiWithFallback(prompt, schema, retries = 2) {
  let lastError = null;

  for (const model of MODELS) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`[Gemini] Trying ${model} (attempt ${attempt + 1})...`);
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        });
        console.log(`[Gemini] Success with ${model}`);
        return JSON.parse(response.text);
      } catch (err) {
        lastError = err;
        const status = err?.status || err?.message || '';
        console.warn(`[Gemini] ${model} attempt ${attempt + 1} failed:`, status);

        // If rate limited, wait the suggested time
        if (status.toString().includes('429') || status.toString().includes('RESOURCE_EXHAUSTED')) {
          const waitMatch = err?.message?.match(/retry in ([\d.]+)s/i);
          const waitSec = waitMatch ? Math.min(parseFloat(waitMatch[1]), 30) : 10;
          if (attempt < retries) {
            console.log(`[Gemini] Rate limited. Waiting ${waitSec}s...`);
            await new Promise(r => setTimeout(r, waitSec * 1000));
          }
        } else {
          // Non-rate-limit error, skip retries for this model
          break;
        }
      }
    }
  }

  // All models and retries exhausted — use local fallback
  console.warn('[Gemini] All models exhausted. Using local fallback planner.');
  return null;
}

/**
 * Local fallback planner — generates a reasonable plan without the API.
 * Used when Gemini quota is exhausted so the demo still works.
 */
function localPlanTask(task, freeSlots) {
  const title = task.title.toLowerCase();
  const deadline = new Date(task.deadline);
  const now = new Date();
  const hoursUntilDeadline = Math.max(0, (deadline - now) / 3600000);

  // Generate contextual subtasks based on task keywords
  let subtasks;
  if (title.includes('presentation') || title.includes('slides') || title.includes('ppt')) {
    subtasks = [
      { title: 'Outline key points and structure', estimatedMinutes: 15 },
      { title: 'Create slides with content', estimatedMinutes: 30 },
      { title: 'Add visuals and formatting', estimatedMinutes: 20 },
      { title: 'Rehearse and refine delivery', estimatedMinutes: 15 },
    ];
  } else if (title.includes('essay') || title.includes('report') || title.includes('paper') || title.includes('write')) {
    subtasks = [
      { title: 'Research and gather key sources', estimatedMinutes: 20 },
      { title: 'Write the first draft', estimatedMinutes: 35 },
      { title: 'Edit for clarity and grammar', estimatedMinutes: 15 },
      { title: 'Format and proofread final version', estimatedMinutes: 10 },
    ];
  } else if (title.includes('study') || title.includes('exam') || title.includes('test') || title.includes('quiz')) {
    subtasks = [
      { title: 'Review notes and identify weak areas', estimatedMinutes: 20 },
      { title: 'Practice key problems/concepts', estimatedMinutes: 30 },
      { title: 'Create a quick summary sheet', estimatedMinutes: 15 },
      { title: 'Do a timed mock quiz', estimatedMinutes: 20 },
    ];
  } else if (title.includes('email') || title.includes('respond') || title.includes('reply')) {
    subtasks = [
      { title: 'Read and analyze the context', estimatedMinutes: 10 },
      { title: 'Draft the response', estimatedMinutes: 15 },
      { title: 'Review and send', estimatedMinutes: 10 },
    ];
  } else if (title.includes('code') || title.includes('project') || title.includes('build') || title.includes('develop')) {
    subtasks = [
      { title: 'Plan the approach and architecture', estimatedMinutes: 15 },
      { title: 'Implement the core functionality', estimatedMinutes: 35 },
      { title: 'Test and fix bugs', estimatedMinutes: 20 },
      { title: 'Clean up and document', estimatedMinutes: 15 },
    ];
  } else if (title.includes('meeting') || title.includes('prepare') || title.includes('interview')) {
    subtasks = [
      { title: 'Review agenda and background materials', estimatedMinutes: 15 },
      { title: 'Prepare talking points and questions', estimatedMinutes: 20 },
      { title: 'Organize supporting documents', estimatedMinutes: 10 },
    ];
  } else {
    // Generic task decomposition
    subtasks = [
      { title: `Research and plan approach for "${task.title}"`, estimatedMinutes: 15 },
      { title: `Work on the main deliverable`, estimatedMinutes: 30 },
      { title: `Review and finalize`, estimatedMinutes: 15 },
    ];
  }

  // Calculate urgency score
  const totalMinutesNeeded = subtasks.reduce((s, st) => s + st.estimatedMinutes, 0);
  const totalAvailableMinutes = freeSlots.reduce((s, slot) =>
    s + Math.round((new Date(slot.end) - new Date(slot.start)) / 60000), 0);

  let urgencyScore;
  if (hoursUntilDeadline <= 1) urgencyScore = 95;
  else if (hoursUntilDeadline <= 3) urgencyScore = 82;
  else if (hoursUntilDeadline <= 6) urgencyScore = 65;
  else if (hoursUntilDeadline <= 12) urgencyScore = 48;
  else if (hoursUntilDeadline <= 24) urgencyScore = 35;
  else urgencyScore = 20;

  // Adjust urgency based on time pressure
  if (totalMinutesNeeded > totalAvailableMinutes * 0.8) {
    urgencyScore = Math.min(100, urgencyScore + 15);
  }

  // Schedule subtasks into free slots
  const schedule = [];
  let slotIndex = 0;
  let slotOffset = 0; // minutes into current slot already used

  for (let i = 0; i < subtasks.length; i++) {
    if (slotIndex >= freeSlots.length) {
      schedule.push({ subtaskIndex: i, slotId: null, start: '', end: '' });
      continue;
    }

    const slot = freeSlots[slotIndex];
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);
    const slotRemaining = Math.round((slotEnd - slotStart) / 60000) - slotOffset;

    if (subtasks[i].estimatedMinutes <= slotRemaining) {
      const start = new Date(slotStart.getTime() + slotOffset * 60000);
      const end = new Date(start.getTime() + subtasks[i].estimatedMinutes * 60000);
      schedule.push({
        subtaskIndex: i,
        slotId: slot.id,
        start: start.toISOString(),
        end: end.toISOString(),
      });
      slotOffset += subtasks[i].estimatedMinutes;
    } else if (slotRemaining >= 10) {
      // Partial fit — use this slot anyway
      const start = new Date(slotStart.getTime() + slotOffset * 60000);
      const end = new Date(Math.min(start.getTime() + subtasks[i].estimatedMinutes * 60000, slotEnd.getTime()));
      schedule.push({
        subtaskIndex: i,
        slotId: slot.id,
        start: start.toISOString(),
        end: end.toISOString(),
      });
      slotIndex++;
      slotOffset = 0;
    } else {
      // Move to next slot
      slotIndex++;
      slotOffset = 0;
      i--; // retry this subtask with next slot
    }
  }

  // Generate nudge message
  const firstSubtask = subtasks[0].title;
  const nudgeMessages = [
    `Start with "${firstSubtask}" right now — it's the quickest win to build momentum.`,
    `Your first step: ${firstSubtask}. Open your workspace and dive in — the clock is ticking!`,
    `Don't overthink it — begin with "${firstSubtask}" and you'll be rolling in minutes.`,
    `Focus on "${firstSubtask}" first. ${hoursUntilDeadline < 3 ? "You're tight on time, every minute counts!" : "You have a solid runway if you start now."}`,
  ];

  return {
    subtasks,
    urgencyScore,
    nudgeMessage: nudgeMessages[Math.floor(Math.random() * nudgeMessages.length)],
    schedule,
    _fallback: true,
  };
}

/**
 * Local fallback for re-planning
 */
function localReplan(allTasks, freeSlots, missedInfo) {
  // Collect all pending/missed subtasks across all tasks
  const pendingItems = [];
  allTasks.forEach(task => {
    task.subtasks.forEach(st => {
      if (st.status === 'pending' || st.status === 'missed' || st.status === 'in-progress') {
        pendingItems.push({
          taskId: task.id,
          subtaskId: st.id,
          title: st.title,
          taskTitle: task.title,
          estimatedMinutes: st.estimatedMinutes,
          deadline: task.deadline,
          urgencyScore: task.urgencyScore,
        });
      }
    });
  });

  // Sort by deadline urgency (closest deadline first)
  pendingItems.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

  // Reschedule into available slots
  const updatedSchedule = [];
  let slotIndex = 0;
  let slotOffset = 0;

  for (const item of pendingItems) {
    if (slotIndex >= freeSlots.length) {
      updatedSchedule.push({
        taskId: item.taskId,
        subtaskId: item.subtaskId,
        slotId: null,
        start: '',
        end: '',
      });
      continue;
    }

    const slot = freeSlots[slotIndex];
    const slotStart = new Date(slot.start);
    const slotEnd = new Date(slot.end);
    const slotRemaining = Math.round((slotEnd - slotStart) / 60000) - slotOffset;

    if (item.estimatedMinutes <= slotRemaining) {
      const start = new Date(slotStart.getTime() + slotOffset * 60000);
      const end = new Date(start.getTime() + item.estimatedMinutes * 60000);
      updatedSchedule.push({
        taskId: item.taskId,
        subtaskId: item.subtaskId,
        slotId: slot.id,
        start: start.toISOString(),
        end: end.toISOString(),
      });
      slotOffset += item.estimatedMinutes;
    } else {
      slotIndex++;
      slotOffset = 0;
      // Retry with next slot
      if (slotIndex < freeSlots.length) {
        const nextSlot = freeSlots[slotIndex];
        const nextStart = new Date(nextSlot.start);
        const nextEnd = new Date(nextStart.getTime() + item.estimatedMinutes * 60000);
        updatedSchedule.push({
          taskId: item.taskId,
          subtaskId: item.subtaskId,
          slotId: nextSlot.id,
          start: nextStart.toISOString(),
          end: nextEnd.toISOString(),
        });
        slotOffset = item.estimatedMinutes;
      } else {
        updatedSchedule.push({
          taskId: item.taskId,
          subtaskId: item.subtaskId,
          slotId: null,
          start: '',
          end: '',
        });
      }
    }
  }

  // Update urgency scores (increase for missed task)
  const updatedUrgencyScores = allTasks.map(t => ({
    taskId: t.id,
    newScore: t.subtasks.some(st => st.id === missedInfo.subtaskId)
      ? Math.min(100, t.urgencyScore + 12)
      : Math.min(100, t.urgencyScore + 5),
  }));

  const explanation = `You missed "${missedInfo.subtaskTitle}" from "${missedInfo.taskTitle}". I've reshuffled your remaining ${pendingItems.length} subtasks into your available time slots, prioritizing by deadline urgency. ${
    missedInfo.taskTitle
  }'s urgency has increased since you lost a scheduled slot. ${
    pendingItems.length > 2
      ? "I've packed the tighter-deadline items into your earliest available windows to keep you on track."
      : "Focus on knocking out the next item as soon as you can."
  }`;

  return {
    updatedSchedule,
    explanation,
    updatedUrgencyScores,
    _fallback: true,
  };
}

/**
 * Plan a task: decompose into subtasks, estimate effort, assign to free slots, compute urgency.
 */
export async function planTask(task, freeSlots, existingSchedule) {
  const now = new Date().toISOString();

  const prompt = `You are an AI productivity agent called "Last-Minute Life Saver". Your job is to help users complete tasks before their deadlines by breaking them down and scheduling them into available free time.

CURRENT TIME: ${now}

TASK TO PLAN:
- Title: "${task.title}"
- Deadline: ${task.deadline}

AVAILABLE FREE TIME SLOTS (user's availability):
${freeSlots.length > 0 ? freeSlots.map(s => `- Slot ID "${s.id}": ${s.start} to ${s.end} (${Math.round((new Date(s.end) - new Date(s.start)) / 60000)} minutes available)`).join('\n') : '- No free slots available'}

ALREADY SCHEDULED ITEMS (avoid conflicts):
${existingSchedule.length > 0 ? existingSchedule.map(s => `- "${s.title}": ${s.start} to ${s.end}`).join('\n') : '- Nothing scheduled yet'}

INSTRUCTIONS:
1. Decompose the task into 2-5 concrete, actionable subtasks. Each should be a specific action the user can do, not vague.
2. Estimate effort in minutes for each subtask (be realistic, round to 5-minute increments, minimum 10 minutes).
3. Compute an urgency score from 0-100 based on: how close the deadline is, total effort needed vs time available, and risk of missing the deadline. Score 80+ means critical (deadline is very close or not enough time), 60-79 is high, 40-59 is medium, below 40 is low.
4. Assign each subtask to the soonest free time slot that can fit it. If a slot has more time than needed, use only the needed portion from the start of the available window. If no slot fits, leave it unassigned (set slotId to null).
5. Write one short, direct nudge message (1-2 sentences max) telling the user what to do RIGHT NOW. Be specific and action-oriented, not generic. Example: "Open your laptop and outline the 3 key points for your presentation — you have a 45-min window starting now."

Return valid JSON matching this exact structure.`;

  const schema = {
    type: 'object',
    properties: {
      subtasks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            estimatedMinutes: { type: 'number' },
          },
          required: ['title', 'estimatedMinutes'],
        },
      },
      urgencyScore: { type: 'number' },
      nudgeMessage: { type: 'string' },
      schedule: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            subtaskIndex: { type: 'number' },
            slotId: { type: 'string', nullable: true },
            start: { type: 'string' },
            end: { type: 'string' },
          },
          required: ['subtaskIndex'],
        },
      },
    },
    required: ['subtasks', 'urgencyScore', 'nudgeMessage', 'schedule'],
  };

  const result = await callGeminiWithFallback(prompt, schema);

  // If all models failed, use local fallback
  if (!result) {
    console.log('[Planner] Using local fallback planner');
    return localPlanTask(task, freeSlots);
  }

  return result;
}

/**
 * Re-plan after a missed subtask: reshuffle remaining work into available slots.
 */
export async function replanAfterMiss(allTasks, freeSlots, missedSubtaskInfo) {
  const now = new Date().toISOString();

  const tasksSummary = allTasks.map(t => ({
    taskId: t.id,
    title: t.title,
    deadline: t.deadline,
    currentUrgency: t.urgencyScore,
    subtasks: t.subtasks.map(st => ({
      subtaskId: st.id,
      title: st.title,
      estimatedMinutes: st.estimatedMinutes,
      status: st.status,
      currentSlot: st.assignedSlot,
    })),
  }));

  const prompt = `You are an AI productivity agent called "Last-Minute Life Saver". The user just MISSED a scheduled subtask, and you need to re-plan their remaining work.

CURRENT TIME: ${now}

MISSED SUBTASK:
- Task: "${missedSubtaskInfo.taskTitle}"
- Subtask: "${missedSubtaskInfo.subtaskTitle}"
- Was scheduled for: ${missedSubtaskInfo.originalSlot?.start || 'unknown'} to ${missedSubtaskInfo.originalSlot?.end || 'unknown'}

ALL TASKS AND THEIR CURRENT STATE:
${JSON.stringify(tasksSummary, null, 2)}

REMAINING AVAILABLE FREE TIME SLOTS:
${freeSlots.map(s => `- Slot ID "${s.id}": ${s.start} to ${s.end} (${Math.round((new Date(s.end) - new Date(s.start)) / 60000)} minutes)`).join('\n')}

INSTRUCTIONS:
1. Reshuffle ALL remaining pending/missed subtasks (across all tasks) into the available free time slots. Prioritize by deadline urgency — tasks with closer deadlines should be scheduled first.
2. Update urgency scores for any tasks affected by the miss (they should generally go up).
3. Write a brief, plain-language explanation of what you changed and WHY. Be specific — mention task names, times, and reasoning. Example: "Moved 'Draft email' to your 4:00 PM slot since 'Prepare slides' has a tighter deadline and needs the 2:00 PM window. Your urgency for the email task increased to 75 since you lost the earlier slot."

Return valid JSON matching this exact structure.`;

  const schema = {
    type: 'object',
    properties: {
      updatedSchedule: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
            subtaskId: { type: 'string' },
            slotId: { type: 'string', nullable: true },
            start: { type: 'string' },
            end: { type: 'string' },
          },
          required: ['taskId', 'subtaskId'],
        },
      },
      explanation: { type: 'string' },
      updatedUrgencyScores: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            taskId: { type: 'string' },
            newScore: { type: 'number' },
          },
          required: ['taskId', 'newScore'],
        },
      },
    },
    required: ['updatedSchedule', 'explanation', 'updatedUrgencyScores'],
  };

  const result = await callGeminiWithFallback(prompt, schema);

  // If all models failed, use local fallback
  if (!result) {
    console.log('[Replanner] Using local fallback replanner');
    return localReplan(allTasks, freeSlots, missedSubtaskInfo);
  }

  return result;
}
