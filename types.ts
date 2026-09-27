export type Version = 'Apex';

export type WorkoutMode = 'gym' | 'home';

export type EquipmentStatus = 'available' | 'occupied' | 'unavailable';

export interface EquipmentItem {
  id: string;
  name: string;
  category: 'strength' | 'cardio';
  defaultStatus?: EquipmentStatus;
}

export interface Exercise {
  id: string;
  order: string; // e.g., '1A', '1B', 'FINISHER'
  name: string;
  sets: number;
  reps: string; // string to handle "8/side", "Failure"
  tempo: string;
  notes: string;
  weightGuide: string;
  videoUrl?: string;
  isRest?: boolean;
  alternatives?: Exercise[];
  // Recommendation & filtering metadata:
  equipment?: string; // 'Dumbbells', 'Machine', 'Cable', 'Bodyweight', 'Bands', 'Barbell', etc.
  targetMuscles?: string; // e.g. 'Quads & Glutes', 'Chest & Triceps', 'Lats & Back'
  movementPattern?: string; // e.g. 'Squat / Lunge', 'Hinge', 'Horizontal Push', 'Horizontal Pull'
  mode?: 'all' | 'gym' | 'home';
}

export interface WorkoutDay {
  id: string;
  title: string;
  focus: string;
  sessionCode?: 'A' | 'B' | 'C' | 'Run';
  exercises: Exercise[];
}

export interface WorkoutPlan {
  Apex: Record<string, WorkoutDay>;
}

export interface ExerciseLog {
  exerciseId: string;
  setLogs: {
    weight: string;
    reps: string;
    effort: number; // 1-4 level theory
    completed: boolean;
  }[];
}

export interface SessionLog {
  id: string;
  date: string;
  version: Version;
  dayId: string; // e.g., 'monday' (Session A), 'wednesday' (Session B), 'friday' (Session C)
  exercises: ExerciseLog[];
  feedback?: string;
  duration?: number; // minutes
  mode?: WorkoutMode;
  cardioFinisher?: {
    type: string;
    durationMinutes: number;
    distanceOrPace?: string;
    notes?: string;
  };
}

export interface WeeklySchedule {
  [key: number]: string; // 0=Sunday, 1=Monday, etc. -> key to WorkoutDay
}

export interface SubstitutionMatrix {
  [dayId: string]: {
    [order: string]: Exercise[];
  };
}

export interface CadenceStats {
  weekStart: string;
  weekEnd: string;
  completedThisWeek: number;
  targetSessions: number;
  completedSessionIds: string[];
  lastCompletedSessionId: string | null;
  nextRecommendedSessionId: string;
}
