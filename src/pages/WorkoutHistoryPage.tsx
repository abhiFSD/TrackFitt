import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import { workoutHistoryAPI } from '../services/api';
import { WorkoutHistory } from '../interfaces';
import { format } from 'date-fns';

const WorkoutHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([]);

  useEffect(() => {
    loadWorkoutHistory();
  }, []);

  const loadWorkoutHistory = async () => {
    try {
      setLoading(true);
      const history = await workoutHistoryAPI.getWorkoutHistory();
      setWorkoutHistory(history);
    } catch (error) {
      console.error('Error loading workout history:', error);
      setError('Failed to load workout history. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Workout History
      </Typography>

      <Grid container spacing={3}>
        {workoutHistory.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You haven't completed any workouts yet.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/workouts')}
              >
                Start a Workout
              </Button>
            </Paper>
          </Grid>
        ) : (
          workoutHistory.map((workout) => (
            <Grid item xs={12} md={6} lg={4} key={workout.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {workout.title}
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Chip 
                      label={`Rating: ${workout.rating || 'N/A'}`} 
                      size="small" 
                      color={workout.rating && workout.rating > 3 ? "success" : "default"}
                      sx={{ mr: 1 }}
                    />
                    <Chip 
                      label={`${workout.duration_minutes} min`} 
                      size="small" 
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Completed on {format(new Date(workout.date_completed), 'PPP p')}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">
                    Exercises: {workout.exercises.length}
                  </Typography>
                  {workout.notes && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {workout.notes}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/history/${workout.id}`)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
    </Box>
  );
};

export default WorkoutHistoryPage; 