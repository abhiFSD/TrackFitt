import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  CircularProgress,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Rating,
  useMediaQuery,
  useTheme
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TimerIcon from '@mui/icons-material/Timer';

import { useWorkoutTracking } from '../../context/WorkoutTrackingContext';

const ActiveWorkoutTracker: React.FC = () => {
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
    togglePause
  } = useWorkoutTracking();
  
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  
  if (!activeWorkout) return null;
  
  const { minutes, seconds } = getElapsedTime();
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const totalSetsCompleted = activeWorkout.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter(set => set.isCompleted).length, 0
  );
  
  const totalSets = activeWorkout.exercises.reduce(
    (total, exercise) => total + exercise.sets.length, 0
  );
  
  const progress = totalSets > 0 ? (totalSetsCompleted / totalSets) * 100 : 0;

  const handleViewDetails = () => {
    navigate('/workout-tracker');
  };

  const handleComplete = async () => {
    setShowCompleteDialog(true);
  };

  const handleConfirmComplete = async () => {
    const result = await completeWorkout(notes, rating || undefined);
    if (result) {
      setShowCompleteDialog(false);
      navigate(`/history/${result.id}`);
    }
  };

  const handleCancelComplete = () => {
    setShowCompleteDialog(false);
  };

  return (
    <>
      <Paper 
        sx={{ 
          p: 2, 
          mb: 3, 
          border: '1px solid',
          borderColor: 'primary.main',
          boxShadow: 3
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: 1
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FitnessCenterIcon color="primary" />
              <Typography variant="h6" component="div" color="primary" noWrap sx={{ maxWidth: isMobile ? '180px' : '300px' }}>
                {activeWorkout.title}
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1,
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'flex-end' : 'flex-end',
              mt: isMobile ? 1 : 0
            }}>
              <Chip
                icon={<TimerIcon />}
                label={formattedTime}
                color="primary"
                variant="outlined"
                sx={{ fontWeight: 'bold', fontSize: '1rem' }}
              />
            </Box>
          </Box>
          
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: 1,
            mt: 1 
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2">
                Progress: {totalSetsCompleted}/{totalSets} sets ({Math.round(progress)}%)
              </Typography>
            </Box>
            
            <Box sx={{ 
              display: 'flex', 
              gap: 1,
              width: isMobile ? '100%' : 'auto',
              justifyContent: isMobile ? 'space-between' : 'flex-end',
              mt: isMobile ? 1 : 0
            }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                onClick={togglePause}
                disabled={isLoading}
              >
                {isPaused ? 'Resume' : 'Pause'}
              </Button>
              
              <Button
                variant="contained"
                size="small"
                color="primary"
                onClick={handleViewDetails}
                disabled={isLoading}
              >
                View Details
              </Button>
              
              <Button
                variant="contained"
                size="small"
                color="error"
                startIcon={<StopIcon />}
                onClick={handleComplete}
                disabled={isLoading}
              >
                Finish
              </Button>
            </Box>
          </Box>
        </Box>
      </Paper>
      
      {/* Complete Workout Dialog */}
      <Dialog
        open={showCompleteDialog}
        onClose={handleCancelComplete}
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
          <Button onClick={handleCancelComplete}>Cancel</Button>
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
    </>
  );
};

export default ActiveWorkoutTracker; 