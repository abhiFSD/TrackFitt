import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Workout, WorkoutHistory } from '../interfaces';
import { workoutAPI, workoutHistoryAPI, scheduledWorkoutAPI } from '../services/api';

interface ExerciseSet {
  setNumber: number;
  plannedReps: number;
  plannedWeight?: number;
  actualReps?: number;
  actualWeight?: number;
  restTimeSeconds?: number;
  isCompleted: boolean;
  completionTime?: string;
  durationSeconds?: number;
  restTimerActive?: boolean;
  restTimeElapsed?: number;
}

interface WorkoutExercise {
  exerciseId: number;
  name: string;
  sets: ExerciseSet[];
}

interface ActiveWorkout {
  workoutId: number;
  title: string;
  exercises: WorkoutExercise[];
  startTime: string;
  elapsedTimeInSeconds: number;
  isCompleted: boolean;
  historyId?: number;
  scheduledWorkoutId?: number;
}

interface WorkoutTrackingContextType {
  activeWorkout: ActiveWorkout | null;
  isLoading: boolean;
  startWorkout: (workoutId: number, scheduledWorkoutId?: number) => Promise<ActiveWorkout | void>;
  resumeWorkout: () => void;
  completeWorkout: (notes?: string, rating?: number) => Promise<WorkoutHistory | null>;
  cancelWorkout: () => void;
  markSetCompleted: (exerciseIndex: number, setIndex: number, actualReps?: number, actualWeight?: number) => void;
  getElapsedTime: () => { minutes: number; seconds: number };
  isPaused: boolean;
  togglePause: () => void;
  getRestTimeRemaining: (exerciseIndex: number, setIndex: number) => number;
}

const WorkoutTrackingContext = createContext<WorkoutTrackingContextType | undefined>(undefined);

export const useWorkoutTracking = () => {
  const context = useContext(WorkoutTrackingContext);
  if (!context) {
    throw new Error('useWorkoutTracking must be used within a WorkoutTrackingProvider');
  }
  return context;
};

export const WorkoutTrackingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  const [restTimers, setRestTimers] = useState<{ [key: string]: NodeJS.Timeout }>({});

  // Load active workout from localStorage on mount
  useEffect(() => {
    const savedWorkout = localStorage.getItem('activeWorkout');
    if (savedWorkout) {
      const parsedWorkout = JSON.parse(savedWorkout) as ActiveWorkout;
      setActiveWorkout(parsedWorkout);
    }
  }, []);

  // Update timer every second when workout is active
  useEffect(() => {
    if (activeWorkout && !activeWorkout.isCompleted && !isPaused) {
      const interval = setInterval(() => {
        setActiveWorkout(prev => {
          if (!prev) return null;
          
          // Create a deep copy to ensure proper state updates
          const updatedWorkout = JSON.parse(JSON.stringify(prev));
          
          // Update main workout timer
          updatedWorkout.elapsedTimeInSeconds = prev.elapsedTimeInSeconds + 1;
          
          // Update any active rest timers
          updatedWorkout.exercises.forEach((exercise: WorkoutExercise, exIdx: number) => {
            exercise.sets.forEach((set: ExerciseSet, setIdx: number) => {
              if (set.restTimerActive && set.restTimeElapsed !== undefined) {
                set.restTimeElapsed += 1;
              }
            });
          });
          
          // Save to localStorage
          localStorage.setItem('activeWorkout', JSON.stringify(updatedWorkout));
          
          return updatedWorkout;
        });
      }, 1000);
      
      setTimer(interval);
      
      return () => {
        clearInterval(interval);
        setTimer(null);
      };
    } else if (timer) {
      clearInterval(timer);
      setTimer(null);
    }
  }, [activeWorkout, isPaused]);

  const startWorkout = async (workoutId: number, scheduledWorkoutId?: number) => {
    try {
      setIsLoading(true);
      
      let newActiveWorkout: ActiveWorkout = {
        workoutId: workoutId,
        title: "Workout",
        startTime: new Date().toISOString(),
        exercises: [],
        elapsedTimeInSeconds: 0,
        isCompleted: false,
        scheduledWorkoutId
      };
      
      // If starting from a scheduled workout, record this in history immediately
      let historyId: number | undefined = undefined;
      
      if (scheduledWorkoutId) {
        try {
          const result = await scheduledWorkoutAPI.startWorkout(scheduledWorkoutId);
          console.log('Started scheduled workout, created history:', result);
          historyId = result.id;
          newActiveWorkout.historyId = historyId;
          newActiveWorkout.title = result.title;
        } catch (error) {
          console.error('Error starting scheduled workout:', error);
        }
      }
      
      try {
        const workout = await workoutAPI.getWorkout(workoutId);
        console.log('Workout data retrieved:', workout);
        
        if (workout && workout.exercises && workout.exercises.length > 0) {
          console.log('Creating workout from API data');
          
          newActiveWorkout = {
            workoutId: workout.id,
            title: workout.title,
            startTime: new Date().toISOString(),
            exercises: workout.exercises.map(ex => {
              // If we have detailed sets, use them
              const sets = ex.set_details && ex.set_details.length > 0 
                ? ex.set_details.map(set => ({
                    setNumber: set.set_number,
                    plannedReps: set.reps,
                    plannedWeight: set.weight,
                    restTimeSeconds: set.rest_time_seconds,
                    isCompleted: false
                  }))
                // Otherwise create sets based on the exercise-level data
                : Array(ex.sets).fill(null).map((_, idx) => ({
                    setNumber: idx + 1,
                    plannedReps: ex.reps,
                    plannedWeight: ex.weight,
                    restTimeSeconds: ex.rest_time_seconds || 60, // Default to 60 seconds rest
                    isCompleted: false
                  }));
              
              return {
                exerciseId: ex.exercise_id,
                name: ex.exercise?.name || `Exercise #${ex.exercise_id}`,
                sets: sets
              };
            }),
            elapsedTimeInSeconds: 0,
            isCompleted: false
          };
        } else {
          console.warn('Invalid workout data received, using default');
        }
      } catch (apiError) {
        console.error('API Error when starting workout:', apiError);
        console.log('Using default workout data');
      }
      
      console.log('Setting active workout:', newActiveWorkout);
      setActiveWorkout(newActiveWorkout);
      localStorage.setItem('activeWorkout', JSON.stringify(newActiveWorkout));
      setIsPaused(false);
      
      return newActiveWorkout;
    } catch (error) {
      console.error('Error starting workout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const resumeWorkout = () => {
    if (activeWorkout && !activeWorkout.isCompleted) {
      setIsPaused(false);
    }
  };

  const completeWorkout = async (notes?: string, rating?: number): Promise<WorkoutHistory | null> => {
    if (!activeWorkout) return null;
    
    try {
      setIsLoading(true);
      
      // Calculate duration in minutes
      const durationMinutes = Math.ceil(activeWorkout.elapsedTimeInSeconds / 60);
      
      // If the workout already has a history ID, we just need to update it with the final data
      if (activeWorkout.historyId) {
        try {
          // Create update data object
          const updateData = {
            notes: notes || '',
            rating: rating,
            duration_minutes: durationMinutes
          };
          
          // Use axios through our API service instead of direct fetch
          const response = await workoutHistoryAPI.updateWorkoutHistory(activeWorkout.historyId, updateData);
          console.log('Updated existing workout history:', response);
          
          // Clear active workout
          setActiveWorkout(null);
          localStorage.removeItem('activeWorkout');
          
          return response;
        } catch (error) {
          console.error('Error updating existing workout history:', error);
          throw error;
        }
      }
      
      // If no historyId, create a new workout history
      const workoutHistoryData = {
        workout_template_id: activeWorkout.workoutId,
        title: activeWorkout.title,
        duration_minutes: durationMinutes,
        notes: notes || '',
        rating: rating,
        exercises: activeWorkout.exercises.map(ex => {
          // Calculate the number of sets from the actual sets array
          const numSets = ex.sets.length;
          // Use the planned reps/weight from the first set (assuming they're similar)
          const firstSet = ex.sets[0];
          
          // Create exercise data without rest_time_seconds field
          const exerciseData = {
            exercise_id: ex.exerciseId,
            sets: numSets,
            reps: firstSet.plannedReps,
            weight: firstSet.plannedWeight,
            notes: '',
            set_details: ex.sets.map(set => ({
              set_number: set.setNumber,
              planned_reps: set.plannedReps,
              planned_weight: set.plannedWeight,
              actual_reps: set.actualReps,
              actual_weight: set.actualWeight,
              rest_time_seconds: set.restTimeSeconds,
              completion_time: set.completionTime,
              duration_seconds: set.durationSeconds
            }))
          };
          
          // Remove rest_time_seconds from exercise level to avoid backend error
          return exerciseData;
        })
      };
      
      console.log('Sending workout completion data:', workoutHistoryData);
      
      try {
        const result = await workoutHistoryAPI.recordWorkout(workoutHistoryData);
        console.log('Workout completion successful:', result);
        
        // Clear active workout
        setActiveWorkout(null);
        localStorage.removeItem('activeWorkout');
        
        return result;
      } catch (apiError: any) {
        console.error('API Error during workout completion:', apiError);
        console.error('Error response:', apiError.response?.data);
        console.error('Error status:', apiError.response?.status);
        console.error('Error headers:', apiError.response?.headers);
        
        // Re-throw to allow the calling component to handle the error
        throw apiError;
      }
    } catch (error) {
      console.error('Error completing workout', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const cancelWorkout = () => {
    setActiveWorkout(null);
    localStorage.removeItem('activeWorkout');
  };

  const markSetCompleted = (exerciseIndex: number, setIndex: number, actualReps?: number, actualWeight?: number) => {
    if (!activeWorkout) {
      console.error('Cannot mark set completed: No active workout');
      return;
    }
    
    console.log(`Marking set ${setIndex + 1} in exercise ${exerciseIndex} as completed`, { actualReps, actualWeight });
    
    setActiveWorkout(prev => {
      if (!prev) {
        console.error('No previous workout state in markSetCompleted');
        return null;
      }
      
      // Create deep copies to ensure proper state updates
      const updatedExercises = JSON.parse(JSON.stringify(prev.exercises));
      const currentSet = updatedExercises[exerciseIndex].sets[setIndex];
      
      // Toggle completion status
      const isCompleted = !currentSet.isCompleted;
      console.log(`Set ${setIndex + 1} completion status changing to:`, isCompleted);
      
      // If completing the set, record completion time and actual values
      let completionTime = currentSet.completionTime;
      let durationSeconds = currentSet.durationSeconds;
      
      if (isCompleted && !currentSet.isCompleted) {
        const currentTime = new Date();
        completionTime = currentTime.toISOString();
        
        // Calculate the duration based on previous set or workout start time
        let referenceTime;
        
        // Check if there are any completed sets in the entire workout
        const hasAnyCompletedSets = updatedExercises.some((exercise: WorkoutExercise) => 
          exercise.sets.some((s: ExerciseSet) => s.isCompleted && s.completionTime)
        );
        
        if (!hasAnyCompletedSets) {
          // If this is the first set completed in the entire workout, use workout start time
          referenceTime = new Date(prev.startTime);
          console.log('First set in workout - using workout start time as reference:', referenceTime);
        } else {
          // Find the most recently completed set across all exercises
          let mostRecentCompletionTime = null;
          let mostRecentExIndex = -1;
          let mostRecentSetIndex = -1;
          
          // Loop through all exercises to find the most recently completed set
          for (let exIdx = 0; exIdx < updatedExercises.length; exIdx++) {
            const exercise = updatedExercises[exIdx];
            for (let setIdx = 0; setIdx < exercise.sets.length; setIdx++) {
              const set = exercise.sets[setIdx];
              if (set.isCompleted && set.completionTime) {
                if (!mostRecentCompletionTime || new Date(set.completionTime) > new Date(mostRecentCompletionTime)) {
                  mostRecentCompletionTime = set.completionTime;
                  mostRecentExIndex = exIdx;
                  mostRecentSetIndex = setIdx;
                }
              }
            }
          }
          
          if (mostRecentCompletionTime) {
            referenceTime = new Date(mostRecentCompletionTime);
            console.log(`Using most recent completed set (Ex: ${mostRecentExIndex+1}, Set: ${mostRecentSetIndex+1}) as reference:`, referenceTime);
          } else {
            // Fall back to workout start time if something went wrong
            referenceTime = new Date(prev.startTime);
            console.log('No previous sets found despite hasAnyCompletedSets=true, using workout start time as reference:', referenceTime);
          }
        }
        
        // Calculate duration in seconds
        durationSeconds = Math.floor((currentTime.getTime() - referenceTime.getTime()) / 1000);
        
        console.log(`Set ${setIndex + 1} completed after ${durationSeconds} seconds`, { 
          referenceTimeISO: referenceTime.toISOString(),
          currentTimeISO: currentTime.toISOString(),
          exerciseIndex,
          setIndex,
          duration: durationSeconds
        });
        
        // Start rest timer for this set
        // Find if there's a next set to do
        let nextSet: { exerciseIndex: number, setIndex: number } | null = null;
        
        // Check if there's another set in current exercise
        if (setIndex + 1 < updatedExercises[exerciseIndex].sets.length) {
          nextSet = { exerciseIndex, setIndex: setIndex + 1 };
        } else if (exerciseIndex + 1 < updatedExercises.length) {
          // If no more sets in current exercise, move to next exercise
          nextSet = { exerciseIndex: exerciseIndex + 1, setIndex: 0 };
        }
        
        // If we found a next set, start rest timer for it
        if (nextSet) {
          // Get rest time for the current set
          const restTimeForSet = currentSet.restTimeSeconds || 60; // Default to 60 seconds
          
          // Reset any rest timers in the next set
          const nextExerciseSet = updatedExercises[nextSet.exerciseIndex].sets[nextSet.setIndex];
          nextExerciseSet.restTimerActive = true;
          nextExerciseSet.restTimeElapsed = 0;
          
          console.log(`Starting rest timer for next set (${nextSet.exerciseIndex}, ${nextSet.setIndex}) with ${restTimeForSet} seconds`);
        }
      } else if (!isCompleted) {
        // If un-completing, clear these values
        completionTime = undefined;
        durationSeconds = undefined;
        console.log(`Uncompleted set ${setIndex + 1}`);
      }
      
      // Update the set with new values
      updatedExercises[exerciseIndex].sets[setIndex] = {
        ...currentSet,
        isCompleted,
        completionTime,
        durationSeconds,
        actualReps: isCompleted ? (actualReps !== undefined ? actualReps : currentSet.plannedReps) : undefined,
        actualWeight: isCompleted ? (actualWeight !== undefined ? actualWeight : currentSet.plannedWeight) : undefined,
        // Clear rest timer when set is completed
        restTimerActive: isCompleted ? false : currentSet.restTimerActive
      };
      
      console.log('Updated set:', updatedExercises[exerciseIndex].sets[setIndex]);
      
      const updatedWorkout = {
        ...prev,
        exercises: updatedExercises
      };
      
      // Save to localStorage
      localStorage.setItem('activeWorkout', JSON.stringify(updatedWorkout));
      console.log('Updated workout saved to localStorage');
      
      // If this is a workout from a history entry (has a historyId), update the backend immediately
      if (prev.historyId && isCompleted) {
        console.log('Saving set completion to backend immediately');
        const updatedSet = updatedExercises[exerciseIndex].sets[setIndex];
        
        // Save to backend asynchronously - we don't need to await this
        workoutHistoryAPI.updateSetCompletion(
          prev.historyId,
          exerciseIndex,
          {
            set_number: updatedSet.setNumber,
            actual_reps: updatedSet.actualReps,
            actual_weight: updatedSet.actualWeight,
            completion_time: updatedSet.completionTime,
            duration_seconds: updatedSet.durationSeconds
          }
        ).then(result => {
          console.log('Set completion data saved to backend:', result);
        }).catch(error => {
          console.error('Error saving set completion data to backend:', error);
        });
      } else if (!prev.historyId && isCompleted) {
        // If we're starting a new workout (not from history) and marking a set as completed,
        // we should first convert it to a history entry
        const startNewWorkoutHistory = async () => {
          try {
            // Create a new workout history entry
            if (prev.workoutId) {
              console.log('Creating workout history from template');
              // If this is from a scheduled workout
              if (prev.scheduledWorkoutId) {
                const result = await scheduledWorkoutAPI.startWorkout(prev.scheduledWorkoutId);
                console.log('Started workout from scheduled workout:', result);
                
                // Update the active workout with the history ID
                const historyId = result.id;
                setActiveWorkout({
                  ...updatedWorkout,
                  historyId
                });
                
                // Update this specific set completion in the backend
                const updatedSet = updatedExercises[exerciseIndex].sets[setIndex];
                await workoutHistoryAPI.updateSetCompletion(
                  historyId,
                  exerciseIndex,
                  {
                    set_number: updatedSet.setNumber,
                    actual_reps: updatedSet.actualReps,
                    actual_weight: updatedSet.actualWeight,
                    completion_time: updatedSet.completionTime,
                    duration_seconds: updatedSet.durationSeconds
                  }
                );
              } else {
                // Create a new workout history manually
                const tempHistoryData = {
                  workout_template_id: prev.workoutId,
                  title: prev.title,
                  duration_minutes: Math.ceil(prev.elapsedTimeInSeconds / 60),
                  notes: '',
                  exercises: prev.exercises.map(ex => {
                    return {
                      exercise_id: ex.exerciseId,
                      sets: ex.sets.length,
                      reps: ex.sets[0].plannedReps,
                      weight: ex.sets[0].plannedWeight,
                      notes: '',
                      set_details: ex.sets.map(set => ({
                        set_number: set.setNumber,
                        planned_reps: set.plannedReps,
                        planned_weight: set.plannedWeight,
                        actual_reps: undefined,
                        actual_weight: undefined,
                        rest_time_seconds: set.restTimeSeconds,
                        completion_time: undefined,
                        duration_seconds: undefined
                      }))
                    };
                  })
                };
                
                const result = await workoutHistoryAPI.recordWorkout(tempHistoryData);
                console.log('Created new workout history:', result);
                
                // Update the active workout with the history ID
                const historyId = result.id;
                setActiveWorkout({
                  ...updatedWorkout,
                  historyId
                });
                
                // Update this specific set completion in the backend
                const updatedSet = updatedExercises[exerciseIndex].sets[setIndex];
                await workoutHistoryAPI.updateSetCompletion(
                  historyId,
                  exerciseIndex,
                  {
                    set_number: updatedSet.setNumber,
                    actual_reps: updatedSet.actualReps,
                    actual_weight: updatedSet.actualWeight,
                    completion_time: updatedSet.completionTime,
                    duration_seconds: updatedSet.durationSeconds
                  }
                );
              }
            }
          } catch (error) {
            console.error('Error creating workout history:', error);
          }
        };
        
        // Execute the async function
        startNewWorkoutHistory();
      }
      
      // Debug check
      setTimeout(() => {
        const savedWorkout = localStorage.getItem('activeWorkout');
        if (savedWorkout) {
          const parsedWorkout = JSON.parse(savedWorkout);
          console.log('Verifying localStorage save:', 
            parsedWorkout.exercises[exerciseIndex].sets[setIndex].isCompleted,
            parsedWorkout.exercises[exerciseIndex].sets[setIndex].durationSeconds
          );
        }
      }, 50);
      
      return updatedWorkout;
    });
  };

  const getElapsedTime = () => {
    if (!activeWorkout) return { minutes: 0, seconds: 0 };
    
    const totalSeconds = activeWorkout.elapsedTimeInSeconds;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return { minutes, seconds };
  };

  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Function to get remaining rest time for a set
  const getRestTimeRemaining = (exerciseIndex: number, setIndex: number): number => {
    if (!activeWorkout) return 0;
    
    try {
      const set = activeWorkout.exercises[exerciseIndex].sets[setIndex];
      if (!set.restTimerActive || set.restTimeElapsed === undefined) return 0;
      
      const totalRestTime = set.restTimeSeconds || 60; // Default to 60 seconds
      const remainingTime = Math.max(0, totalRestTime - set.restTimeElapsed);
      return remainingTime;
    } catch (error) {
      console.error('Error calculating rest time remaining', error);
      return 0;
    }
  };

  const value = {
    activeWorkout,
    isLoading,
    startWorkout,
    resumeWorkout,
    completeWorkout,
    cancelWorkout,
    markSetCompleted,
    getElapsedTime,
    isPaused,
    togglePause,
    getRestTimeRemaining
  };

  return (
    <WorkoutTrackingContext.Provider value={value}>
      {children}
    </WorkoutTrackingContext.Provider>
  );
}; 