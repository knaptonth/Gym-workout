
import { GoogleGenAI, Type } from "@google/genai";
import { SessionLog, WorkoutDay } from '../types';
import { WORKOUTS } from '../constants';

// Fixed: analyzeSession now uses the recommended gemini-3-flash-preview model and process.env.API_KEY.
export const analyzeSession = async (log: SessionLog): Promise<string> => {
  // 1. Check Offline Status
  if (!navigator.onLine) {
    return "You are currently offline. Your workout has been saved locally. Connect to the internet later to receive AI coaching feedback.";
  }

  // Always use the API key from the environment variable.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const workoutRef = WORKOUTS[log.version][log.dayId];
    
    // Construct a prompt that gives context
    const prompt = `
      You are an expert TPI-certified Golf Fitness Instructor. 
      The user just completed the "${workoutRef?.title || 'Custom Workout'}" workout.
      
      Here is their log data:
      ${JSON.stringify(log.exercises, null, 2)}
      
      Please provide brief, high-impact feedback (max 100 words).
      1. Praise effort on completed heavy lifts.
      2. Point out one area to focus on tempo or form for next time.
      3. Give a specific "Swing Thought" relating this gym work to their golf swing.
      
      Keep the tone encouraging but professional.
    `;

    // Accessing .text property directly as recommended.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "Could not generate feedback.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Coach AI is currently unreachable. Your workout is saved locally. Feedback will be available when connection improves.";
  }
};

// Fixed: generateWorkout now uses the recommended gemini-3-flash-preview model and responseSchema for structured JSON.
export const generateWorkout = async (
  exerciseCount: string,
  duration: string,
  equipment: string
): Promise<WorkoutDay | null> => {
  // Always use the API key from the environment variable.
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Create a detailed single-day workout plan based on these specific constraints:
    1. Number of Exercises: Approximately ${exerciseCount}.
    2. Duration Available: ${duration}.
    3. Equipment Available: ${equipment}.

    Return ONLY raw JSON matching the provided responseSchema.

    Rules:
    - Include 1-2 minute Rest periods as separate items in the exercises array with isRest: true, name: "Rest", sets: 0, reps: "0".
    - Tailor exercises strictly to the equipment provided (${equipment}).
    - Ensure the total volume fits within ${duration}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            id: {
              type: Type.STRING,
              description: 'The unique identifier for the workout day (e.g., ai_generated_timestamp)',
            },
            title: {
              type: Type.STRING,
              description: 'Creative title for the workout.',
            },
            focus: {
              type: Type.STRING,
              description: 'Main focus area (e.g., Full Body Power).',
            },
            exercises: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  order: { type: Type.STRING },
                  name: { type: Type.STRING },
                  sets: { type: Type.NUMBER },
                  reps: { type: Type.STRING },
                  tempo: { type: Type.STRING },
                  notes: { type: Type.STRING },
                  weightGuide: { type: Type.STRING },
                  isRest: { type: Type.BOOLEAN },
                },
                required: ['id', 'order', 'name', 'sets', 'reps', 'tempo', 'notes', 'weightGuide', 'isRest'],
              },
            },
          },
          required: ['id', 'title', 'focus', 'exercises'],
        },
      },
    });

    const text = response.text;
    if (!text) return null;
    
    // Parse JSON
    const data = JSON.parse(text);
    return data as WorkoutDay;
  } catch (error) {
    console.error("Generate Workout Error:", error);
    throw error;
  }
};
