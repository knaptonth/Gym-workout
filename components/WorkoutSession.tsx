import React, { useState, useEffect, useRef } from 'react';
import { WorkoutDay, ExerciseLog, Version, Exercise, WorkoutMode, EquipmentStatus } from '../types';
import { WORKOUTS, CONDO_EQUIPMENT_LIST, CONDO_CARDIO_FINISHERS } from '../constants';
import { 
  CheckCircle2, Clock, Info, ChevronLeft, RefreshCw, X, Check, Plus, Gauge, 
  Trash2, Sparkles, Zap, ArrowRight, Trophy, AlertTriangle, Search, ExternalLink, 
  Dumbbell, Activity, ShieldCheck, SlidersHorizontal
} from 'lucide-react';
import { 
  saveLog, getLastLogForExercise, saveDraft, getDraft, 
  saveExercisePreference, getExercisePreferences, getWorkoutMode, 
  getEquipmentStatus, updateSingleEquipmentStatus, addCustomAlternativeToWorkout 
} from '../services/storageService';
import { analyzeSession } from '../services/geminiService';

interface WorkoutSessionProps {
  day: WorkoutDay;
  version: Version;
  date: Date;
  onFinish: () => void;
  onBack: () => void;
}

const EFFORT_LEVELS = [
  { level: 1, label: 'Easy', desc: 'Warm-up / RPE 4-5', color: 'bg-emerald-500', bg: 'bg-emerald-500/20', border: 'border-emerald-500/50', text: 'text-emerald-400' },
  { level: 2, label: 'Mod', desc: 'RPE 6-7 (Good pace)', color: 'bg-blue-500', bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400' },
  { level: 3, label: 'Hard', desc: 'RPE 8-9 (1-2 in tank)', color: 'bg-amber-500', bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400' },
  { level: 4, label: 'Max', desc: 'Failure / Max effort', color: 'bg-rose-500', bg: 'bg-rose-500/20', border: 'border-rose-500/50', text: 'text-rose-400' },
];

export const WorkoutSession: React.FC<WorkoutSessionProps> = ({ day, version, date, onFinish, onBack }) => {
  const [activeExercises, setActiveExercises] = useState<Exercise[]>([]);
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [isRestored, setIsRestored] = useState(false);
  const isInitialLoad = useRef(true);

  // Mode and Equipment States
  const [mode, setMode] = useState<WorkoutMode>(getWorkoutMode());
  const [equipmentStatus, setEquipmentStatusState] = useState<Record<string, EquipmentStatus>>(getEquipmentStatus());
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  
  // Modals & Forms
  const [swapIndex, setSwapIndex] = useState<number | null>(null);
  const [swapFilter, setSwapFilter] = useState<'all' | 'available' | 'home' | 'gym'>('all');
  const [showAddCustomAlt, setShowAddCustomAlt] = useState(false);
  const [customAltName, setCustomAltName] = useState('');
  const [customAltEquipment, setCustomAltEquipment] = useState('Dumbbells');
  const [customAltNotes, setCustomAltNotes] = useState('');
  const [effortPicker, setEffortPicker] = useState<{ exerciseId: string; setIndex: number } | null>(null);

  // Optional Cardio Finisher state
  const [selectedCardioFinisher, setSelectedCardioFinisher] = useState<string | null>(null);
  const [cardioDuration, setCardioDuration] = useState('10');
  const [cardioNotes, setCardioNotes] = useState('');

  // Initial Load: Draft restore and mode-based preferences
  useEffect(() => {
    const draft = getDraft(day.id);
    const todayStr = date.toISOString().split('T')[0];
    const draftDateStr = draft?.date ? new Date(draft.date).toISOString().split('T')[0] : null;

    if (draft && draftDateStr === todayStr) {
      setActiveExercises(draft.exercises);
      setLogs(draft.logs);
      if (draft.mode) setMode(draft.mode);
      setIsRestored(true);
      setTimeout(() => setIsRestored(false), 3000);
    } else {
      const prefs = getExercisePreferences(day.id);
      
      const preparedExercises = day.exercises.map(ex => {
        if (ex.isRest) return ex;

        // If user already saved a manual preference for this slot, respect it
        const preferredId = prefs[ex.order];
        if (preferredId) {
          if (preferredId === ex.id) return ex;
          const found = ex.alternatives?.find(a => a.id === preferredId);
          if (found) return found;
        }

        // If in Home mode and the main exercise is machine-only, auto-suggest first home-friendly alternative
        if (mode === 'home' && ex.mode === 'gym' && ex.alternatives && ex.alternatives.length > 0) {
          const homeAlt = ex.alternatives.find(a => a.mode === 'home' || a.mode === 'all' || a.equipment?.toLowerCase().includes('dumbbell'));
          if (homeAlt) return homeAlt;
        }

        return ex;
      });

      setActiveExercises(preparedExercises);

      const initialLogs: ExerciseLog[] = preparedExercises
        .filter(e => !e.isRest)
        .map(e => {
          const lastLog = getLastLogForExercise(e.id);
          const setLogsCount = e.sets || 1;
          
          return {
            exerciseId: e.id,
            setLogs: Array(setLogsCount).fill(null).map((_, i) => ({
              weight: lastLog?.setLogs[i]?.weight || lastLog?.setLogs[0]?.weight || '',
              reps: lastLog?.setLogs[i]?.reps || lastLog?.setLogs[0]?.reps || '',
              effort: lastLog?.setLogs[i]?.effort || 2,
              completed: false
            }))
          };
        });
      setLogs(initialLogs);
    }
    isInitialLoad.current = false;
  }, [day.id]);

  // Auto-save draft
  useEffect(() => {
    if (isInitialLoad.current || activeExercises.length === 0) return;
    saveDraft({
      dayId: day.id,
      exercises: activeExercises,
      logs: logs,
      date: date.toISOString(),
      mode
    });
  }, [logs, activeExercises, day.id, date, mode]);

  const handleToggleEquipment = (eqId: string) => {
    const current = equipmentStatus[eqId] || 'available';
    const next: EquipmentStatus = current === 'available' ? 'occupied' : current === 'occupied' ? 'unavailable' : 'available';
    updateSingleEquipmentStatus(eqId, next);
    setEquipmentStatusState(prev => ({ ...prev, [eqId]: next }));
  };

  const getEquipmentAvailability = (equipmentName?: string): EquipmentStatus => {
    if (!equipmentName) return 'available';
    const match = CONDO_EQUIPMENT_LIST.find(e => 
      e.name.toLowerCase().includes(equipmentName.toLowerCase()) || 
      equipmentName.toLowerCase().includes(e.name.toLowerCase())
    );
    if (!match) return 'available';
    return equipmentStatus[match.id] || 'available';
  };

  const updateLog = (exerciseId: string, setIndex: number, field: keyof ExerciseLog['setLogs'][0], value: any) => {
    setLogs(prev => prev.map(log => {
      if (log.exerciseId !== exerciseId) return log;
      const newSets = [...log.setLogs];
      newSets[setIndex] = { ...newSets[setIndex], [field]: value };
      return { ...log, setLogs: newSets };
    }));
  };

  const toggleComplete = (exerciseId: string, setIndex: number) => {
    setLogs(prev => prev.map(log => {
      if (log.exerciseId !== exerciseId) return log;
      const newSets = [...log.setLogs];
      newSets[setIndex] = { ...newSets[setIndex], completed: !newSets[setIndex].completed };
      return { ...log, setLogs: newSets };
    }));
  };

  const addSet = (exerciseId: string) => {
    setLogs(prev => prev.map(log => {
      if (log.exerciseId !== exerciseId) return log;
      const lastSet = log.setLogs[log.setLogs.length - 1];
      const newSet = {
        weight: lastSet?.weight || '',
        reps: lastSet?.reps || '',
        effort: lastSet?.effort || 2,
        completed: false
      };
      return { ...log, setLogs: [...log.setLogs, newSet] };
    }));
  };

  const removeSet = (exerciseId: string) => {
    setLogs(prev => prev.map(log => {
      if (log.exerciseId !== exerciseId) return log;
      if (log.setLogs.length <= 1) return log;
      return { ...log, setLogs: log.setLogs.slice(0, -1) };
    }));
  };

  // Find all alternatives without ever losing the original main exercise definition
  const getAlternates = (currentEx: Exercise): Exercise[] | null => {
    if (currentEx.isRest) return null;
    
    // Always locate the original main exercise from day.exercises for this slot order
    const mainEx = day.exercises.find(e => e.order === currentEx.order);
    const allOptions: Exercise[] = [];
    
    if (mainEx) {
      allOptions.push(mainEx);
      if (mainEx.alternatives && mainEx.alternatives.length > 0) {
        allOptions.push(...mainEx.alternatives);
      }
    }
    
    // Deduplicate by ID
    const uniqueMap = new Map<string, Exercise>();
    allOptions.forEach(item => uniqueMap.set(item.id, item));
    const unique = Array.from(uniqueMap.values());
    return unique.length > 0 ? unique : null;
  };

  const handleSwapExercise = (newEx: Exercise) => {
    if (swapIndex === null) return;
    const oldEx = activeExercises[swapIndex];
    if (oldEx.id === newEx.id) {
      setSwapIndex(null);
      return;
    }
    saveExercisePreference(day.id, oldEx.order, newEx.id);
    const updatedExercises = [...activeExercises];
    updatedExercises[swapIndex] = newEx;
    setActiveExercises(updatedExercises);

    setLogs(prev => {
      const existingNewExLog = prev.find(l => l.exerciseId === newEx.id);
      if (existingNewExLog) return prev;
      const lastLog = getLastLogForExercise(newEx.id);
      const setLogsCount = newEx.sets || 1;
      const newExLog = {
        exerciseId: newEx.id,
        setLogs: Array(setLogsCount).fill(null).map((_, i) => ({
          weight: lastLog?.setLogs[i]?.weight || lastLog?.setLogs[0]?.weight || '',
          reps: lastLog?.setLogs[i]?.reps || lastLog?.setLogs[0]?.reps || '',
          effort: lastLog?.setLogs[i]?.effort || 2,
          completed: false
        }))
      };
      return prev.map(log => log.exerciseId === oldEx.id ? newExLog : log);
    });
    setSwapIndex(null);
  };

  const handleCreateCustomAlternative = () => {
    if (!customAltName.trim() || swapIndex === null) return;
    const currentEx = activeExercises[swapIndex];
    const newAltId = `CUSTOM_${currentEx.order}_${Date.now()}`;
    
    const newAlt: Exercise = {
      id: newAltId,
      order: currentEx.order,
      name: customAltName.trim(),
      sets: currentEx.sets || 3,
      reps: currentEx.reps || '10-12',
      tempo: currentEx.tempo || '2-0-1',
      notes: customAltNotes.trim() || 'Custom user alternative',
      weightGuide: 'Moderate',
      equipment: customAltEquipment,
      mode: 'all',
      isRest: false
    };

    // Save into custom workouts storage so it persists forever
    addCustomAlternativeToWorkout(day.id, currentEx.order, newAlt, WORKOUTS[version]);
    
    // Also attach to the local day reference so UI updates immediately
    const mainEx = day.exercises.find(e => e.order === currentEx.order);
    if (mainEx) {
      mainEx.alternatives = mainEx.alternatives || [];
      mainEx.alternatives.push(newAlt);
    }

    // Select it directly
    handleSwapExercise(newAlt);
    setCustomAltName('');
    setCustomAltNotes('');
    setShowAddCustomAlt(false);
  };

  const executeSave = (withAI: boolean) => {
    const sessionLog = {
      id: Date.now().toString(),
      date: date.toISOString(),
      version,
      dayId: day.id,
      exercises: logs,
      mode,
      cardioFinisher: selectedCardioFinisher ? {
        type: selectedCardioFinisher,
        durationMinutes: parseInt(cardioDuration, 10) || 10,
        notes: cardioNotes
      } : undefined
    };

    if (withAI) {
      setIsSubmitting(true);
      analyzeSession(sessionLog).then(aiFeedback => {
        saveLog({ ...sessionLog, feedback: aiFeedback });
        setFeedback(aiFeedback);
        setShowFeedback(true);
        setIsSubmitting(false);
      });
    } else {
      saveLog(sessionLog);
      onFinish();
    }
  };

  const totalSetsCompleted = logs.reduce((acc, l) => acc + l.setLogs.filter(s => s.completed).length, 0);

  // --- COMPLETED AI FEEDBACK VIEW ---
  if (showFeedback) {
    return (
      <div className="flex flex-col h-full justify-center items-center p-4 text-center animate-fade-in pt-safe">
        <div className="bg-blue-500/10 p-5 rounded-full mb-5 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10">
          <CheckCircle2 className="w-16 h-16 text-blue-500" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Workout Complete!</h2>
        <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 w-full text-left mb-6 shadow-2xl overflow-y-auto max-h-[50vh]">
          <div className="flex items-center gap-2 mb-3 text-amber-400 font-bold uppercase tracking-wider text-xs">
            <Sparkles size={16} />
            <span>Apex Coach Review</span>
          </div>
          <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-sm">{feedback}</p>
        </div>
        <button onClick={onFinish} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-base py-4 rounded-2xl transition shadow-xl shadow-blue-900/40 active:scale-[0.98]">
          Return to Dashboard
        </button>
      </div>
    );
  }

  // --- SESSION FINALIZING VIEW ---
  if (isFinalizing) {
    return (
      <div className="min-h-safe flex flex-col justify-center animate-fade-in px-4 pb-safe">
        <div className="bg-slate-900 border border-white/5 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
          <div className="text-center space-y-6">
            <div className="space-y-1">
              <div className="mx-auto w-14 h-14 bg-blue-600/20 rounded-full flex items-center justify-center mb-3">
                <Trophy size={28} className="text-blue-500" />
              </div>
              <h2 className="text-2xl font-black text-white leading-tight">Session Summary</h2>
              <p className="text-slate-400 text-sm">Great execution. Recovery begins now.</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/70 p-4 rounded-2xl border border-white/5 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Total Sets</p>
                <p className="text-2xl font-black text-white">{totalSetsCompleted}</p>
              </div>
              <div className="bg-slate-800/70 p-4 rounded-2xl border border-white/5 text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Workout Mode</p>
                <p className="text-sm font-bold text-blue-400 mt-1 uppercase">{mode === 'gym' ? 'Condo Gym' : 'Home Setup'}</p>
              </div>
            </div>

            {selectedCardioFinisher && (
              <div className="bg-blue-950/40 border border-blue-800/40 p-3 rounded-2xl text-left text-xs">
                <div className="flex items-center gap-2 text-blue-300 font-bold mb-1">
                  <Activity size={14} /> Optional Finisher Added
                </div>
                <p className="text-slate-300">{selectedCardioFinisher} • {cardioDuration} mins</p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button 
                onClick={() => executeSave(true)}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-base py-4 rounded-2xl shadow-xl shadow-blue-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Analyzing...</span>
                  </div>
                ) : (
                  <>
                    <Sparkles size={18} fill="currentColor" />
                    Complete with AI Review
                  </>
                )}
              </button>

              <button 
                onClick={() => executeSave(false)}
                disabled={isSubmitting}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3.5 rounded-2xl border border-slate-700 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <Zap size={16} className="text-yellow-400" fill="currentColor" />
                Quick Save & Exit
              </button>
            </div>

            <button 
              onClick={() => setIsFinalizing(false)}
              className="text-slate-500 hover:text-slate-300 text-xs font-bold flex items-center justify-center gap-1 mx-auto pt-2"
            >
              <ChevronLeft size={16} /> Return to Exercises
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN SESSION WORKOUT VIEW ---
  return (
    <div className="space-y-5 relative pb-10">
      {/* Restore Banner */}
      {isRestored && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-bounce">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-full text-xs font-black shadow-2xl flex items-center gap-2 border border-white/20">
            <Sparkles size={14} fill="currentColor" />
            PROGRESS RESTORED
          </div>
        </div>
      )}

      {/* Top Header & Mode Indicator */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <button 
            onClick={onBack} 
            className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors active:scale-90"
            aria-label="Back"
          >
            <ChevronLeft size={28} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">{day.title}</h1>
            <p className="text-yellow-400 text-xs font-semibold">{day.focus}</p>
          </div>
        </div>

        {/* Gym Equipment Status Pill */}
        {mode === 'gym' ? (
          <button 
            onClick={() => setShowEquipmentModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 hover:border-blue-500 text-xs text-slate-300 transition-all shrink-0 active:scale-95"
          >
            <SlidersHorizontal size={13} className="text-blue-400" />
            <span className="font-bold">Equip</span>
            {Object.values(equipmentStatus).includes('occupied') && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            )}
          </button>
        ) : (
          <div className="px-2.5 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-[11px] font-bold text-blue-300 shrink-0">
            🏠 Home Mode
          </div>
        )}
      </div>

      {/* Exercise Cards */}
      <div className="space-y-5">
        {activeExercises.map((exercise, idx) => {
          if (exercise.isRest) {
            return (
              <div key={`rest-${idx}`} className="flex items-center justify-center gap-2.5 py-4 bg-slate-900/50 rounded-2xl border border-dashed border-slate-800 text-slate-400 text-xs font-medium">
                <Clock size={16} />
                <span>Rest: {exercise.notes}</span>
              </div>
            );
          }

          const log = logs.find(l => l.exerciseId === exercise.id);
          const alternates = getAlternates(exercise);
          const eqStatus = getEquipmentAvailability(exercise.equipment);
          const isOccupied = mode === 'gym' && (eqStatus === 'occupied' || eqStatus === 'unavailable');
          
          // If occupied, find the first available alternative that doesn't use the occupied machine
          const firstAvailableAlt = isOccupied && alternates 
            ? alternates.find(a => a.id !== exercise.id && getEquipmentAvailability(a.equipment) === 'available')
            : null;

          return (
            <div key={exercise.id} className="bg-slate-800/90 rounded-2xl overflow-hidden border border-slate-700 shadow-md">
              {/* Card Header */}
              <div className="p-3.5 bg-slate-800 border-b border-slate-700/60">
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs bg-slate-900 px-2 py-0.5 rounded-md text-blue-400 border border-slate-700">
                      {exercise.order}
                    </span>

                    {/* Prominent Swap Button */}
                    {alternates && alternates.length > 1 && (
                      <button 
                        onClick={() => {
                          setSwapIndex(idx);
                          setSwapFilter('all');
                        }}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 active:scale-95 transition-all text-xs font-bold"
                      >
                        <RefreshCw size={12} className="text-blue-400" />
                        <span>Swap ({alternates.length - 1} alts)</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {exercise.equipment && (
                      <span className="px-2 py-0.5 rounded-md bg-slate-900 text-[10px] font-bold text-slate-400 border border-slate-700">
                        {exercise.equipment}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-md bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {exercise.weightGuide}
                    </span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white text-lg leading-snug">{exercise.name}</h3>
                  
                  {/* Secondary Form Demo Search Link */}
                  <a 
                    href={`https://www.youtube.com/results?search_query=${encodeURIComponent(exercise.name + ' exercise form')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 text-slate-500 hover:text-blue-400 transition-colors shrink-0"
                    title="Search video demo form"
                  >
                    <Search size={15} />
                  </a>
                </div>

                {/* Sub details: tempo, reps, target muscle */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Clock size={12} /> {exercise.tempo || '2-0-1'}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Gauge size={12} /> {exercise.reps} Reps</span>
                  {exercise.targetMuscles && (
                    <>
                      <span>•</span>
                      <span className="text-slate-300 font-medium">{exercise.targetMuscles}</span>
                    </>
                  )}
                </div>

                {/* Gym Equipment Occupied Alert Banner with 1-Tap Swap */}
                {isOccupied && (
                  <div className="mt-2.5 p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-amber-300">
                      <AlertTriangle size={15} className="shrink-0" />
                      <span><strong>{exercise.equipment}</strong> occupied.</span>
                    </div>
                    {firstAvailableAlt && (
                      <button 
                        onClick={() => {
                          setSwapIndex(idx);
                          handleSwapExercise(firstAvailableAlt);
                        }}
                        className="px-2 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg shrink-0 text-[11px] active:scale-95 shadow-sm"
                      >
                        Swap to {firstAvailableAlt.name.slice(0, 14)}...
                      </button>
                    )}
                  </div>
                )}
              </div>
              
              {/* Sets Table - Mobile-Friendly Responsive Grid */}
              <div className="p-3 bg-slate-900/40 space-y-2">
                <div className="grid grid-cols-[20px_1fr_1fr_60px_44px] gap-2 px-1 text-[10px] text-slate-400 uppercase font-black tracking-wider text-center">
                  <div>#</div>
                  <div>Weight</div>
                  <div>Reps</div>
                  <div>RPE</div>
                  <div>Done</div>
                </div>

                {log?.setLogs.map((set, setIdx) => (
                  <div key={setIdx} className={`grid grid-cols-[20px_1fr_1fr_60px_44px] gap-2 items-center transition-all ${set.completed ? 'opacity-85' : 'opacity-100'}`}>
                    <div className="flex justify-center">
                      <span className={`text-xs font-bold font-mono ${set.completed ? 'text-blue-400' : 'text-slate-500'}`}>
                        {setIdx + 1}
                      </span>
                    </div>
                    
                    {/* Weight Input (Min 16px font to prevent mobile zoom) */}
                    <div>
                      <input 
                        type="number" 
                        pattern="[0-9]*" 
                        inputMode="decimal"
                        className={`w-full bg-slate-950 border rounded-xl py-2.5 text-center text-base font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm ${set.completed ? 'border-blue-900/50 text-blue-100' : 'border-slate-700'}`}
                        value={set.weight} 
                        placeholder="lbs"
                        onChange={(e) => updateLog(exercise.id, setIdx, 'weight', e.target.value)}
                      />
                    </div>

                    {/* Reps Input */}
                    <div>
                      <input 
                        type="number" 
                        pattern="[0-9]*" 
                        inputMode="numeric"
                        className={`w-full bg-slate-950 border rounded-xl py-2.5 text-center text-base font-bold text-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all shadow-sm ${set.completed ? 'border-blue-900/50 text-blue-100' : 'border-slate-700'}`}
                        value={set.reps} 
                        placeholder="reps"
                        onChange={(e) => updateLog(exercise.id, setIdx, 'reps', e.target.value)}
                      />
                    </div>

                    {/* RPE Effort Button */}
                    <button 
                      onClick={() => setEffortPicker({ exerciseId: exercise.id, setIndex: setIdx })}
                      className={`h-11 w-full flex flex-col items-center justify-center rounded-xl border transition-all active:scale-95 ${EFFORT_LEVELS[set.effort - 1].bg} ${EFFORT_LEVELS[set.effort - 1].border}`}
                    >
                      <span className={`text-[11px] font-black ${EFFORT_LEVELS[set.effort - 1].text}`}>
                        {EFFORT_LEVELS[set.effort - 1].label}
                      </span>
                    </button>

                    {/* Done Check Button (44px min tap area) */}
                    <div className="flex justify-center">
                      <button 
                        onClick={() => toggleComplete(exercise.id, setIdx)}
                        className={`h-11 w-11 flex items-center justify-center rounded-xl transition-all active:scale-90 shadow-sm ${set.completed ? 'bg-blue-600 text-white shadow-blue-500/40 ring-2 ring-blue-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700 hover:bg-slate-700'}`}
                        aria-label="Mark set complete"
                      >
                        {set.completed ? <Check size={22} strokeWidth={3} /> : <div className="w-5 h-5 rounded-md border-2 border-slate-600" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Set Actions & Notes */}
              <div className="p-2.5 flex items-center gap-2 border-t border-slate-700/40 bg-slate-800">
                <button 
                  onClick={() => addSet(exercise.id)} 
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-700/30 text-blue-400 font-bold text-xs border border-slate-700 hover:bg-slate-700/50 transition-colors active:scale-95"
                >
                  <Plus size={14} /> Add Set
                </button>
                <button 
                  onClick={() => removeSet(exercise.id)} 
                  className="px-3 py-2.5 flex items-center justify-center rounded-xl bg-slate-700/30 text-slate-500 border border-slate-700 hover:text-red-400 active:scale-95 transition-colors"
                  title="Remove last set"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              
              {exercise.notes && (
                <div className="bg-slate-950/40 px-3.5 py-2 text-xs text-slate-400 flex items-start gap-2 border-t border-slate-700/30">
                  <Info size={14} className="shrink-0 mt-0.5 text-blue-400" />
                  <span>{exercise.notes}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Optional Cardio Finisher / Conditioning Section */}
      <div className="bg-slate-800/80 rounded-2xl border border-slate-700 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Activity size={16} className="text-yellow-400" />
            <span>Condo Cardio Finisher (Optional)</span>
          </div>
          <span className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-slate-400">Post-Strength Flush</span>
        </div>
        
        <p className="text-xs text-slate-400">
          Optional low-impact aerobic flush to promote blood flow and recovery. Does not substitute strength work.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {CONDO_CARDIO_FINISHERS.map(finisher => {
            const isSelected = selectedCardioFinisher === finisher.name;
            return (
              <button
                key={finisher.id}
                onClick={() => setSelectedCardioFinisher(isSelected ? null : finisher.name)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  isSelected 
                    ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm' 
                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold mb-1">
                  <span>{finisher.equipment}</span>
                  {isSelected && <Check size={14} className="text-blue-400" />}
                </div>
                <div className="text-[11px] text-slate-400 leading-tight">{finisher.protocol}</div>
              </button>
            );
          })}
        </div>

        {selectedCardioFinisher && (
          <div className="flex items-center gap-3 pt-1">
            <span className="text-xs text-slate-400 font-bold">Duration:</span>
            <input 
              type="number"
              value={cardioDuration}
              onChange={(e) => setCardioDuration(e.target.value)}
              className="w-16 bg-slate-950 border border-slate-700 rounded-lg py-1 text-center text-sm font-bold text-white focus:outline-none focus:border-blue-500"
            />
            <span className="text-xs text-slate-400">minutes</span>
          </div>
        )}
      </div>

      {/* Complete Workout Button Sticky Footer */}
      <div className="sticky bottom-3 z-30 pt-2 px-1">
        <button 
          onClick={() => setIsFinalizing(true)}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-base py-4 rounded-2xl shadow-xl shadow-blue-900/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span>Complete Workout</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* --- RPE EFFORT PICKER MODAL --- */}
      {effortPicker && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setEffortPicker(null)}>
          <div className="bg-slate-900 w-full max-w-md rounded-t-3xl border-t border-white/10 shadow-2xl p-5 pb-safe space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-white font-bold text-lg">Effort Level (RPE)</h3>
                <p className="text-slate-400 text-xs">Set {effortPicker.setIndex + 1} intensity</p>
              </div>
              <button onClick={() => setEffortPicker(null)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {EFFORT_LEVELS.map((level) => {
                const currentLog = logs.find(l => l.exerciseId === effortPicker.exerciseId);
                const currentSet = currentLog?.setLogs[effortPicker.setIndex];
                const isSelected = currentSet?.effort === level.level;
                return (
                  <button
                    key={level.level}
                    onClick={() => { 
                      updateLog(effortPicker.exerciseId, effortPicker.setIndex, 'effort', level.level); 
                      setEffortPicker(null); 
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex flex-col gap-1 relative ${isSelected ? `${level.bg} ${level.border} ring-2 ring-white/10` : 'bg-slate-800 border-slate-700 active:scale-95'}`}
                  >
                    <div className={`text-[10px] font-black uppercase tracking-wider ${level.text}`}>Level {level.level}</div>
                    <div className="font-bold text-base text-white">{level.label}</div>
                    <div className="text-[11px] text-slate-400">{level.desc}</div>
                    {isSelected && <div className="absolute top-2.5 right-2.5 bg-white rounded-full p-0.5 shadow-sm"><Check size={12} className="text-slate-900" strokeWidth={3} /></div>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* --- SWAP EXERCISE & IN-APP ALTERNATIVES MODAL --- */}
      {swapIndex !== null && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setSwapIndex(null)}>
          <div className="bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400">
                  <RefreshCw size={18} />
                </div>
                <div>
                  <h3 className="text-white font-bold text-base leading-tight">Select Alternative</h3>
                  <p className="text-slate-400 text-xs">For Slot {activeExercises[swapIndex].order} ({activeExercises[swapIndex].name})</p>
                </div>
              </div>
              <button onClick={() => setSwapIndex(null)} className="p-1.5 bg-slate-800 rounded-full text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950 border-b border-slate-800 overflow-x-auto text-xs font-semibold">
              <button 
                onClick={() => setSwapFilter('all')} 
                className={`px-3 py-1 rounded-lg transition-all ${swapFilter === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                All
              </button>
              {mode === 'gym' && (
                <button 
                  onClick={() => setSwapFilter('available')} 
                  className={`px-3 py-1 rounded-lg transition-all ${swapFilter === 'available' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                >
                  Available Equipment
                </button>
              )}
              <button 
                onClick={() => setSwapFilter('home')} 
                className={`px-3 py-1 rounded-lg transition-all ${swapFilter === 'home' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Home / DB / Body
              </button>
              <button 
                onClick={() => setSwapFilter('gym')} 
                className={`px-3 py-1 rounded-lg transition-all ${swapFilter === 'gym' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Gym / Machine
              </button>
            </div>

            {/* Alternatives List */}
            <div className="overflow-y-auto p-4 space-y-3 bg-slate-950/60 flex-1 pb-safe">
              {getAlternates(activeExercises[swapIndex])
                ?.filter(alt => {
                  if (swapFilter === 'available') {
                    return getEquipmentAvailability(alt.equipment) === 'available';
                  }
                  if (swapFilter === 'home') {
                    return alt.mode === 'home' || alt.mode === 'all' || alt.equipment?.toLowerCase().includes('dumbbell') || alt.equipment?.toLowerCase().includes('mat');
                  }
                  if (swapFilter === 'gym') {
                    return alt.mode === 'gym' || alt.mode === 'all' || alt.equipment?.toLowerCase().includes('machine') || alt.equipment?.toLowerCase().includes('cable');
                  }
                  return true;
                })
                .map((alt) => {
                  const isCurrent = alt.id === activeExercises[swapIndex!].id;
                  const isMainDefinition = alt.id === day.exercises.find(e => e.order === alt.order)?.id;
                  const eqStatus = getEquipmentAvailability(alt.equipment);

                  return (
                    <div 
                      key={alt.id}
                      onClick={() => handleSwapExercise(alt)}
                      className={`w-full text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                        isCurrent 
                          ? 'bg-blue-600/15 border-blue-500 shadow-md shadow-blue-900/20' 
                          : 'bg-slate-800/90 border-slate-700/80 hover:border-slate-600 active:scale-[0.98]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {isMainDefinition && (
                            <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
                              Original Main
                            </span>
                          )}
                          {alt.equipment && (
                            <span className="text-[10px] font-bold text-blue-300 bg-blue-900/40 px-2 py-0.5 rounded border border-blue-800/50">
                              {alt.equipment}
                            </span>
                          )}
                          {mode === 'gym' && alt.equipment && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              eqStatus === 'available' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                            }`}>
                              {eqStatus === 'available' ? 'Available' : 'Occupied'}
                            </span>
                          )}
                        </div>

                        {isCurrent && (
                          <div className="bg-blue-500 rounded-full p-1 shadow-sm">
                            <Check size={12} className="text-white" strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-base text-white">{alt.name}</div>
                        <a 
                          href={`https://www.youtube.com/results?search_query=${encodeURIComponent(alt.name + ' exercise form')}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-blue-400 p-1"
                          title="Search video demo"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>

                      <div className="text-xs text-slate-400 leading-relaxed mt-1">{alt.notes}</div>

                      {alt.movementPattern && (
                        <div className="mt-2 text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                          Pattern: {alt.movementPattern} {alt.targetMuscles ? `• ${alt.targetMuscles}` : ''}
                        </div>
                      )}
                    </div>
                  );
                })}

              {/* Add Custom Alternative Button & Inline Form */}
              {!showAddCustomAlt ? (
                <button
                  onClick={() => setShowAddCustomAlt(true)}
                  className="w-full py-3.5 px-4 rounded-xl border border-dashed border-slate-700 hover:border-blue-500 text-blue-400 hover:text-blue-300 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Plus size={16} /> Add Custom Alternative
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-800 border border-blue-500/40 space-y-3 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">New Custom Alternative</span>
                    <button onClick={() => setShowAddCustomAlt(false)} className="text-slate-400 hover:text-white">
                      <X size={16} />
                    </button>
                  </div>

                  <input 
                    type="text"
                    value={customAltName}
                    onChange={(e) => setCustomAltName(e.target.value)}
                    placeholder="Exercise Name (e.g. Swiss Ball DB Press)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-xs font-medium focus:border-blue-500 outline-none"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Equipment</label>
                      <select 
                        value={customAltEquipment}
                        onChange={(e) => setCustomAltEquipment(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none"
                      >
                        <option value="Dumbbells">Dumbbells</option>
                        <option value="Bodyweight">Bodyweight</option>
                        <option value="Cable">Cable Pulley</option>
                        <option value="Machine">Gym Machine</option>
                        <option value="Bands">Resistance Bands</option>
                        <option value="Barbell">Barbell</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 font-bold block mb-1">Notes / Cues</label>
                      <input 
                        type="text"
                        value={customAltNotes}
                        onChange={(e) => setCustomAltNotes(e.target.value)}
                        placeholder="e.g. Keep chest high"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs outline-none"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleCreateCustomAlternative}
                    disabled={!customAltName.trim()}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                  >
                    Save & Select This Alternative
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- CONDO EQUIPMENT STATUS MODAL (GYM MODE) --- */}
      {showEquipmentModal && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in" onClick={() => setShowEquipmentModal(false)}>
          <div className="bg-slate-900 w-full max-w-md rounded-t-3xl sm:rounded-3xl border border-white/10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-white/5 flex justify-between items-center bg-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-blue-400" />
                <h3 className="text-white font-bold text-base">Condo Gym Equipment Status</h3>
              </div>
              <button onClick={() => setShowEquipmentModal(false)} className="p-1.5 bg-slate-700 rounded-full text-slate-300 hover:text-white">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-2.5 flex-1 pb-safe">
              <p className="text-xs text-slate-400 mb-2">
                Tap any machine currently occupied or out of service to receive instant alternative recommendations during your workout:
              </p>

              {CONDO_EQUIPMENT_LIST.map((item) => {
                const status = equipmentStatus[item.id] || 'available';
                return (
                  <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                    <span className="text-sm font-semibold text-white">{item.name}</span>
                    <button
                      onClick={() => handleToggleEquipment(item.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        status === 'available' 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : status === 'occupied' 
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {status === 'available' ? 'Available' : status === 'occupied' ? 'Occupied' : 'Broken'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slide-up { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-fade-in { animation: fadeIn 0.2s ease-out; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
};
