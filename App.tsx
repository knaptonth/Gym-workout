import React, { useState, useMemo, useEffect } from 'react';
import { Layout } from './components/Layout';
import { WorkoutSession } from './components/WorkoutSession';
import { History } from './components/History';
import { WORKOUTS, SCHEDULE, ROTATING_SESSION_KEYS, SESSION_METADATA, CONDO_EQUIPMENT_LIST } from './constants';
import { 
  getPreferredVersion, setPreferredVersion, exportAllData, importAllData, 
  getCustomWorkouts, saveCustomWorkouts, getWorkoutMode, setWorkoutMode, 
  getCadenceStats, getEquipmentStatus, setEquipmentStatus, updateSingleEquipmentStatus
} from './services/storageService';
import { generateWorkout } from './services/geminiService';
import { workoutsToCSV, csvToWorkouts } from './utils/csvUtils';
import { Version, WorkoutDay, WorkoutMode, EquipmentStatus } from './types';
import { 
  Dumbbell, Play, Calendar, ChevronLeft, ChevronRight, List, Check, 
  ArrowLeft, ArrowRight, WifiOff, FileSpreadsheet, Copy, Download, 
  RefreshCcw, Sparkles, Loader2, Clock, Activity, Hash, Share2, 
  SlidersHorizontal, Home, Building2, Flame, RotateCcw, CheckCircle2,
  AlertTriangle, X
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('workout');
  const [version] = useState<Version>('Apex');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [manualWorkout, setManualWorkout] = useState<WorkoutDay | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Mode and Equipment States
  const [workoutMode, setWorkoutModeState] = useState<WorkoutMode>(getWorkoutMode());
  const [equipmentStatus, setEquipmentStatusState] = useState<Record<string, EquipmentStatus>>(getEquipmentStatus());
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  
  // Custom Workouts State
  const [customWorkouts, setCustomWorkouts] = useState<Record<string, WorkoutDay> | null>(getCustomWorkouts());
  const activeWorkouts = useMemo(() => {
    return customWorkouts || WORKOUTS[version];
  }, [customWorkouts, version]);

  // Cadence & Rotating Sequence Stats
  const [cadenceStats, setCadenceStats] = useState(getCadenceStats(selectedDate));

  // Sync State
  const [syncCode, setSyncCode] = useState('');
  const [syncStatus, setSyncStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

  // AI Builder State
  const [aiParams, setAiParams] = useState({
    exerciseCount: '5',
    duration: '45 mins',
    equipment: 'Full Gym'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // CSV Settings State
  const [customWorkoutsText, setCustomWorkoutsText] = useState(workoutsToCSV(activeWorkouts));
  const [customWorkoutsMessage, setCustomWorkoutsMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Refresh cadence when date or sessions change
  useEffect(() => {
    setCadenceStats(getCadenceStats(selectedDate));
  }, [selectedDate, isSessionActive]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleToggleMode = (mode: WorkoutMode) => {
    setWorkoutMode(mode);
    setWorkoutModeState(mode);
  };

  const handleToggleEquipment = (eqId: string) => {
    const current = equipmentStatus[eqId] || 'available';
    const next: EquipmentStatus = current === 'available' ? 'occupied' : current === 'occupied' ? 'unavailable' : 'available';
    updateSingleEquipmentStatus(eqId, next);
    setEquipmentStatusState(prev => ({ ...prev, [eqId]: next }));
  };

  const handleSaveCustomWorkouts = () => {
    try {
      const parsed = csvToWorkouts(customWorkoutsText);
      if (Object.keys(parsed).length === 0) {
        throw new Error("No valid workouts found in CSV.");
      }
      saveCustomWorkouts(parsed);
      setCustomWorkouts(parsed);
      setCustomWorkoutsMessage({ type: 'success', text: 'Custom workouts saved! Both Home and Gym modes updated.' });
      setTimeout(() => setCustomWorkoutsMessage(null), 3500);
    } catch (e: any) {
      setCustomWorkoutsMessage({ type: 'error', text: e.message || 'Invalid CSV format.' });
      setTimeout(() => setCustomWorkoutsMessage(null), 4000);
    }
  };

  const handleResetWorkouts = () => {
    if (window.confirm('Reset all custom workouts and alternatives to the base Apex Protocol version?')) {
      saveCustomWorkouts(null);
      setCustomWorkouts(null);
      setCustomWorkoutsText(workoutsToCSV(WORKOUTS[version]));
      setCustomWorkoutsMessage({ type: 'success', text: 'Reset to base Apex workouts with all curated alternatives.' });
      setTimeout(() => setCustomWorkoutsMessage(null), 3500);
    }
  };

  const handleCopyCSV = () => {
    navigator.clipboard.writeText(customWorkoutsText);
    setCustomWorkoutsMessage({ type: 'success', text: 'CSV copied to clipboard!' });
    setTimeout(() => setCustomWorkoutsMessage(null), 3000);
  };

  // Determine current workout to perform
  const todayWorkout = useMemo(() => {
    if (manualWorkout) return manualWorkout;

    // Follow the rotating session sequence (Session A -> B -> C)
    const nextKey = cadenceStats.nextRecommendedSessionId || 'monday';
    if (activeWorkouts[nextKey]) {
      return activeWorkouts[nextKey];
    }

    // Fallback: Day index from schedule
    const dayIndex = selectedDate.getDay(); 
    const dayKey = SCHEDULE[dayIndex] || 'monday';
    return activeWorkouts[dayKey] || activeWorkouts['monday'];
  }, [manualWorkout, cadenceStats.nextRecommendedSessionId, activeWorkouts, selectedDate]);

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + days);
    setSelectedDate(newDate);
    setManualWorkout(null); 
  };

  const handleDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.value) return;
    const [year, month, day] = e.target.value.split('-').map(Number);
    setSelectedDate(new Date(year, month - 1, day));
    setManualWorkout(null);
  };

  const handleExport = () => {
    const code = exportAllData();
    navigator.clipboard.writeText(code);
    setSyncStatus({ type: 'success', msg: 'Sync Code copied to clipboard!' });
    setTimeout(() => setSyncStatus(null), 3000);
  };

  const handleImport = () => {
    if (!syncCode.trim()) return;
    const result = importAllData(syncCode.trim());
    if (result.success) {
      setSyncStatus({ type: 'success', msg: result.message });
      setSyncCode('');
      setCustomWorkouts(getCustomWorkouts());
      setWorkoutModeState(getWorkoutMode());
      setEquipmentStatusState(getEquipmentStatus());
      setCadenceStats(getCadenceStats(selectedDate));
    } else {
      setSyncStatus({ type: 'error', msg: result.message });
    }
    setTimeout(() => setSyncStatus(null), 4000);
  };

  const selectSessionKey = (key: string) => {
    if (activeWorkouts[key]) {
      setManualWorkout(activeWorkouts[key]);
      setShowLibrary(false);
    }
  };

  const handleGenerateWorkout = async () => {
    setIsGenerating(true);
    try {
      const generated = await generateWorkout(aiParams.exerciseCount, aiParams.duration, aiParams.equipment);
      if (generated) {
        setManualWorkout(generated);
        setShowAIBuilder(false);
      }
    } catch (error) {
      alert("Failed to generate workout. Ensure you are online and try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const occupiedCount = Object.values(equipmentStatus).filter(s => s === 'occupied' || s === 'unavailable').length;

  const renderContent = () => {
    if (activeTab === 'history') {
      return <History />;
    }

    if (activeTab === 'settings') {
      return (
        <div className="space-y-6 animate-fade-in pb-16">
          <div className="flex items-center gap-2 mb-1">
            <button 
              onClick={() => setActiveTab('workout')}
              className="p-2 -ml-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-2xl font-black text-white">Settings & Customization</h2>
          </div>

          {/* WORKOUT MODE SELECTION */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Training Environment</h3>
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-3 shadow-sm">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleToggleMode('gym')}
                  className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    workoutMode === 'gym' 
                      ? 'bg-blue-600/20 border-blue-500 text-white font-bold' 
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Building2 size={20} className={workoutMode === 'gym' ? 'text-blue-400' : 'text-slate-400'} />
                  <span className="text-sm">Condo Gym Mode</span>
                  <span className="text-[10px] text-slate-400 text-center">Machines + Cables + Cardio</span>
                </button>

                <button
                  onClick={() => handleToggleMode('home')}
                  className={`p-3.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    workoutMode === 'home' 
                      ? 'bg-blue-600/20 border-blue-500 text-white font-bold' 
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Home size={20} className={workoutMode === 'home' ? 'text-blue-400' : 'text-slate-400'} />
                  <span className="text-sm">Home Mode</span>
                  <span className="text-[10px] text-slate-400 text-center">Dumbbells + Bodyweight + Bands</span>
                </button>
              </div>

              {workoutMode === 'gym' && (
                <button
                  onClick={() => setShowEquipmentModal(true)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-blue-300 font-semibold flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-blue-400" />
                    Condo Equipment Availability
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {occupiedCount === 0 ? 'All Available' : `${occupiedCount} Occupied`} →
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* CUSTOM WORKOUTS CSV SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between ml-1">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Custom Workouts (CSV)</h3>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Main & Alternatives Sync
              </span>
            </div>
            
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-3 shadow-sm">
              <p className="text-xs text-slate-400 leading-relaxed">
                Edit both main exercises and their alternative lists. Export to Google Sheets/Excel, adjust sets, reps, or alternatives, and paste back here. Both Home and Gym modes will reflect your updates.
              </p>

              <textarea 
                value={customWorkoutsText}
                onChange={(e) => setCustomWorkoutsText(e.target.value)}
                className="w-full h-52 bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-[11px] font-mono focus:border-blue-500 outline-none transition-all placeholder:text-slate-600 resize-y whitespace-pre"
                placeholder="CSV contents..."
              />

              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={handleCopyCSV}
                  className="py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
                >
                  <Copy size={14} /> Copy CSV
                </button>
                <button 
                  onClick={handleSaveCustomWorkouts}
                  className="py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-md"
                >
                  Save Workouts
                </button>
                <button 
                  onClick={handleResetWorkouts}
                  className="py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs rounded-xl transition-all"
                >
                  Reset Base
                </button>
              </div>

              {customWorkoutsMessage && (
                <div className={`p-3 rounded-xl text-xs font-bold text-center animate-fade-in ${
                  customWorkoutsMessage.type === 'success' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {customWorkoutsMessage.text}
                </div>
              )}
            </div>
          </div>

          {/* CROSS DEVICE SYNC */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Cross-Device Sync</h3>
            <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 space-y-3 shadow-sm">
              <p className="text-xs text-slate-400 leading-relaxed">
                Backup or transfer your logs, custom workouts, equipment settings, and preferences across devices without losing history.
              </p>

              <button 
                onClick={handleExport}
                className="w-full flex items-center justify-between px-4 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl transition-all text-xs font-bold"
              >
                <div className="flex items-center gap-2">
                  <Copy size={16} />
                  <span>Copy Complete Backup Code</span>
                </div>
                <ArrowRight size={14} />
              </button>

              <div className="space-y-2 pt-1">
                <textarea 
                  value={syncCode}
                  onChange={(e) => setSyncCode(e.target.value)}
                  placeholder="Paste sync code here to restore..."
                  className="w-full h-16 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-xs font-mono focus:border-blue-500 outline-none resize-none"
                />
                <button 
                  onClick={handleImport}
                  disabled={!syncCode.trim()}
                  className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl border border-slate-600 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={15} /> Restore Data
                </button>
              </div>

              {syncStatus && (
                <div className={`p-2.5 rounded-xl text-xs font-bold text-center animate-fade-in ${
                  syncStatus.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {syncStatus.msg}
                </div>
              )}
            </div>
          </div>

          <button 
            onClick={() => setActiveTab('workout')} 
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm py-4 rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      );
    }

    if (isSessionActive && todayWorkout) {
      return (
        <WorkoutSession 
          day={todayWorkout} 
          version={version} 
          date={selectedDate} 
          onFinish={() => {
            setIsSessionActive(false);
            setManualWorkout(null);
            setCadenceStats(getCadenceStats(selectedDate));
          }}
          onBack={() => {
            setIsSessionActive(false);
          }}
        />
      );
    }

    // --- MAIN WORKOUT TAB ---
    const dateInputValue = selectedDate.toLocaleDateString('en-CA');
    const isAIWorkout = todayWorkout && todayWorkout.id.startsWith('ai_');

    if (showAIBuilder) {
      return (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setShowAIBuilder(false)} className="p-2 -ml-2 text-slate-400 hover:text-white">
              <ChevronLeft size={28} />
            </button>
            <h2 className="text-2xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-blue-400">
              AI Workout Generator
            </h2>
          </div>
          <div className="bg-slate-800/90 p-5 rounded-2xl border border-slate-700 space-y-4 shadow-xl">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Hash size={14} /> Number of Exercises
              </label>
              <input 
                type="text" 
                value={aiParams.exerciseCount} 
                onChange={(e) => setAiParams({...aiParams, exerciseCount: e.target.value})} 
                placeholder="e.g. 5" 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm font-semibold focus:border-blue-500 outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Clock size={14} /> Available Time
              </label>
              <input 
                type="text" 
                value={aiParams.duration} 
                onChange={(e) => setAiParams({...aiParams, duration: e.target.value})} 
                placeholder="e.g. 45 mins" 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm font-semibold focus:border-blue-500 outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                <Dumbbell size={14} /> Equipment
              </label>
              <input 
                type="text" 
                value={aiParams.equipment} 
                onChange={(e) => setAiParams({...aiParams, equipment: e.target.value})} 
                placeholder="e.g. Condo Gym (Dumbbells + Lat Pulldown)" 
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm font-semibold focus:border-blue-500 outline-none" 
              />
            </div>
          </div>
          <button 
            onClick={handleGenerateWorkout} 
            disabled={isGenerating} 
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold text-base py-4 rounded-2xl shadow-xl shadow-purple-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
          >
            {isGenerating ? <><Loader2 className="animate-spin" /> Generating...</> : <><Sparkles fill="currentColor" /> Generate Session</>}
          </button>
        </div>
      );
    }

    if (showLibrary) {
      return (
        <div className="space-y-5 animate-fade-in">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setShowLibrary(false)} className="p-2 -ml-2 text-slate-400 hover:text-white">
              <ChevronLeft size={28} />
            </button>
            <h2 className="text-2xl font-bold text-white">Workout Library</h2>
          </div>
          <div className="space-y-3">
            {Object.keys(activeWorkouts).map(key => {
              const w = activeWorkouts[key];
              const meta = SESSION_METADATA[key];
              return (
                <button 
                  key={w.id} 
                  onClick={() => {
                    setManualWorkout(w);
                    setShowLibrary(false);
                  }} 
                  className="w-full text-left p-4 bg-slate-800 rounded-2xl border border-slate-700 hover:border-blue-500 active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                      {meta ? `${meta.title} (${meta.code})` : key}
                    </span>
                    <span className="text-xs text-slate-400">{w.exercises.filter(e => !e.isRest).length} exercises</span>
                  </div>
                  <div className="font-bold text-lg text-white mb-0.5">{w.title}</div>
                  <div className="text-xs text-slate-400">{w.focus}</div>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-5 animate-fade-in">
        {/* Date Selector & Navigator */}
        <div className="flex items-center justify-between bg-slate-800/90 p-2 rounded-2xl border border-slate-700 w-full shadow-md">
          <button 
            onClick={() => changeDate(-1)} 
            className="h-10 w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="relative group flex-1 h-10 flex items-center justify-center">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl active:bg-slate-700/50">
              <Calendar size={17} className="text-yellow-400" />
              <span className="font-bold text-sm text-white">
                {selectedDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <input 
              type="date" 
              value={dateInputValue} 
              onChange={handleDateInput} 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
            />
          </div>

          <button 
            onClick={() => changeDate(1)} 
            className="h-10 w-11 flex items-center justify-center rounded-xl text-slate-400 hover:text-white transition-colors"
            aria-label="Next day"
          >
            <ChevronRight size={24} />
          </button>
        </div>

        {/* 1. FLEXIBLE CADENCE WIDGET (3 planned sessions / week, rotating A -> B -> C) */}
        <div className="bg-slate-800/95 rounded-2xl border border-slate-700/80 p-4 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame size={18} className="text-amber-400" />
              <span className="font-extrabold text-sm text-white">Weekly Cadence</span>
            </div>
            <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {cadenceStats.completedThisWeek} / 3 Completed
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (cadenceStats.completedThisWeek / 3) * 100)}%` }}
            />
          </div>

          {/* Rotating Sequence Selector: Session A -> B -> C */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>Rotating 3-Day Protocol:</span>
              <span className="text-blue-300 font-semibold">Move missed days forward anytime</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {ROTATING_SESSION_KEYS.map((key) => {
                const meta = SESSION_METADATA[key];
                const isNextUp = cadenceStats.nextRecommendedSessionId === key;
                const isSelected = todayWorkout?.id === key;
                const isCompletedThisWeek = cadenceStats.completedSessionIds.includes(key);

                return (
                  <button
                    key={key}
                    onClick={() => selectSessionKey(key)}
                    className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 relative ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-400 text-white shadow-md' 
                        : isNextUp 
                        ? 'bg-blue-950/60 border-blue-500/50 text-blue-200' 
                        : 'bg-slate-900 border-slate-700/80 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black">{meta.title}</span>
                      {isCompletedThisWeek && <Check size={12} className="text-emerald-400 stroke-[3]" />}
                    </div>
                    <span className="text-[10px] text-slate-400 truncate w-full">{meta.subtitle}</span>

                    {isNextUp && !isCompletedThisWeek && (
                      <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shadow">
                        Next Up
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* 2. MODE & EQUIPMENT AVAILABILITY CONTROLS */}
        <div className="flex items-center justify-between bg-slate-800/80 px-3.5 py-2.5 rounded-2xl border border-slate-700 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold">Mode:</span>
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-700/70">
              <button
                onClick={() => handleToggleMode('gym')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  workoutMode === 'gym' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Building2 size={13} />
                <span>Gym</span>
              </button>
              <button
                onClick={() => handleToggleMode('home')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition-all ${
                  workoutMode === 'home' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Home size={13} />
                <span>Home</span>
              </button>
            </div>
          </div>

          {workoutMode === 'gym' ? (
            <button
              onClick={() => setShowEquipmentModal(true)}
              className="flex items-center gap-1.5 text-blue-400 font-bold hover:text-blue-300"
            >
              <SlidersHorizontal size={13} />
              <span>{occupiedCount === 0 ? 'Equip: Available' : `${occupiedCount} Busy`}</span>
            </button>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">DBs + Bands</span>
          )}
        </div>

        {/* 3. CURRENT WORKOUT HERO CARD */}
        {todayWorkout ? (
          <div className={`p-6 rounded-3xl shadow-xl relative overflow-hidden group ${
            isAIWorkout 
              ? 'bg-gradient-to-br from-violet-600 via-purple-700 to-indigo-900 shadow-purple-900/30' 
              : 'bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 shadow-blue-900/40'
          }`}>
            <div className="relative z-10 flex flex-col items-center text-center gap-4">
              <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-sm border border-white/20 shadow-md">
                {isAIWorkout ? <Sparkles className="w-8 h-8 text-white" /> : <Dumbbell className="w-8 h-8 text-white" />}
              </div>

              <div>
                <div className="text-xs font-black uppercase tracking-widest text-blue-200 mb-1">
                  {manualWorkout ? 'Manual Selection' : 'Scheduled Target'}
                </div>
                <h2 className="text-2xl font-black text-white leading-tight mb-1">{todayWorkout.title}</h2>
                <p className="text-blue-100 text-xs font-medium max-w-xs">{todayWorkout.focus}</p>
              </div>

              <div className="flex flex-col w-full gap-2.5 pt-2">
                <button 
                  onClick={() => setIsSessionActive(true)} 
                  className={`w-full bg-white font-black text-base py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-[0.98] ${
                    isAIWorkout ? 'text-purple-900' : 'text-blue-900'
                  }`}
                >
                  <Play fill="currentColor" size={20} /> Start Workout
                </button>

                <button 
                  onClick={() => setShowLibrary(true)} 
                  className="w-full font-bold text-xs py-3 rounded-xl flex items-center justify-center gap-1.5 border border-white/20 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 transition-all"
                >
                  <List size={16} /> Choose Different Session
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 text-center shadow-md">
            <h3 className="text-lg font-bold text-white mb-2">Rest & Active Recovery</h3>
            <p className="text-slate-400 text-xs mb-4">Take a light walk, do mobility work, or pick a session below.</p>
            <button 
              onClick={() => setShowLibrary(true)} 
              className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
            >
              <List size={16} /> Browse Sessions
            </button>
          </div>
        )}

        {/* AI COACH CALLOUT */}
        <button 
          onClick={() => setShowAIBuilder(true)} 
          className="w-full bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 p-4 rounded-2xl flex items-center justify-between hover:border-purple-500/50 transition-all text-left"
        >
          <div className="flex items-center gap-3">
            <div className="bg-purple-500 p-2.5 rounded-xl text-white shadow-md">
              <Sparkles size={20} fill="currentColor" />
            </div>
            <div>
              <div className="text-white font-bold text-sm">AI Workout Generator</div>
              <div className="text-purple-300 text-xs">Build a personalized condo session</div>
            </div>
          </div>
          <ChevronRight size={18} className="text-purple-400" />
        </button>

        {/* CONDO EQUIPMENT STATUS MODAL */}
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
                  Tap any machine currently occupied or unavailable to have the app automatically prioritize dumbbell and cable alternatives:
                </p>

                {CONDO_EQUIPMENT_LIST.map((item) => {
                  const status = equipmentStatus[item.id] || 'available';
                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/80 border border-slate-700">
                      <div>
                        <div className="text-sm font-semibold text-white">{item.name}</div>
                        <div className="text-[10px] text-slate-400 uppercase tracking-wider">{item.category}</div>
                      </div>
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
      </div>
    );
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {isOffline && (
        <div className="bg-amber-600/90 backdrop-blur-sm text-white text-center py-1.5 px-4 text-xs font-bold flex items-center justify-center gap-2 sticky top-0 z-[60]">
          <WifiOff size={14} /> Offline Mode Active - Data Saved Locally
        </div>
      )}
      {renderContent()}
    </Layout>
  );
};

export default App;
