import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  useTheme,
  useMediaQuery,
  IconButton,
  Checkbox,
  FormControlLabel,
  Collapse,
  Stack,
  Tooltip,
  Badge
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import TimerIcon from '@mui/icons-material/Timer';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import DoneIcon from '@mui/icons-material/Done';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';

import { useWorkoutTracking } from '../context/WorkoutTrackingContext';

const WorkoutTrackerPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const {
    activeWorkout,
    isLoading,
    completeWorkout,
    cancelWorkout,
    markSetCompleted,
    getElapsedTime,
    isPaused,
    togglePause,
    getRestTimeRemaining
  } = useWorkoutTracking();
  
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  
  // Debug info
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  
  // Track last workout update
  const workoutRef = useRef(activeWorkout);
  const [, forceUpdate] = useState({});
  
  const [showSetDetailsDialog, setShowSetDetailsDialog] = useState(false);
  const [activeSetDetails, setActiveSetDetails] = useState<{
    exerciseIndex: number;
    setIndex: number;
    actualReps?: number;
    actualWeight?: number;
  } | null>(null);
  
  // First run effect - only runs once on mount
  useEffect(() => {
    console.log('WorkoutTrackerPage mounted, activeWorkout:', activeWorkout);
    
    if (!activeWorkout) {
      console.log('No active workout found, checking localStorage...');
      const savedWorkout = localStorage.getItem('activeWorkout');
      
      if (savedWorkout) {
        try {
          const parsedWorkout = JSON.parse(savedWorkout);
          console.log('Found workout in localStorage:', parsedWorkout);
          setDebugInfo('Found workout in localStorage but not in context. Please refresh.');
        } catch (e) {
          console.error('Error parsing saved workout:', e);
          setDebugInfo('Error parsing saved workout: ' + e);
        }
      } else {
        console.log('No workout found in localStorage either');
        setDebugInfo('No workout found in localStorage either');
      }
    }
    
    // Add debug keyboard shortcut
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setShowDebugPanel(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array means this runs once on mount
  
  // Update local ref when activeWorkout changes
  useEffect(() => {
    workoutRef.current = activeWorkout;
  }, [activeWorkout]);
  
  // Utility function to format seconds as MM:SS
  const formatTimeMMSS = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Update UI more frequently for rest timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeWorkout && !isPaused) {
        forceUpdate({});
      }
    }, 500);
    
    return () => clearInterval(interval);
  }, [activeWorkout, isPaused]);
  
  if (!activeWorkout) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="info">
          No active workout. Start a workout from the workouts page.
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/workouts')}
          >
            Go to Workouts
          </Button>
        </Box>
        {process.env.NODE_ENV === 'development' && (
          <Paper sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5' }}>
            <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
              {debugInfo}
            </Typography>
          </Paper>
        )}
      </Box>
    );
  }
  
  const { minutes, seconds } = getElapsedTime();
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  const totalSetsCompleted = activeWorkout.exercises.reduce(
    (total: number, exercise: any) => total + exercise.sets.filter((set: any) => set.isCompleted).length, 0
  );
  
  const totalSets = activeWorkout.exercises.reduce(
    (total: number, exercise: any) => total + exercise.sets.length, 0
  );
  
  const progress = totalSets > 0 ? (totalSetsCompleted / totalSets) * 100 : 0;
  
  const handleComplete = () => {
    setShowCompleteDialog(true);
  };
  
  const handleConfirmComplete = async () => {
    const result = await completeWorkout(notes, rating || undefined);
    if (result) {
      setShowCompleteDialog(false);
      navigate(`/history/${result.id}`);
    }
  };
  
  const handleCancelWorkout = () => {
    setShowCancelDialog(true);
  };
  
  const handleConfirmCancel = () => {
    cancelWorkout();
    setShowCancelDialog(false);
    navigate('/dashboard');
  };
  
  // Helper function to get current set state directly from localStorage if available
  const getCurrentSetState = (exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) return null;
    
    try {
      // First try reading from localStorage
      const savedWorkout = localStorage.getItem('activeWorkout');
      if (savedWorkout) {
        const parsed = JSON.parse(savedWorkout);
        if (parsed?.exercises?.[exerciseIndex]?.sets?.[setIndex]) {
          return parsed.exercises[exerciseIndex].sets[setIndex];
        }
      }
    } catch (e) {
      console.error('Error accessing localStorage in getCurrentSetState', e);
    }
    
    // Fallback to active workout from context
    return activeWorkout.exercises[exerciseIndex]?.sets?.[setIndex] || null;
  };
  
  const handleSetClick = (exerciseIndex: number, setIndex: number) => {
    if (!activeWorkout) {
      console.error('No active workout in handleSetClick');
      return;
    }
    
    // Get the most current state of the set
    const currentSet = getCurrentSetState(exerciseIndex, setIndex);
    if (!currentSet) {
      console.error('Set not found', { exerciseIndex, setIndex });
      return;
    }
    
    console.log('Set clicked:', { exerciseIndex, setIndex, currentSet });
    
    if (currentSet.isCompleted) {
      // Simply toggle completion if already completed
      console.log('Toggling completed set');
      markSetCompleted(exerciseIndex, setIndex);
      // Force update immediately to refresh UI
      setTimeout(() => forceUpdate({}), 100);
    } else {
      // Show dialog to enter details if not completed
      console.log('Opening set details dialog');
      setActiveSetDetails({
        exerciseIndex,
        setIndex,
        actualReps: currentSet.plannedReps,
        actualWeight: currentSet.plannedWeight
      });
      setShowSetDetailsDialog(true);
    }
  };
  
  const handleConfirmSetDetails = () => {
    if (!activeSetDetails) return;
    
    // Close dialog first to prevent re-rendering issues
    setShowSetDetailsDialog(false);
    
    // Get values before clearing the state
    const { exerciseIndex, setIndex, actualReps, actualWeight } = activeSetDetails;
    
    // Clear state
    setActiveSetDetails(null);
    
    // Then update the workout
    markSetCompleted(exerciseIndex, setIndex, actualReps, actualWeight);
    
    // Force update after a small delay to ensure the context has been updated
    setTimeout(() => {
      forceUpdate({});
      console.log('UI updated after set completion');
    }, 100);
  };
  
  const handleSkipSetDetails = () => {
    if (!activeSetDetails) return;
    
    // Close dialog first to prevent re-rendering issues
    setShowSetDetailsDialog(false);
    
    // Get values before clearing the state
    const { exerciseIndex, setIndex } = activeSetDetails;
    
    // Clear state
    setActiveSetDetails(null);
    
    // Then update the workout
    markSetCompleted(exerciseIndex, setIndex);
    
    // Force update after a small delay to ensure the context has been updated
    setTimeout(() => {
      forceUpdate({});
      console.log('UI updated after set completion (skipped details)');
    }, 100);
  };
  
  return (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          edge="start" 
          color="inherit" 
          onClick={() => navigate(-1)} 
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Workout Tracker
        </Typography>
        
        {/* Quick refresh button */}
        <IconButton
          color="primary"
          onClick={() => {
            console.log('Manual refresh triggered');
            forceUpdate({});
            setTimeout(() => forceUpdate({}), 100);
          }}
          sx={{ ml: 'auto' }}
          size="small"
        >
          <RefreshIcon />
        </IconButton>
      </Box>
      
      {/* Timer and Controls */}
      <Paper sx={{ p: 3, mb: 3, position: 'relative', overflow: 'hidden' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h3" component="div" color="primary" gutterBottom sx={{ fontWeight: 'bold' }}>
                {formattedTime}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {isPaused ? 'Paused' : 'Running'}
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom>
                {activeWorkout.title}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={progress} 
                  sx={{ width: '100%', height: 10, borderRadius: 5 }} 
                />
              </Box>
              <Typography variant="body2">
                {totalSetsCompleted} of {totalSets} sets completed ({Math.round(progress)}%)
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Box sx={{ 
              display: 'flex', 
              gap: 1, 
              justifyContent: 'center',
              flexWrap: isMobile ? 'wrap' : 'nowrap' 
            }}>
              <Button
                variant="outlined"
                startIcon={isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                onClick={togglePause}
                disabled={isLoading}
                fullWidth={isMobile}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              
              <Button
                variant="contained"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleComplete}
                disabled={isLoading}
                fullWidth={isMobile}
              >
                Finish
              </Button>
              
              <Button
                variant="text"
                color="inherit"
                onClick={handleCancelWorkout}
                disabled={isLoading}
                fullWidth={isMobile}
              >
                Cancel
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Exercise List */}
      <Typography variant="h6" gutterBottom>
        Exercises
      </Typography>
      
      <Paper>
        <List disablePadding>
          {activeWorkout.exercises.map((exercise: any, exerciseIndex: number) => (
            <React.Fragment key={exerciseIndex}>
              {exerciseIndex > 0 && <Divider />}
              <ListItem
                alignItems="flex-start"
                sx={{ 
                  flexDirection: 'column',
                  py: 2
                }}
              >
                <Box sx={{ width: '100%', mb: 1 }}>
                  <Typography variant="subtitle1">
                    {exercise.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {exercise.sets.length} sets
                  </Typography>
                </Box>
                
                <Box sx={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 1, 
                  width: '100%',
                  mt: 1
                }}>
                  {exercise.sets.map((set: any, setIndex: number) => {
                    // Try to get most current state from localStorage
                    const currentSetState = getCurrentSetState(exerciseIndex, setIndex) || set;
                    
                    // Get rest timer for this set
                    const restTimeRemaining = getRestTimeRemaining(exerciseIndex, setIndex);
                    const hasActiveRestTimer = restTimeRemaining > 0;
                    
                    return (
                      <Chip
                        key={setIndex}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography variant="caption">Set {currentSetState.setNumber}</Typography>
                            {currentSetState.isCompleted && (
                              <Typography variant="caption" sx={{ ml: 0.5, fontWeight: currentSetState.durationSeconds ? 'bold' : 'normal' }}>
                                ({currentSetState.actualReps !== undefined ? currentSetState.actualReps : currentSetState.plannedReps} × {currentSetState.actualWeight !== undefined ? currentSetState.actualWeight : (currentSetState.plannedWeight || 0)}kg
                                {typeof currentSetState.durationSeconds === 'number' ? 
                                  ` • ${Math.floor(currentSetState.durationSeconds / 60)}:${(currentSetState.durationSeconds % 60).toString().padStart(2, '0')}` : 
                                  ''}
                                )
                              </Typography>
                            )}
                            {!currentSetState.isCompleted && (
                              <Typography variant="caption" sx={{ ml: 0.5 }}>
                                ({currentSetState.plannedReps} × {currentSetState.plannedWeight || 0}kg)
                              </Typography>
                            )}
                            {hasActiveRestTimer && (
                              <Box component="span" sx={{ 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                ml: 0.5,
                                color: restTimeRemaining < 3 ? 'error.main' : restTimeRemaining < 10 ? 'warning.main' : 'success.main'
                              }}>
                                <HourglassEmptyIcon fontSize="small" sx={{ mr: 0.5 }} />
                                {formatTimeMMSS(restTimeRemaining)}
                              </Box>
                            )}
                          </Box>
                        }
                        color={currentSetState.isCompleted ? "success" : hasActiveRestTimer ? "warning" : "default"}
                        variant={currentSetState.isCompleted ? "filled" : "outlined"}
                        onClick={() => handleSetClick(exerciseIndex, setIndex)}
                        icon={currentSetState.isCompleted ? <DoneIcon /> : undefined}
                        sx={{ 
                          minWidth: '100px',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            backgroundColor: currentSetState.isCompleted ? theme.palette.success.main : theme.palette.action.hover,
                            opacity: 0.9
                          },
                          ...(hasActiveRestTimer && {
                            animation: 'pulse 1.5s infinite',
                            '@keyframes pulse': {
                              '0%': { boxShadow: '0 0 0 0 rgba(255, 153, 0, 0.4)' },
                              '70%': { boxShadow: '0 0 0 10px rgba(255, 153, 0, 0)' },
                              '100%': { boxShadow: '0 0 0 0 rgba(255, 153, 0, 0)' }
                            }
                          })
                        }}
                      />
                    );
                  })}
                </Box>
                
                {/* Rest timer indication */}
                {exercise.sets.some((set: any) => set.restTimeSeconds) && (
                  <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
                    <TimerIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      Rest between sets: {exercise.sets[0].restTimeSeconds || 60}s
                    </Typography>
                  </Box>
                )}
                
                {/* Show active rest timer for this exercise */}
                {exercise.sets.some((set: any, idx: number) => getRestTimeRemaining(exerciseIndex, idx) > 0) && (
                  <Box sx={{ 
                    mt: 2, 
                    p: 1, 
                    bgcolor: 'warning.light', 
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <HourglassEmptyIcon sx={{ mr: 1, color: 'warning.dark' }} />
                    <Typography variant="body2" fontWeight="bold">
                      {exercise.sets.map((set: any, idx: number) => {
                        const restTime = getRestTimeRemaining(exerciseIndex, idx);
                        if (restTime > 0) {
                          return `Rest Period: ${formatTimeMMSS(restTime)} remaining for Set ${set.setNumber}`;
                        }
                        return null;
                      }).filter(Boolean)[0]}
                    </Typography>
                  </Box>
                )}
              </ListItem>
            </React.Fragment>
          ))}
        </List>
      </Paper>
      
      {/* Set Details Dialog */}
      <Dialog
        open={showSetDetailsDialog}
        onClose={() => setShowSetDetailsDialog(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Complete Set</DialogTitle>
        <DialogContent>
          {activeSetDetails && activeWorkout && (
            <Box sx={{ pt: 1 }}>
              <Typography gutterBottom>
                {activeWorkout.exercises[activeSetDetails.exerciseIndex].name} - Set {activeWorkout.exercises[activeSetDetails.exerciseIndex].sets[activeSetDetails.setIndex].setNumber}
              </Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <TextField
                    label="Actual Reps"
                    type="number"
                    fullWidth
                    value={activeSetDetails.actualReps || ''}
                    onChange={(e) => setActiveSetDetails({
                      ...activeSetDetails,
                      actualReps: e.target.value === '' ? undefined : parseInt(e.target.value)
                    })}
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <TextField
                    label="Actual Weight (kg)"
                    type="number"
                    fullWidth
                    value={activeSetDetails.actualWeight || ''}
                    onChange={(e) => setActiveSetDetails({
                      ...activeSetDetails,
                      actualWeight: e.target.value === '' ? undefined : parseFloat(e.target.value)
                    })}
                    InputProps={{ inputProps: { min: 0, step: 0.5 } }}
                  />
                </Grid>
              </Grid>
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                Planned: {activeWorkout.exercises[activeSetDetails.exerciseIndex].sets[activeSetDetails.setIndex].plannedReps} reps
                {activeWorkout.exercises[activeSetDetails.exerciseIndex].sets[activeSetDetails.setIndex].plannedWeight && 
                  ` at ${activeWorkout.exercises[activeSetDetails.exerciseIndex].sets[activeSetDetails.setIndex].plannedWeight} kg`
                }
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowSetDetailsDialog(false)}>Cancel</Button>
          <Button onClick={handleSkipSetDetails}>Skip Details</Button>
          <Button 
            onClick={handleConfirmSetDetails} 
            variant="contained" 
            color="primary"
          >
            Complete Set
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Complete Workout Dialog */}
      <Dialog
        open={showCompleteDialog}
        onClose={() => setShowCompleteDialog(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="complete-workout-dialog-title"
      >
        <DialogTitle id="complete-workout-dialog-title">Complete Workout</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography>How would you rate this workout?</Typography>
            <Rating
              value={rating}
              onChange={(_, newValue) => setRating(newValue)}
              size="large"
              sx={{ alignSelf: 'center', mb: 1 }}
            />
            
            <TextField
              label="Notes (optional)"
              multiline
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              placeholder="How did you feel? What went well? What could be improved?"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCompleteDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleConfirmComplete} 
            variant="contained" 
            color="primary"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : 'Complete Workout'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Cancel Workout Dialog */}
      <Dialog
        open={showCancelDialog}
        onClose={() => setShowCancelDialog(false)}
        aria-labelledby="cancel-workout-dialog-title"
      >
        <DialogTitle id="cancel-workout-dialog-title">Cancel Workout?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this workout? Your progress will be lost.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCancelDialog(false)}>No, Keep Workout</Button>
          <Button 
            onClick={handleConfirmCancel} 
            variant="contained" 
            color="error"
          >
            Yes, Cancel Workout
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Debug Panel - Press Ctrl+Shift+D to toggle */}
      {showDebugPanel && (
        <Paper sx={{ p: 2, my: 2, bgcolor: '#f5f5f5' }}>
          <Typography variant="h6" gutterBottom>Debug Panel</Typography>
          <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
            {debugInfo || 'No debug info'}
            
            Active Workout: {activeWorkout ? 'YES' : 'NO'}
            
            {activeWorkout && (
              `\nWorkout ID: ${activeWorkout.workoutId}
              \nTitle: ${activeWorkout.title}
              \nStart Time: ${new Date(activeWorkout.startTime).toLocaleString()}
              \nExercises: ${activeWorkout.exercises.length}
              \nElapsed Time: ${activeWorkout.elapsedTimeInSeconds}s
              \nTotal Sets Completed: ${totalSetsCompleted} of ${totalSets}
              \nProgress: ${Math.round(progress)}%
              \n
              \nExercise Completion Status:
              ${activeWorkout.exercises.map((ex, i) => 
                `\n${ex.name}: ${ex.sets.filter(s => s.isCompleted).length}/${ex.sets.length} sets completed
                ${ex.sets.map((s, j) => 
                  `\n  Set ${s.setNumber}: ${s.isCompleted ? 'DONE' : 'PENDING'}${
                    s.isCompleted && s.durationSeconds 
                    ? ` (${Math.floor(s.durationSeconds / 60)}:${(s.durationSeconds % 60).toString().padStart(2, '0')})` 
                    : ''
                  }`
                ).join('')}`
              ).join('\n')}`
            )}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => forceUpdate({})}
              sx={{ mr: 1 }}
            >
              Force Refresh
            </Button>
            <Button 
              variant="outlined" 
              size="small"
              onClick={() => navigate('/workout-test')}
            >
              Go to Test Page
            </Button>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default WorkoutTrackerPage; 