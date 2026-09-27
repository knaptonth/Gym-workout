import { WorkoutPlan, WeeklySchedule, SubstitutionMatrix, EquipmentItem } from './types';

export const SCHEDULE: WeeklySchedule = {
  1: 'monday',    // Session A
  3: 'wednesday', // Session B
  5: 'friday',    // Session C
  6: 'saturday',  // Optional Run
};

export const ROTATING_SESSION_KEYS = ['monday', 'wednesday', 'friday'] as const;
export type RotatingSessionKey = typeof ROTATING_SESSION_KEYS[number];

export const SESSION_METADATA: Record<string, { code: 'A' | 'B' | 'C' | 'Run'; title: string; subtitle: string }> = {
  monday: { code: 'A', title: 'Session A', subtitle: 'Full Body Force' },
  wednesday: { code: 'B', title: 'Session B', subtitle: 'Full Body Athleticism' },
  friday: { code: 'C', title: 'Session C', subtitle: 'Run Prep & Upper Pump' },
  saturday: { code: 'Run', title: 'Apex Run', subtitle: '10k Speed Protocol' }
};

// Condo Gym Equipment Inventory
export const CONDO_EQUIPMENT_LIST: EquipmentItem[] = [
  { id: 'chest_press', name: 'Chest Press Machine', category: 'strength' },
  { id: 'lat_pulldown', name: 'Lat Pulldown Machine / Pulley', category: 'strength' },
  { id: 'cable_pulley', name: 'Dual Cable / Pulley Station', category: 'strength' },
  { id: 'leg_curl', name: 'Leg Curl Machine', category: 'strength' },
  { id: 'leg_extension', name: 'Leg Extension Machine', category: 'strength' },
  { id: 'dumbbells', name: 'Dumbbells & Adjustable Bench', category: 'strength' },
  { id: 'pullup_bar', name: 'Pull-Up Bar / Dip Station', category: 'strength' },
  { id: 'mat_bands', name: 'Mat & Resistance Bands', category: 'strength' },
  { id: 'treadmill', name: 'Treadmill', category: 'cardio' },
  { id: 'stationary_bike', name: 'Stationary Bike', category: 'cardio' },
  { id: 'elliptical', name: 'Elliptical', category: 'cardio' },
];

export const CONDO_CARDIO_FINISHERS = [
  {
    id: 'treadmill_incline',
    name: 'Treadmill Incline Flush',
    equipment: 'Treadmill',
    duration: '10-15 min',
    target: 'Zone 2 Recovery',
    protocol: 'Speed: 4.5-5.5 km/h, Incline: 4-8%. Keep HR in Zone 2 for lactic clearance and aerobic base.',
    icon: 'Activity'
  },
  {
    id: 'bike_spin',
    name: 'Stationary Bike Spin',
    equipment: 'Stationary Bike',
    duration: '12 min',
    target: 'Active Joint Flushing',
    protocol: 'Cadence: 80-90 RPM with moderate-light resistance. Flushes knees and hips without impact stress.',
    icon: 'Zap'
  },
  {
    id: 'elliptical_glide',
    name: 'Elliptical Smooth Flush',
    equipment: 'Elliptical',
    duration: '10 min',
    target: 'Low Impact Cardio',
    protocol: 'Continuous rhythmic stride. Low joint compression, excellent post-resistance cool down.',
    icon: 'Clock'
  }
];

// --- APEX PROTOCOL BASE EXERCISES ---

const APEX_MONDAY = [
  {
    id: 'MON_1A_MAIN',
    order: '1A',
    name: 'DB Split Squat',
    sets: 3,
    reps: '8/side',
    tempo: '3-1-1',
    notes: 'Legs. Heavy load. 4 days recovery before run.',
    weightGuide: 'Heavy',
    equipment: 'Dumbbells',
    targetMuscles: 'Quads & Glutes',
    movementPattern: 'Squat / Lunge',
    mode: 'all' as const
  },
  {
    id: 'MON_1B_MAIN',
    order: '1B',
    name: 'Machine Chest Press',
    sets: 3,
    reps: '10-12',
    tempo: '3-0-1',
    notes: 'Push. Stable chest isolation. Set handles to nipple height.',
    weightGuide: 'Moderate-Heavy',
    equipment: 'Chest Press Machine',
    targetMuscles: 'Chest & Triceps',
    movementPattern: 'Horizontal Push',
    mode: 'gym' as const
  },
  {
    id: 'MON_R1',
    order: 'REST',
    name: 'Rest',
    sets: 0,
    reps: '0',
    tempo: '',
    notes: '60-90 Seconds',
    weightGuide: '',
    isRest: true
  },
  {
    id: 'MON_2A_MAIN',
    order: '2A',
    name: 'Lat Pulldown (Machine)',
    sets: 3,
    reps: '12',
    tempo: '3-0-1',
    notes: 'Pull. V-Taper width and rotational posture.',
    weightGuide: 'Moderate',
    equipment: 'Lat Pulldown Machine / Pulley',
    targetMuscles: 'Lats & Upper Back',
    movementPattern: 'Vertical Pull',
    mode: 'gym' as const
  },
  {
    id: 'MON_2B_MAIN',
    order: '2B',
    name: 'DB Woodchop (High to Low)',
    sets: 3,
    reps: '10/side',
    tempo: 'Explosive',
    notes: 'Rotation. Power generation through hips and core.',
    weightGuide: 'Moderate',
    equipment: 'Dumbbells',
    targetMuscles: 'Obliques & Core',
    movementPattern: 'Rotational',
    mode: 'all' as const
  },
  {
    id: 'MON_R2',
    order: 'REST',
    name: 'Rest',
    sets: 0,
    reps: '0',
    tempo: '',
    notes: '60 Seconds',
    weightGuide: '',
    isRest: true
  },
  {
    id: 'MON_3A_MAIN',
    order: '3A',
    name: 'DB Shoulder Press',
    sets: 3,
    reps: '10-12',
    tempo: '2-1-1',
    notes: 'Vertical Push. Deltoid mass and overhead shoulder stability.',
    weightGuide: 'Moderate',
    equipment: 'Dumbbells',
    targetMuscles: 'Deltoids & Triceps',
    movementPattern: 'Vertical Push',
    mode: 'all' as const
  },
  {
    id: 'MON_3B_MAIN',
    order: '3B',
    name: 'Machine Leg Curl',
    sets: 3,
    reps: '12-15',
    tempo: '2-0-2',
    notes: 'Hamstrings. Knee stability for running stride.',
    weightGuide: 'Moderate',
    equipment: 'Leg Curl Machine',
    targetMuscles: 'Hamstrings',
    movementPattern: 'Hinge / Knee Flexion',
    mode: 'gym' as const
  },
  {
    id: 'MON_FIN_MAIN',
    order: 'FINISHER',
    name: 'Machine Leg Extension',
    sets: 3,
    reps: 'Failure',
    tempo: 'Burn',
    notes: 'REST-PAUSE METHOD: 1 Set Broken into 3. Fail -> Rest 15s -> Fail -> Rest 15s -> Fail. Quad Isolation.',
    weightGuide: 'Light-Moderate',
    equipment: 'Leg Extension Machine',
    targetMuscles: 'Quads',
    movementPattern: 'Knee Extension',
    mode: 'gym' as const
  },
];

const APEX_WEDNESDAY = [
  {
    id: 'WED_1A_MAIN',
    order: '1A',
    name: 'Single-Leg DB RDL',
    sets: 3,
    reps: '8/side',
    tempo: '3-1-1',
    notes: 'Hinge. Hamstring & glute balance for running stride.',
    weightGuide: 'Moderate',
    equipment: 'Dumbbells',
    targetMuscles: 'Hamstrings & Glutes',
    movementPattern: 'Hinge',
    mode: 'all' as const
  },
  {
    id: 'WED_1B_MAIN',
    order: '1B',
    name: 'DB Floor Press',
    sets: 3,
    reps: '10-12',
    tempo: '3-0-1',
    notes: 'Push. Tricep/Chest power with safe shoulder elbow floor stop.',
    weightGuide: 'Moderate-Heavy',
    equipment: 'Dumbbells',
    targetMuscles: 'Chest & Triceps',
    movementPattern: 'Horizontal Push',
    mode: 'all' as const
  },
  {
    id: 'WED_R1',
    order: 'REST',
    name: 'Rest',
    sets: 0,
    reps: '0',
    tempo: '',
    notes: '60-90 Seconds',
    weightGuide: '',
    isRest: true
  },
  {
    id: 'WED_2A_MAIN',
    order: '2A',
    name: 'Seated Cable Row (Floor)',
    sets: 3,
    reps: '12',
    tempo: '2-0-1',
    notes: 'Pull. Mid-back thickness (Use low pulley or cable tower).',
    weightGuide: 'Moderate',
    equipment: 'Dual Cable / Pulley Station',
    targetMuscles: 'Mid-Back & Rhomboids',
    movementPattern: 'Horizontal Pull',
    mode: 'gym' as const
  },
  {
    id: 'WED_2B_MAIN',
    order: '2B',
    name: 'Goblet Squat (Heels Mat)',
    sets: 3,
    reps: '15',
    tempo: 'Steady',
    notes: 'Legs. High volume work for deep quad hypertrophy.',
    weightGuide: 'Moderate',
    equipment: 'Dumbbells',
    targetMuscles: 'Quads & Core',
    movementPattern: 'Squat',
    mode: 'all' as const
  },
  {
    id: 'WED_R2',
    order: 'REST',
    name: 'Rest',
    sets: 0,
    reps: '0',
    tempo: '',
    notes: '60 Seconds',
    weightGuide: '',
    isRest: true
  },
  {
    id: 'WED_3A_MAIN',
    order: '3A',
    name: 'Tricep Pushdown',
    sets: 3,
    reps: '15',
    tempo: 'Squeeze',
    notes: 'Arms. Lockout elbow extension strength.',
    weightGuide: 'Moderate',
    equipment: 'Dual Cable / Pulley Station',
    targetMuscles: 'Triceps',
    movementPattern: 'Elbow Extension',
    mode: 'gym' as const
  },
  {
    id: 'WED_3B_MAIN',
    order: '3B',
    name: 'Plank with DB Drag',
    sets: 3,
    reps: '12',
    tempo: 'Slow',
    notes: 'Core. Anti-rotation dynamic stability.',
    weightGuide: 'Body + DB',
    equipment: 'Dumbbells',
    targetMuscles: 'Core & Anti-Rotation',
    movementPattern: 'Core Stability',
    mode: 'all' as const
  },
  {
    id: 'WED_FIN_MAIN',
    order: 'FINISHER',
    name: 'DB Lateral Raises',
    sets: 3,
    reps: 'Failure',
    tempo: 'Pump',
    notes: 'REST-PAUSE METHOD: 1 Set Broken into 3. Fail -> Rest 15s -> Fail -> Rest 15s -> Fail. Shoulder Cap.',
    weightGuide: 'Light',
    equipment: 'Dumbbells',
    targetMuscles: 'Side Delts',
    movementPattern: 'Lateral Abduction',
    mode: 'all' as const
  },
];

const APEX_FRIDAY = [
  {
    id: 'FRI_1A_MAIN',
    order: '1A',
    name: 'Glute Bridge (Weighted)',
    sets: 3,
    reps: '15',
    tempo: 'Squeeze',
    notes: 'Legs (Safe). Activates glutes and pelvic stabilizers with low spinal fatigue.',
    weightGuide: 'Moderate',
    equipment: 'Dumbbells',
    targetMuscles: 'Glutes',
    movementPattern: 'Hip Thrust / Hinge',
    mode: 'all' as const
  },
  {
    id: 'FRI_1B_MAIN',
    order: '1B',
    name: 'Machine Pec Fly',
    sets: 3,
    reps: '15',
    tempo: '3-0-1',
    notes: 'Chest. Deep horizontal stretch & hypertrophy pump.',
    weightGuide: 'Moderate',
    equipment: 'Chest Press Machine',
    targetMuscles: 'Pectorals',
    movementPattern: 'Horizontal Adduction',
    mode: 'gym' as const
  },
  {
    id: 'FRI_R1',
    order: 'REST',
    name: 'Rest',
    sets: 0,
    reps: '0',
    tempo: '',
    notes: '60 Seconds',
    weightGuide: '',
    isRest: true
  },
  {
    id: 'FRI_2A_MAIN',
    order: '2A',
    name: 'Face Pull (Machine High)',
    sets: 3,
    reps: '15',
    tempo: 'Hold 1s',
    notes: 'Posture. Rear delts, rotator cuff, and upper back health.',
    weightGuide: 'Light-Moderate',
    equipment: 'Dual Cable / Pulley Station',
    targetMuscles: 'Rear Delts & Rotator Cuff',
    movementPattern: 'Horizontal Pull / External Rotation',
    mode: 'gym' as const
  },
  {
    id: 'FRI_2B_MAIN',
    order: '2B',
    name: 'Straight Arm Pulldown',
    sets: 3,
    reps: '15',
    tempo: '2-0-1',
    notes: 'Lats. Lat isolation without bicep/grip fatigue.',
    weightGuide: 'Moderate',
    equipment: 'Dual Cable / Pulley Station',
    targetMuscles: 'Lats',
    movementPattern: 'Shoulder Extension',
    mode: 'gym' as const
  },
  {
    id: 'FRI_R2',
    order: 'REST',
    name: 'Rest',
    sets: 0,
    reps: '0',
    tempo: '',
    notes: '60 Seconds',
    weightGuide: '',
    isRest: true
  },
  {
    id: 'FRI_3A_MAIN',
    order: '3A',
    name: 'Standing DB Bicep Curls',
    sets: 3,
    reps: '12',
    tempo: 'Squeeze',
    notes: 'Arms. Bicep peak and pulling endurance.',
    weightGuide: 'Moderate',
    equipment: 'Dumbbells',
    targetMuscles: 'Biceps & Forearms',
    movementPattern: 'Elbow Flexion',
    mode: 'all' as const
  },
  {
    id: 'FRI_3B_MAIN',
    order: '3B',
    name: 'Dead Bug (Weighted)',
    sets: 3,
    reps: '20',
    tempo: 'Control',
    notes: 'Core. Deep anterior abdominal bracing and lumbo-pelvic control.',
    weightGuide: 'Body + Light',
    equipment: 'Dumbbells',
    targetMuscles: 'Core Bracing',
    movementPattern: 'Core Stability',
    mode: 'all' as const
  },
  {
    id: 'FRI_FIN_MAIN',
    order: 'FINISHER',
    name: 'Tricep Pushdown (Rope)',
    sets: 3,
    reps: 'Failure',
    tempo: 'Burn',
    notes: 'REST-PAUSE METHOD: 1 Set Broken into 3. Fail -> Rest 15s -> Fail -> Rest 15s -> Fail. Arm Definition.',
    weightGuide: 'Light-Moderate',
    equipment: 'Dual Cable / Pulley Station',
    targetMuscles: 'Triceps',
    movementPattern: 'Elbow Extension',
    mode: 'gym' as const
  },
];

const APEX_RUNNING = [
  { id: 'RUN_1', order: 'Warm Up', name: 'Walk + Dynamic Drills', sets: 1, reps: '10 min', tempo: 'Dynamic', notes: 'Walk 5 mins + High Knees/Butt Kicks + 3 mins slow jog.', weightGuide: '-', equipment: 'Treadmill', mode: 'all' as const },
  { id: 'RUN_2', order: 'Main Set', name: 'Zone 2 Aerobic Base', sets: 1, reps: '2 km', tempo: 'Slow', notes: 'Let heart rate rise gradually. Conversational breathing pace.', weightGuide: '-', equipment: 'Treadmill', mode: 'all' as const },
  { id: 'RUN_3', order: 'Main Set', name: '10k Pace Work', sets: 1, reps: '5-8 km', tempo: 'Race Pace', notes: 'Target pace: Sub 6:00/km sustainable tempo.', weightGuide: '-', equipment: 'Treadmill', mode: 'all' as const },
  { id: 'RUN_4', order: 'Cool Down', name: 'Easy Walk + Stretches', sets: 1, reps: '5 min', tempo: 'Easy', notes: 'Cool down walk to normalize heart rate and stretch calves/hip flexors.', weightGuide: '-', equipment: 'Treadmill', mode: 'all' as const },
];

// --- SUBSTITUTION MATRIX (MUST BE INITIALIZED BEFORE WORKOUTS) ---
export const SUBSTITUTION_MATRIX: SubstitutionMatrix = {
  monday: {
    '1A': [
      { id: 'MON_1A_ALT1', order: '1A', name: 'DB Reverse Lunge', sets: 3, reps: '10/side', tempo: 'Dynamic', notes: 'Easier on knees, excellent glute load. Perfect for home.', weightGuide: 'Moderate', equipment: 'Dumbbells', targetMuscles: 'Quads & Glutes', movementPattern: 'Squat / Lunge', mode: 'all' },
      { id: 'MON_1A_ALT2', order: '1A', name: 'Goblet Squat (Heels Mat)', sets: 3, reps: '15', tempo: '3-0-1', notes: 'High quad focus using heel elevation mat or plate.', weightGuide: 'Moderate', equipment: 'Dumbbells', targetMuscles: 'Quads', movementPattern: 'Squat', mode: 'all' },
      { id: 'MON_1A_ALT3', order: '1A', name: 'Step-Ups (Bench/Box)', sets: 3, reps: '10/side', tempo: 'Explosive', notes: 'Single-leg run drive and knee stability.', weightGuide: 'Body + DB', equipment: 'Dumbbells & Adjustable Bench', targetMuscles: 'Glutes & Quads', movementPattern: 'Squat / Lunge', mode: 'all' },
      { id: 'MON_1A_ALT4', order: '1A', name: 'Bodyweight Bulgarian Split Squat', sets: 3, reps: '12/side', tempo: '3-1-1', notes: 'Pure bodyweight home burner with back foot on sofa/chair.', weightGuide: 'Body', equipment: 'Mat & Resistance Bands', targetMuscles: 'Quads & Glutes', movementPattern: 'Squat / Lunge', mode: 'home' }
    ],
    '1B': [
      { id: 'MON_1B_ALT1', order: '1B', name: 'DB Flat Bench Press', sets: 3, reps: '10', tempo: '3-1-1', notes: 'Free weight dumbbell pressing. Great if machine is occupied.', weightGuide: 'Moderate', equipment: 'Dumbbells & Adjustable Bench', targetMuscles: 'Chest & Triceps', movementPattern: 'Horizontal Push', mode: 'all' },
      { id: 'MON_1B_ALT2', order: '1B', name: 'DB Floor Press', sets: 3, reps: '12', tempo: '3-0-1', notes: 'Zero bench required. Gentle on anterior shoulder capsule.', weightGuide: 'Moderate', equipment: 'Dumbbells', targetMuscles: 'Chest & Triceps', movementPattern: 'Horizontal Push', mode: 'home' },
      { id: 'MON_1B_ALT3', order: '1B', name: 'Push-Ups (Tempo / Deficit)', sets: 3, reps: 'Failure', tempo: '3-1-1', notes: 'Bodyweight chest mastery. Add backpack or plate for weight.', weightGuide: 'Body + Weight', equipment: 'Mat & Resistance Bands', targetMuscles: 'Chest & Core', movementPattern: 'Horizontal Push', mode: 'all' },
      { id: 'MON_1B_ALT4', order: '1B', name: 'Standing Cable Chest Press', sets: 3, reps: '12', tempo: '2-0-1', notes: 'Continuous cable tension plus upright core stability.', weightGuide: 'Moderate', equipment: 'Dual Cable / Pulley Station', targetMuscles: 'Chest & Core', movementPattern: 'Horizontal Push', mode: 'gym' }
    ],
    '2A': [
      { id: 'MON_2A_ALT1', order: '2A', name: 'Single-Arm DB Row', sets: 3, reps: '10/side', tempo: '2-1-1', notes: 'Lats & obliques for rotational power. Home and gym staple.', weightGuide: 'Moderate', equipment: 'Dumbbells & Adjustable Bench', targetMuscles: 'Lats & Upper Back', movementPattern: 'Horizontal Pull', mode: 'all' },
      { id: 'MON_2A_ALT2', order: '2A', name: 'Pull-Up (Assisted / Bodyweight)', sets: 3, reps: 'Failure', tempo: 'Control', notes: 'The gold standard vertical pull for lat width and shoulder health.', weightGuide: 'Body', equipment: 'Pull-Up Bar / Dip Station', targetMuscles: 'Lats', movementPattern: 'Vertical Pull', mode: 'all' },
      { id: 'MON_2A_ALT3', order: '2A', name: 'Dual DB Bent-Over Row', sets: 3, reps: '12', tempo: '2-0-1', notes: 'Upper back density and posterior chain bracing.', weightGuide: 'Moderate', equipment: 'Dumbbells', targetMuscles: 'Upper Back & Rhomboids', movementPattern: 'Horizontal Pull', mode: 'all' },
      { id: 'MON_2A_ALT4', order: '2A', name: 'Banded Kneeling Lat Pulldown', sets: 3, reps: '15', tempo: 'Hold 1s', notes: 'Attach band overhead at home. Focus on squeezing armpits down.', weightGuide: 'Band', equipment: 'Mat & Resistance Bands', targetMuscles: 'Lats', movementPattern: 'Vertical Pull', mode: 'home' }
    ],
    '2B': [
      { id: 'MON_2B_ALT1', order: '2B', name: 'Cable Woodchop (High-Low)', sets: 3, reps: '10/side', tempo: 'Smooth', notes: 'Constant pulley resistance throughout rotational range.', weightGuide: 'Moderate', equipment: 'Dual Cable / Pulley Station', targetMuscles: 'Obliques & Core', movementPattern: 'Rotational', mode: 'gym' },
      { id: 'MON_2B_ALT2', order: '2B', name: 'Russian Twist (Weighted)', sets: 3, reps: '20', tempo: 'Control', notes: 'Seated oblique stiffness. Keep chest high and spine neutral.', weightGuide: 'Light', equipment: 'Dumbbells', targetMuscles: 'Obliques', movementPattern: 'Rotational', mode: 'all' },
      { id: 'MON_2B_ALT3', order: '2B', name: 'Banded Pallof Press', sets: 3, reps: '15s hold', tempo: 'Iso', notes: 'Elite anti-rotation isometric bracing. Safe and effective anywhere.', weightGuide: 'Band', equipment: 'Mat & Resistance Bands', targetMuscles: 'Deep Core Bracing', movementPattern: 'Anti-Rotation', mode: 'all' }
    ],
    '3A': [
      { id: 'MON_3A_ALT1', order: '3A', name: 'Arnold Press', sets: 3, reps: '10', tempo: '2-0-1', notes: 'Rotates through anterior and lateral deltoid heads.', weightGuide: 'Moderate', equipment: 'Dumbbells', targetMuscles: 'Deltoids', movementPattern: 'Vertical Push', mode: 'all' },
      { id: 'MON_3A_ALT2', order: '3A', name: 'Single-Arm Standing Press', sets: 3, reps: '8/side', tempo: '2-0-1', notes: 'High unilateral core stability demand and shoulder freedom.', weightGuide: 'Moderate', equipment: 'Dumbbells', targetMuscles: 'Deltoids & Core', movementPattern: 'Vertical Push', mode: 'all' },
      { id: 'MON_3A_ALT3', order: '3A', name: 'Pike Push-Ups (Feet on floor/bed)', sets: 3, reps: 'Failure', tempo: '2-1-1', notes: 'Bodyweight overhead press simulator. Excellent home shoulder builder.', weightGuide: 'Body', equipment: 'Mat & Resistance Bands', targetMuscles: 'Shoulders & Triceps', movementPattern: 'Vertical Push', mode: 'home' }
    ],
    '3B': [
      { id: 'MON_3B_ALT1', order: '3B', name: 'DB Romanian Deadlift (RDL)', sets: 3, reps: '12', tempo: '3-1-1', notes: 'Hinge pattern. Builds hamstrings and glutes without machine.', weightGuide: 'Moderate', equipment: 'Dumbbells', targetMuscles: 'Hamstrings & Glutes', movementPattern: 'Hinge', mode: 'all' },
      { id: 'MON_3B_ALT2', order: '3B', name: 'Single-Leg Machine Curl', sets: 3, reps: '10/side', tempo: '2-0-2', notes: 'Addresses left-right hamstring asymmetry on gym machine.', weightGuide: 'Moderate', equipment: 'Leg Curl Machine', targetMuscles: 'Hamstrings', movementPattern: 'Knee Flexion', mode: 'gym' },
      { id: 'MON_3B_ALT3', order: '3B', name: 'Slider / Towel Curl (Floor)', sets: 3, reps: '12', tempo: 'Fluid', notes: 'High eccentric hamstring tension on smooth floor or towel.', weightGuide: 'Body', equipment: 'Mat & Resistance Bands', targetMuscles: 'Hamstrings', movementPattern: 'Knee Flexion', mode: 'home' }
    ],
    'FINISHER': [
      { id: 'MON_FIN_ALT1', order: 'FINISHER', name: 'Wall Sit (60-90s)', sets: 1, reps: 'Failure', tempo: 'Iso', notes: 'Isometric quad endurance and mental toughness burnout.', weightGuide: 'Body', equipment: 'Mat & Resistance Bands', targetMuscles: 'Quads', movementPattern: 'Isometric', mode: 'all' },
      { id: 'MON_FIN_ALT2', order: 'FINISHER', name: 'Walking Lunges (Bodyweight)', sets: 1, reps: 'Failure', tempo: 'Burn', notes: 'Metabolic leg stress without joint compression.', weightGuide: 'Body', equipment: 'Mat & Resistance Bands', targetMuscles: 'Quads & Glutes', movementPattern: 'Squat / Lunge', mode: 'all' },
      { id: 'MON_FIN_ALT3', order: 'FINISHER', name: 'Jump Squats (Soft Landing)', sets: 1, reps: 'Failure', tempo: 'Explosive', notes: 'Power burnout and fast-twitch recruitment.', weightGuide: 'Body', equipment: 'Mat & Resistance Bands', targetMuscles: 'Legs & Power', movementPattern: 'Explosive', mode: 'all' }
    ]
  },
  wednesday: {
    '1A': [
      { id: 'WED_1A_ALT1', order: '1A', name: 'Staggered Stance DB RDL', sets: 3, reps: '10/side', tempo: '3-0-1', notes: 'Kickstand rear foot gives rock-solid balance for heavier loading.', weightGuide: 'Moderate', equipment: 'Dumbbells', targetMuscles: 'Hamstrings & Glutes', movementPattern: 'Hinge', mode: 'all' },
      { id: 'WED_1A_ALT2', order: '1A', name: 'DB / Kettlebell Swing', sets: 3, reps: '15', tempo: 'Explosive', notes: 'Hip snap power and posterior chain velocity.', weightGuide: 'Moderate', equipment: 'Dumbbells', targetMuscles: 'Glutes & Hamstrings', movementPattern: 'Hinge', mode: 'all' },
      { id: 'WED_1A_ALT3', order: '1A', name: 'Cable Pull-Through', sets: 3, reps: '12', tempo: '2-0-1', notes: 'Horizontal glute resistance, zero spinal axial compression.', weightGuide: 'Moderate', equipment: 'Dual Cable / Pulley Station', targetMuscles: 'Glutes & Hamstrings', movementPattern: 'Hinge', mode: 'gym' }
    ],
    '1B': [
      { id: 'WED_1B_ALT1', order: '1B', name: 'Standard Push-Ups (Fast Tempo)', sets: 3, reps: 'Failure', tempo: 'Fast', notes: 'Upper body pushing power and core bracing.', weightGuide: 'Body', equipment: 'Mat & Resistance Bands', targetMuscles: 'Chest & Triceps', movementPattern: 'Horizontal Push', mode: 'all' },
      { id: 'WED_1B_ALT2', order: '1B', name: 'DB Incline Bench Press', sets: 3, reps: '10', tempo: '3-1-1', notes: 'Upper clavicular chest hypertrophy.', weightGuide: 'Moderate', equipment: 'Dumbbells & Adjustable Bench', targetMuscles: 'Upper Chest', movementPattern: 'Incline Push', mode: 'all' },
      { id: 'WED_1B_ALT3', order: '1B', name: 'Standing Cable Chest Press', sets: 3, reps: '12', tempo: '2-0-1', notes: 'Integrates standing kinetic chain and anti-rotation.', weightGuide: 'Moderate', equipment: 'Dual Cable / Pulley Station', targetMuscles: 'Chest & Core', movementPattern: 'Horizontal Push', mode: 'gym' }
    ],
    '2A': [
      { id: 'WED_2A_ALT1', order: '2A', name: 'DB Gorilla Row', sets: 3, reps: '10/side', tempo: 'Explosive', notes: 'Hinge position pulling power with alternate arm support on DB.', weightGuide: 'Moderate', equipment: 'Dumbbells', targetMuscles: 'Lats & Rhomboids', movementPattern: 'Horizontal Pull', mode: 'all' },
      { id: 'WED_2A_ALT2', order: '2A', name: 'Banded / Cable Face Pulls', sets: 3, reps: '15', tempo: 'Hold 1s', notes: 'Rotator cuff and upper back health for posture.', weightGuide: 'Light', equipment: 'Dual Cable / Pulley Station', targetMuscles: 'Rear Delts & Upper Back', movementPattern: 'Horizontal Pull', mode: 'all' },
      { id: 'WED_2A_ALT3', order: '2A', name: 'Single-Arm DB Row', sets: 3, reps: '10/side', tempo: '2-1-1', notes: 'Classic heavy dumbbell row with bench or knee support.', weightGuide: 'Moderate', equipment: 'Dumbbells & Adjustable Bench', targetMuscles: 'Lats', movementPattern: 'Horizontal Pull', mode: 'all' }
    ],
    '2B': [
      { id: 'WED_2B_ALT1', order: '2B', name: 'Walking Lunges (Weighted)', sets: 3, reps: '20 steps', tempo: 'Dynamic', notes: 'Dynamic single-leg strength and hip extension stride.', weightGuide: 'Body + DB', equipment: 'Dumbbells', targetMuscles: 'Quads & Glutes', movementPattern: 'Squat / Lunge', mode: 'all' },
      { id: 'WED_2B_ALT2', order: '2B', name: 'Step-Ups (DB in hands)', sets: 3, reps: '10/side', tempo: 'Explosive', notes: 'Drive through lead heel to simulate hill climb run power.', weightGuide: 'Body + DB', equipment: 'Dumbbells & Adjustable Bench', targetMuscles: 'Glutes & Quads', movementPattern: 'Squat / Lunge', mode: 'all' },
      { id: 'WED_2B_ALT3', order: '2B', name: 'DB Split Squat (High Rep)', sets: 3, reps: '15/side', tempo: 'Fast', notes: 'Lactic acid flushing and endurance volume for legs.', weightGuide: 'Light', equipment: 'Dumbbells', targetMuscles: 'Quads', movementPattern: 'Squat / Lunge', mode: 'all' }
    ],
    '3A': [
      { id: 'WED_3A_ALT1', order: '3A', name: 'Overhead DB Tricep Extension', sets: 3, reps: '12', tempo: 'Stretch', notes: 'Targets long head of triceps with deep overhead stretch.', weightGuide: 'Light-Moderate', equipment: 'Dumbbells', targetMuscles: 'Triceps', movementPattern: 'Elbow Extension', mode: 'all' },
      { id: 'WED_3A_ALT2', order: '3A', name: 'DB Kickbacks', sets: 3, reps: '15', tempo: 'Hold 1s', notes: 'Peak tricep contraction at full extension.', weightGuide: 'Light', equipment: 'Dumbbells', targetMuscles: 'Triceps', movementPattern: 'Elbow Extension', mode: 'all' },
      { id: 'WED_3A_ALT3', order: '3A', name: 'Diamond Push-Ups', sets: 3, reps: 'Failure', tempo: 'Control', notes: 'Bodyweight tricep compound mass builder.', weightGuide: 'Body', equipment: 'Mat & Resistance Bands', targetMuscles: 'Triceps & Chest', movementPattern: 'Horizontal Push', mode: 'all' }
    ],
    '3B': [
      { id: 'WED_3B_ALT1', order: '3B', name: 'Dead Bug (Bodyweight/Banded)', sets: 3, reps: '20', tempo: 'Control', notes: 'Deep transverse abdominis bracing with opposing limb reach.', weightGuide: 'Body', equipment: 'Mat & Resistance Bands', targetMuscles: 'Core Bracing', movementPattern: 'Core Stability', mode: 'all' },
      { id: 'WED_3B_ALT2', order: '3B', name: 'Pallof Press (Cable / Band)', sets: 3, reps: '15s hold', tempo: 'Iso', notes: 'Gold standard rotational stiffness and spine stability.', weightGuide: 'Band', equipment: 'Mat & Resistance Bands', targetMuscles: 'Anti-Rotation', movementPattern: 'Anti-Rotation', mode: 'all' },
      { id: 'WED_3B_ALT3', order: '3B', name: 'Suitcase Carry (1 Heavy DB)', sets: 3, reps: '30s walk', tempo: 'Walk', notes: 'Unilateral loaded carry. Superb lateral core & hip strength.', weightGuide: 'Heavy', equipment: 'Dumbbells', targetMuscles: 'Obliques & Grip', movementPattern: 'Carry', mode: 'all' }
    ],
    'FINISHER': [
      { id: 'WED_FIN_ALT1', order: 'FINISHER', name: 'Band Pull-Aparts', sets: 1, reps: 'Failure', tempo: 'Fast', notes: 'Rear delt and upper trap burn. Excellent golf posture drill.', weightGuide: 'Band', equipment: 'Mat & Resistance Bands', targetMuscles: 'Rear Delts', movementPattern: 'Pull', mode: 'all' },
      { id: 'WED_FIN_ALT2', order: 'FINISHER', name: 'DB Upright Row', sets: 1, reps: 'Failure', tempo: 'Control', notes: 'Side delts and upper traps definition.', weightGuide: 'Light', equipment: 'Dumbbells', targetMuscles: 'Side Delts & Traps', movementPattern: 'Vertical Pull', mode: 'all' },
      { id: 'WED_FIN_ALT3', order: 'FINISHER', name: 'DB Halo', sets: 1, reps: 'Failure', tempo: 'Control', notes: 'Shoulder mobility and rotary core conditioning.', weightGuide: 'Light', equipment: 'Dumbbells', targetMuscles: 'Shoulders & Core', movementPattern: 'Rotational', mode: 'all' }
    ]
  },
  friday: {
    '1A': [
      { id: 'FRI_1A_ALT1', order: '1A', name: 'Cable Pull-Through', sets: 3, reps: '15', tempo: '2-0-1', notes: 'Pure glute lockouts, zero spinal compression. Preps legs for run.', weightGuide: 'Moderate', equipment: 'Dual Cable / Pulley Station', targetMuscles: 'Glutes & Hamstrings', movementPattern: 'Hinge', mode: 'gym' },
      { id: 'FRI_1A_ALT2', order: '1A', name: 'Machine Leg Curl (Light Flush)', sets: 3, reps: '15', tempo: 'Fast', notes: 'Blood flow priming without creating muscle micro-tears.', weightGuide: 'Light', equipment: 'Leg Curl Machine', targetMuscles: 'Hamstrings', movementPattern: 'Knee Flexion', mode: 'gym' },
      { id: 'FRI_1A_ALT3', order: '1A', name: 'Frog Pumps (Glute Burner)', sets: 3, reps: '25', tempo: 'Fast', notes: 'High metabolic stress glute burn without loading lower back.', weightGuide: 'Body', equipment: 'Mat & Resistance Bands', targetMuscles: 'Glutes', movementPattern: 'Hip Thrust', mode: 'all' }
    ],
    '1B': [
      { id: 'FRI_1B_ALT1', order: '1B', name: 'DB Floor Fly', sets: 3, reps: '12', tempo: '3-0-1', notes: 'Safe chest fly stretch with floor stop preventing anterior strain.', weightGuide: 'Moderate', equipment: 'Dumbbells', targetMuscles: 'Pectorals', movementPattern: 'Horizontal Fly', mode: 'all' },
      { id: 'FRI_1B_ALT2', order: '1B', name: 'Push-Ups (Wide Grip)', sets: 3, reps: 'Failure', tempo: 'Fast', notes: 'Blood flow pump across pectoral fibers.', weightGuide: 'Body', equipment: 'Mat & Resistance Bands', targetMuscles: 'Pectorals', movementPattern: 'Horizontal Push', mode: 'all' },
      { id: 'FRI_1B_ALT3', order: '1B', name: 'Plate / DB Squeeze Press', sets: 3, reps: '20', tempo: 'Squeeze', notes: 'Squeeze weights together to maximize inner chest tension.', weightGuide: 'Light Plate', equipment: 'Dumbbells', targetMuscles: 'Inner Chest', movementPattern: 'Horizontal Push', mode: 'all' }
    ],
    '2A': [
      { id: 'FRI_2A_ALT1', order: '2A', name: 'DB Rear Delt Fly', sets: 3, reps: '15', tempo: '2-1-1', notes: 'Hinged rear delt fly. Essential for upper back support.', weightGuide: 'Light', equipment: 'Dumbbells', targetMuscles: 'Rear Delts', movementPattern: 'Horizontal Fly', mode: 'all' },
      { id: 'FRI_2A_ALT2', order: '2A', name: 'Band Pull-Aparts', sets: 3, reps: '20', tempo: 'Fast', notes: 'Volume accumulation for upper back tone.', weightGuide: 'Band', equipment: 'Mat & Resistance Bands', targetMuscles: 'Upper Back', movementPattern: 'Pull', mode: 'all' },
      { id: 'FRI_2A_ALT3', order: '2A', name: 'Prone Y-Raises (Floor)', sets: 3, reps: '12', tempo: 'Hold 1s', notes: 'Lower trap activation for scapular depression and tilt.', weightGuide: 'Body', equipment: 'Mat & Resistance Bands', targetMuscles: 'Lower Traps', movementPattern: 'Scapular Control', mode: 'all' }
    ],
    '2B': [
      { id: 'FRI_2B_ALT1', order: '2B', name: 'DB Pullover (Bench/Floor)', sets: 3, reps: '12', tempo: 'Stretch', notes: 'Ribcage expansion, serratus, and long lat stretch.', weightGuide: 'Moderate', equipment: 'Dumbbells & Adjustable Bench', targetMuscles: 'Lats & Serratus', movementPattern: 'Shoulder Extension', mode: 'all' },
      { id: 'FRI_2B_ALT2', order: '2B', name: 'Cable Lat Prayer', sets: 3, reps: '15', tempo: 'Stretch', notes: 'Kneeling cable pullover with deep lat stretch.', weightGuide: 'Moderate', equipment: 'Dual Cable / Pulley Station', targetMuscles: 'Lats', movementPattern: 'Shoulder Extension', mode: 'gym' },
      { id: 'FRI_2B_ALT3', order: '2B', name: 'Single-Arm Lat Pulldown', sets: 3, reps: '12/side', tempo: 'Control', notes: 'Unilateral lat focus to even out side-to-side pulling strength.', weightGuide: 'Moderate', equipment: 'Dual Cable / Pulley Station', targetMuscles: 'Lats', movementPattern: 'Vertical Pull', mode: 'gym' }
    ],
    '3A': [
      { id: 'FRI_3A_ALT1', order: '3A', name: 'DB Hammer Curls', sets: 3, reps: '12', tempo: 'Control', notes: 'Forearm, brachialis, and grip strength.', weightGuide: 'Moderate', equipment: 'Dumbbells', targetMuscles: 'Biceps & Forearms', movementPattern: 'Elbow Flexion', mode: 'all' },
      { id: 'FRI_3A_ALT2', order: '3A', name: 'Cable Rope Curls', sets: 3, reps: '15', tempo: 'Constant', notes: 'Constant cable tension through full arc.', weightGuide: 'Moderate', equipment: 'Dual Cable / Pulley Station', targetMuscles: 'Biceps', movementPattern: 'Elbow Flexion', mode: 'gym' },
      { id: 'FRI_3A_ALT3', order: '3A', name: 'Zottman Curls', sets: 3, reps: '10', tempo: 'Slow', notes: 'Curl up supinated, lower pronated for complete arm hypertrophy.', weightGuide: 'Light', equipment: 'Dumbbells', targetMuscles: 'Biceps & Forearms', movementPattern: 'Elbow Flexion', mode: 'all' }
    ],
    '3B': [
      { id: 'FRI_3B_ALT1', order: '3B', name: 'Banded Pallof Press', sets: 3, reps: '15s', tempo: 'Iso', notes: 'Rotational stabilizer and spine protection.', weightGuide: 'Band', equipment: 'Mat & Resistance Bands', targetMuscles: 'Anti-Rotation', movementPattern: 'Anti-Rotation', mode: 'all' },
      { id: 'FRI_3B_ALT2', order: '3B', name: 'Hanging Knee Raise', sets: 3, reps: '10', tempo: 'Control', notes: 'Lower abs and hip flexor control on bar.', weightGuide: 'Body', equipment: 'Pull-Up Bar / Dip Station', targetMuscles: 'Lower Abs', movementPattern: 'Hip Flexion', mode: 'all' },
      { id: 'FRI_3B_ALT3', order: '3B', name: 'Russian Twist (Bodyweight/Light)', sets: 3, reps: '20', tempo: 'Control', notes: 'Rotational endurance for core stamina.', weightGuide: 'Light', equipment: 'Mat & Resistance Bands', targetMuscles: 'Obliques', movementPattern: 'Rotational', mode: 'all' }
    ],
    'FINISHER': [
      { id: 'FRI_FIN_ALT1', order: 'FINISHER', name: 'Bench Dips', sets: 1, reps: 'Failure', tempo: 'Burn', notes: 'Bodyweight arm burnout using bench or stable chair.', weightGuide: 'Body', equipment: 'Dumbbells & Adjustable Bench', targetMuscles: 'Triceps', movementPattern: 'Elbow Extension', mode: 'all' },
      { id: 'FRI_FIN_ALT2', order: 'FINISHER', name: 'Close Grip Push-Ups', sets: 1, reps: 'Failure', tempo: 'Control', notes: 'Tricep and inner chest compound burnout.', weightGuide: 'Body', equipment: 'Mat & Resistance Bands', targetMuscles: 'Triceps & Chest', movementPattern: 'Horizontal Push', mode: 'all' },
      { id: 'FRI_FIN_ALT3', order: 'FINISHER', name: 'Overhead DB Extension', sets: 1, reps: 'Failure', tempo: 'Stretch', notes: 'Long head tricep metabolic burnout.', weightGuide: 'Light', equipment: 'Dumbbells', targetMuscles: 'Triceps', movementPattern: 'Elbow Extension', mode: 'all' }
    ]
  }
};

// --- BASE WORKOUT PLAN DEFINITION ---
export const WORKOUTS: WorkoutPlan = {
  Apex: {
    monday: { 
      id: 'monday', 
      title: 'Session A: Full Body Force', 
      focus: 'Heavy Compound Power & Posterior Chain',
      sessionCode: 'A',
      exercises: APEX_MONDAY.map(ex => ({ ...ex, alternatives: SUBSTITUTION_MATRIX.monday?.[ex.order] || [] })) 
    },
    wednesday: { 
      id: 'wednesday', 
      title: 'Session B: Full Body Athleticism', 
      focus: 'Unilateral Stability & Anti-Rotation', 
      sessionCode: 'B',
      exercises: APEX_WEDNESDAY.map(ex => ({ ...ex, alternatives: SUBSTITUTION_MATRIX.wednesday?.[ex.order] || [] })) 
    },
    friday: { 
      id: 'friday', 
      title: 'Session C: Run Prep & Upper Pump', 
      focus: 'Priming Legs + Arm Definition', 
      sessionCode: 'C',
      exercises: APEX_FRIDAY.map(ex => ({ ...ex, alternatives: SUBSTITUTION_MATRIX.friday?.[ex.order] || [] })) 
    },
    saturday: { 
      id: 'saturday', 
      title: 'Apex Run Protocol', 
      focus: '10k Speed Pace & Conditioning', 
      sessionCode: 'Run',
      exercises: APEX_RUNNING.map(ex => ({ ...ex, alternatives: [] })) 
    },
  },
};
