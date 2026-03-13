import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Box,
  IconButton,
  Typography,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Workout, ScheduledWorkoutCreate } from '../../interfaces';
import { scheduledWorkoutAPI } from '../../services/api';
import ScheduleWorkoutForm from './ScheduleWorkoutForm';

interface ScheduleModalProps {
  workout: Workout | null;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * A reusable schedule modal component that can be used anywhere in the system
 * to schedule a workout.
 */
const ScheduleModal: React.FC<ScheduleModalProps> = ({
  workout,
  open,
  onClose,
  onSuccess
}) => {
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClose = () => {
    // Reset state when closing
    setSuccess(false);
    setError(null);
    onClose();
  };

  const handleSubmit = async (scheduledWorkout: ScheduledWorkoutCreate) => {
    setLoading(true);
    setError(null);
    
    try {
      // Submit the scheduled workout
      await scheduledWorkoutAPI.scheduleWorkout(scheduledWorkout);
      
      // Show success state
      setSuccess(true);
      
      // Call the onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Error scheduling workout:', error);
      setError(error.response?.data?.detail || 'Error scheduling workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
    >
      {!success ? (
        <>
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">
                Schedule {workout?.title ? `"${workout.title}"` : 'Workout'}
              </Typography>
              <IconButton onClick={handleClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
                <CircularProgress />
              </Box>
            )}
            {workout && !loading && (
              <ScheduleWorkoutForm
                workout={workout}
                onSubmit={handleSubmit}
                onClose={handleClose}
                open={open}
              />
            )}
          </DialogContent>
        </>
      ) : (
        <>
          <DialogTitle>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="h6">Workout Scheduled</Typography>
              <IconButton onClick={handleClose} size="small">
                <CloseIcon />
              </IconButton>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Alert severity="success" sx={{ my: 2 }}>
              Your workout has been scheduled successfully!
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Close</Button>
          </DialogActions>
        </>
      )}
    </Dialog>
  );
};

export default ScheduleModal; 