import { WorkoutDay, Exercise } from '../types';

export const workoutsToCSV = (workouts: Record<string, WorkoutDay>): string => {
  const header = [
    'Day ID',
    'Day Title',
    'Day Focus',
    'Exercise ID',
    'Order',
    'Exercise Name',
    'Sets',
    'Reps',
    'Tempo',
    'Notes',
    'Weight Guide',
    'Video URL',
    'Is Rest',
    'Is Alternative',
    'Equipment',
    'Target Muscles',
    'Movement Pattern',
    'Mode'
  ].join(',');

  const rows: string[] = [];

  for (const [dayId, day] of Object.entries(workouts)) {
    for (const ex of day.exercises) {
      const mainRow = [
        dayId,
        day.title,
        day.focus,
        ex.id,
        ex.order,
        ex.name,
        ex.sets.toString(),
        ex.reps,
        ex.tempo,
        ex.notes,
        ex.weightGuide,
        ex.videoUrl || '',
        ex.isRest ? 'true' : 'false',
        'false',
        ex.equipment || '',
        ex.targetMuscles || '',
        ex.movementPattern || '',
        ex.mode || 'all'
      ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
      rows.push(mainRow);

      if (ex.alternatives && ex.alternatives.length > 0) {
        for (const alt of ex.alternatives) {
          const altRow = [
            dayId,
            day.title,
            day.focus,
            alt.id,
            alt.order,
            alt.name,
            alt.sets.toString(),
            alt.reps,
            alt.tempo,
            alt.notes,
            alt.weightGuide,
            alt.videoUrl || '',
            alt.isRest ? 'true' : 'false',
            'true',
            alt.equipment || '',
            alt.targetMuscles || '',
            alt.movementPattern || '',
            alt.mode || 'all'
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
          rows.push(altRow);
        }
      }
    }
  }

  return [header, ...rows].join('\n');
};

export const csvToWorkouts = (csv: string): Record<string, WorkoutDay> => {
  const lines = csv.split('\n').filter(line => line.trim() !== '');
  if (lines.length < 2) return {};

  const workouts: Record<string, WorkoutDay> = {};

  const parseLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  for (let i = 1; i < lines.length; i++) {
    const row = parseLine(lines[i]);
    if (row.length < 13) continue;

    const [
      dayId,
      title,
      focus,
      exId,
      order,
      name,
      sets,
      reps,
      tempo,
      notes,
      weightGuide,
      videoUrl,
      isRest,
      isAlternative,
      equipment,
      targetMuscles,
      movementPattern,
      mode
    ] = row;

    if (!dayId) continue;

    if (!workouts[dayId]) {
      workouts[dayId] = {
        id: dayId,
        title: title || dayId,
        focus: focus || '',
        exercises: []
      };
    }

    const exercise: Exercise = {
      id: exId || `${dayId}_${order}_${Date.now()}`,
      order: order || '1A',
      name: name || 'Exercise',
      sets: parseInt(sets, 10) || 0,
      reps: reps || '10',
      tempo: tempo || '',
      notes: notes || '',
      weightGuide: weightGuide || 'Moderate',
      videoUrl: videoUrl ? videoUrl : undefined,
      isRest: isRest === 'true',
      alternatives: [],
      equipment: equipment || undefined,
      targetMuscles: targetMuscles || undefined,
      movementPattern: movementPattern || undefined,
      mode: (mode as 'all' | 'gym' | 'home') || 'all'
    };

    if (isAlternative === 'true') {
      // Find the main exercise with the same order
      const mainEx = workouts[dayId].exercises.find(e => e.order === order);
      if (mainEx) {
        mainEx.alternatives = mainEx.alternatives || [];
        mainEx.alternatives.push(exercise);
      } else {
        // Fallback: if no main exercise found yet, push as main
        workouts[dayId].exercises.push(exercise);
      }
    } else {
      workouts[dayId].exercises.push(exercise);
    }
  }

  return workouts;
};
