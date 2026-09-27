import { SessionLog, Version, ExerciseLog, Exercise, WorkoutDay, WorkoutMode, EquipmentStatus, CadenceStats } from '../types';
import { ROTATING_SESSION_KEYS, RotatingSessionKey } from '../constants';

const LOGS_KEY = 'golf_tracker_logs';
const VERSION_KEY = 'golf_tracker_version';
const DRAFT_KEY_PREFIX = 'golf_tracker_draft_';
const PREFS_KEY_PREFIX = 'golf_tracker_prefs_';
const CUSTOM_WORKOUTS_KEY = 'custom_workouts';
const WORKOUT_MODE_KEY = 'golf_tracker_workout_mode';
const EQUIPMENT_STATUS_KEY = 'condo_gym_equipment_status';

export const getLogs = (): SessionLog[] => {
  const stored = localStorage.getItem(LOGS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveLog = (log: SessionLog) => {
  const logs = getLogs();
  logs.unshift(log); // Add to top
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
  clearDraft(log.dayId); // Clear draft once successfully saved
};

export const getPreferredVersion = (): Version => {
  return (localStorage.getItem(VERSION_KEY) as Version) || 'Apex';
};

export const setPreferredVersion = (v: Version) => {
  localStorage.setItem(VERSION_KEY, v);
};

// --- Mode & Equipment Preferences ---
export const getWorkoutMode = (): WorkoutMode => {
  const stored = localStorage.getItem(WORKOUT_MODE_KEY);
  return stored === 'home' ? 'home' : 'gym';
};

export const setWorkoutMode = (mode: WorkoutMode) => {
  localStorage.setItem(WORKOUT_MODE_KEY, mode);
};

export const getEquipmentStatus = (): Record<string, EquipmentStatus> => {
  const stored = localStorage.getItem(EQUIPMENT_STATUS_KEY);
  return stored ? JSON.parse(stored) : {};
};

export const setEquipmentStatus = (status: Record<string, EquipmentStatus>) => {
  localStorage.setItem(EQUIPMENT_STATUS_KEY, JSON.stringify(status));
};

export const updateSingleEquipmentStatus = (equipmentId: string, status: EquipmentStatus) => {
  const current = getEquipmentStatus();
  current[equipmentId] = status;
  setEquipmentStatus(current);
};

// --- Custom Workouts Storage ---
export const getCustomWorkouts = (): Record<string, WorkoutDay> | null => {
  const stored = localStorage.getItem(CUSTOM_WORKOUTS_KEY);
  return stored ? JSON.parse(stored) : null;
};

export const saveCustomWorkouts = (workouts: Record<string, WorkoutDay> | null) => {
  if (workouts) {
    localStorage.setItem(CUSTOM_WORKOUTS_KEY, JSON.stringify(workouts));
  } else {
    localStorage.removeItem(CUSTOM_WORKOUTS_KEY);
  }
};

export const addCustomAlternativeToWorkout = (
  dayId: string,
  order: string,
  newAlternative: Exercise,
  baseWorkouts: Record<string, WorkoutDay>
): Record<string, WorkoutDay> => {
  const currentCustom = getCustomWorkouts() || JSON.parse(JSON.stringify(baseWorkouts));
  const targetDay = currentCustom[dayId];
  if (!targetDay) return currentCustom;

  const targetExercise = targetDay.exercises.find((e: Exercise) => e.order === order);
  if (targetExercise) {
    targetExercise.alternatives = targetExercise.alternatives || [];
    // Ensure uniqueness by ID
    const exists = targetExercise.alternatives.some((a: Exercise) => a.id === newAlternative.id);
    if (!exists) {
      targetExercise.alternatives.push(newAlternative);
    }
  }

  saveCustomWorkouts(currentCustom);
  return currentCustom;
};

export const getLastLogForExercise = (exerciseId: string): ExerciseLog | null => {
  const logs = getLogs();
  for (const session of logs) {
    const found = session.exercises.find(e => e.exerciseId === exerciseId);
    if (found) return found;
  }
  return null;
};

// --- Workout Drafts (Auto-Save) ---
export interface WorkoutDraft {
  dayId: string;
  exercises: Exercise[];
  logs: ExerciseLog[];
  date: string;
  mode?: WorkoutMode;
}

export const saveDraft = (draft: WorkoutDraft) => {
  localStorage.setItem(`${DRAFT_KEY_PREFIX}${draft.dayId}`, JSON.stringify(draft));
};

export const getDraft = (dayId: string): WorkoutDraft | null => {
  const stored = localStorage.getItem(`${DRAFT_KEY_PREFIX}${dayId}`);
  return stored ? JSON.parse(stored) : null;
};

export const clearDraft = (dayId: string) => {
  localStorage.removeItem(`${DRAFT_KEY_PREFIX}${dayId}`);
};

// --- Exercise Preferences (Substitutions) ---
export const saveExercisePreference = (dayId: string, order: string, exerciseId: string) => {
  const prefs = getExercisePreferences(dayId);
  prefs[order] = exerciseId;
  localStorage.setItem(`${PREFS_KEY_PREFIX}${dayId}`, JSON.stringify(prefs));
};

export const getExercisePreferences = (dayId: string): Record<string, string> => {
  const stored = localStorage.getItem(`${PREFS_KEY_PREFIX}${dayId}`);
  return stored ? JSON.parse(stored) : {};
};

// --- Flexible Cadence & Rotating Sequence Calculations ---
export const getWeekRange = (date: Date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = day === 0 ? -6 : 1 - day;
  
  const monday = new Date(d);
  monday.setDate(d.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { monday, sunday };
};

export const getNextRotatingSession = (lastSessionKey: string | null): RotatingSessionKey => {
  if (!lastSessionKey) return 'monday'; // Start with Session A
  const normalizedKey = lastSessionKey.toLowerCase();
  
  if (normalizedKey === 'monday' || normalizedKey === 'session_a') return 'wednesday';
  if (normalizedKey === 'wednesday' || normalizedKey === 'session_b') return 'friday';
  if (normalizedKey === 'friday' || normalizedKey === 'session_c') return 'monday';
  
  return 'monday';
};

export const getCadenceStats = (referenceDate: Date = new Date()): CadenceStats => {
  const { monday, sunday } = getWeekRange(referenceDate);
  const logs = getLogs();

  // Find logs completed in the current week
  const logsThisWeek = logs.filter(l => {
    const logTime = new Date(l.date).getTime();
    return logTime >= monday.getTime() && logTime <= sunday.getTime();
  });

  // Count planned resistance sessions (Session A, B, C)
  const completedSessionIds = logsThisWeek.map(l => l.dayId);
  const completedThisWeek = logsThisWeek.length;

  // Find the overall latest completed resistance session across all history
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastCompletedSession = sortedLogs.find(l => 
    l.dayId === 'monday' || l.dayId === 'wednesday' || l.dayId === 'friday'
  );

  const lastCompletedSessionId = lastCompletedSession ? lastCompletedSession.dayId : null;
  const nextRecommendedSessionId = getNextRotatingSession(lastCompletedSessionId);

  return {
    weekStart: monday.toISOString(),
    weekEnd: sunday.toISOString(),
    completedThisWeek,
    targetSessions: 3,
    completedSessionIds,
    lastCompletedSessionId,
    nextRecommendedSessionId
  };
};

// --- Sync & Backup Logic ---

const utob = (str: string) => {
  return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => {
    return String.fromCharCode(parseInt(p1, 16));
  }));
};

const btou = (str: string) => {
  return decodeURIComponent(Array.prototype.map.call(atob(str), (c) => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
  }).join(''));
};

export const exportAllData = (): string => {
  try {
    const logs = localStorage.getItem(LOGS_KEY) || '[]';
    const version = localStorage.getItem(VERSION_KEY) || '"Apex"';
    const customWorkouts = localStorage.getItem(CUSTOM_WORKOUTS_KEY) || 'null';
    const workoutMode = localStorage.getItem(WORKOUT_MODE_KEY) || '"gym"';
    const equipmentStatus = localStorage.getItem(EQUIPMENT_STATUS_KEY) || '{}';
    
    const preferences: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFS_KEY_PREFIX)) {
        preferences[key] = JSON.parse(localStorage.getItem(key) || '{}');
      }
    }

    const exportObj = {
      logs: JSON.parse(logs),
      version: JSON.parse(version),
      customWorkouts: JSON.parse(customWorkouts),
      workoutMode: JSON.parse(workoutMode),
      equipmentStatus: JSON.parse(equipmentStatus),
      preferences,
      timestamp: Date.now()
    };

    return utob(JSON.stringify(exportObj));
  } catch (err) {
    console.error("Export failed", err);
    return "";
  }
};

export const importAllData = (base64Data: string): { success: boolean, message: string } => {
  if (!base64Data || !base64Data.trim()) {
    return { success: false, message: "Sync code is empty." };
  }

  try {
    const cleanData = base64Data.trim().replace(/\s/g, '');
    const decoded = btou(cleanData);
    const data = JSON.parse(decoded);

    if (!data || typeof data !== 'object') {
      throw new Error("Invalid sync code format.");
    }

    if (!data.logs || !Array.isArray(data.logs)) {
      throw new Error("Sync code missing workout history.");
    }

    // 1. Merge Logs Non-Destructively
    const currentLogs = getLogs();
    const existingIds = new Set(currentLogs.map(l => l.id));
    const newLogs = data.logs.filter((l: SessionLog) => l && l.id && !existingIds.has(l.id));
    
    const mergedLogs = [...newLogs, ...currentLogs].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    localStorage.setItem(LOGS_KEY, JSON.stringify(mergedLogs));

    // 2. Import Preferences
    if (data.preferences && typeof data.preferences === 'object') {
      Object.entries(data.preferences).forEach(([key, value]) => {
        if (key.startsWith(PREFS_KEY_PREFIX)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });
    }

    // 3. Import Custom Workouts if present
    if (data.customWorkouts && typeof data.customWorkouts === 'object') {
      localStorage.setItem(CUSTOM_WORKOUTS_KEY, JSON.stringify(data.customWorkouts));
    }

    // 4. Import Mode & Equipment if present
    if (data.workoutMode) {
      localStorage.setItem(WORKOUT_MODE_KEY, data.workoutMode);
    }
    if (data.equipmentStatus) {
      localStorage.setItem(EQUIPMENT_STATUS_KEY, JSON.stringify(data.equipmentStatus));
    }

    // 5. Version
    if (data.version && (data.version === 'Apex')) {
      localStorage.setItem(VERSION_KEY, data.version);
    }

    return { 
      success: true, 
      message: newLogs.length > 0 
        ? `Successfully imported ${newLogs.length} new sessions!` 
        : "Sync complete! Data up to date." 
    };
  } catch (error) {
    console.error("Import Error Detail:", error);
    return { 
      success: false, 
      message: "Sync Failed: Invalid code format. Please check and try again." 
    };
  }
};
