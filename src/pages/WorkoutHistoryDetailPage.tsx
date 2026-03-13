import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Paper,
  Divider,
  CircularProgress,
  Alert,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  Rating,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  LinearProgress,
} from '@mui/material';
import { format } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TimelineIcon from '@mui/icons-material/Timeline';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import { workoutHistoryAPI } from '../services/api';
import { WorkoutHistory } from '../interfaces';

const WorkoutHistoryDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workout, setWorkout] = useState<WorkoutHistory | null>(null);
  const [stats, setStats] = useState<{
    totalSets: number;
    completedSets: number;
    totalPlannedReps: number;
    totalActualReps: number;
    totalPlannedWeight: number;
    totalActualWeight: number;
    avgSetDuration: number;
  } | null>(null);

  useEffect(() => {
    if (id) {
      loadWorkoutDetail(parseInt(id));
    }
  }, [id]);

  const loadWorkoutDetail = async (workoutId: number) => {
    try {
      setLoading(true);
      const data = await workoutHistoryAPI.getWorkoutHistoryEntry(workoutId);
      console.log('API Response - Workout History:', data);
      console.log('Exercises:', data.exercises);
      
      if (data.exercises && data.exercises.length > 0) {
        console.log('First exercise set_details:', data.exercises[0].set_details);
      }
      
      setWorkout(data);
      
      // Calculate workout statistics
      if (data) {
        let totalSets = 0;
        let completedSets = 0;
        let totalPlannedReps = 0;
        let totalActualReps = 0;
        let totalPlannedWeight = 0;
        let totalActualWeight = 0;
        let totalDuration = 0;
        let setsWithDuration = 0;
        
        data.exercises.forEach((exercise, idx) => {
          console.log(`Processing exercise ${idx + 1}:`, exercise.exercise.name);
          if (exercise.set_details && exercise.set_details.length > 0) {
            console.log(`Found ${exercise.set_details.length} sets for ${exercise.exercise.name}`);
            exercise.set_details.forEach((set, setIdx) => {
              console.log(`Set ${setIdx + 1}:`, set);
              totalSets++;
              totalPlannedReps += set.planned_reps || 0;
              totalPlannedWeight += set.planned_weight || 0;
              
              if (set.actual_reps !== null && set.actual_reps !== undefined) {
                completedSets++;
                totalActualReps += set.actual_reps;
                console.log(`Found completed set: ${set.actual_reps} reps`);
              }
              
              if (set.actual_weight !== null && set.actual_weight !== undefined) {
                totalActualWeight += set.actual_weight;
              }
              
              if (set.duration_seconds) {
                totalDuration += set.duration_seconds;
                setsWithDuration++;
                console.log(`Set has duration: ${set.duration_seconds} seconds`);
              }
            });
          } else {
            console.log(`No set details found for ${exercise.exercise.name}`);
          }
        });
        
        console.log('Stats calculation results:', {
          totalSets,
          completedSets,
          totalPlannedReps,
          totalActualReps,
          totalPlannedWeight,
          totalActualWeight,
          avgSetDuration: setsWithDuration > 0 ? totalDuration / setsWithDuration : 0
        });
        
        setStats({
          totalSets,
          completedSets,
          totalPlannedReps,
          totalActualReps,
          totalPlannedWeight,
          totalActualWeight,
          avgSetDuration: setsWithDuration > 0 ? totalDuration / setsWithDuration : 0
        });
      }
    } catch (error) {
      console.error('Error loading workout history detail:', error);
      setError('Failed to load workout details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Check if we have any valid tracking data
  const hasTrackingData = workout?.exercises.some(ex => 
    ex.set_details && ex.set_details.some(set => 
      set.actual_reps !== null && set.actual_reps !== undefined));

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
        <Button 
          variant="outlined" 
          sx={{ mt: 2 }} 
          onClick={() => navigate('/history')}
        >
          Back to History
        </Button>
      </Box>
    );
  }

  if (!workout) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">Workout not found.</Alert>
        <Button 
          variant="outlined" 
          sx={{ mt: 2 }} 
          onClick={() => navigate('/history')}
        >
          Back to History
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton 
          edge="start" 
          color="inherit" 
          onClick={() => navigate('/history')} 
          sx={{ mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h5" component="h1">
          Workout Details
        </Typography>
      </Box>

      {!hasTrackingData && (
        <Alert severity="info" sx={{ mb: 2 }}>
          This workout has no tracking data. Sets may not have been properly marked as completed during the workout.
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {workout.title}
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Chip 
            icon={<AccessTimeIcon />} 
            label={`${workout.duration_minutes} minutes`} 
            variant="outlined" 
          />
          <Chip 
            icon={<FitnessCenterIcon />} 
            label={`${workout.exercises.length} exercises`} 
            variant="outlined" 
          />
          {stats && stats.totalSets > 0 && (
            <Chip 
              icon={<TimelineIcon />} 
              label={`${stats.completedSets}/${stats.totalSets} sets completed`} 
              variant="outlined" 
              color="primary"
            />
          )}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
            <Typography variant="body2" sx={{ mr: 1 }}>
              Rating:
            </Typography>
            <Rating 
              value={workout.rating || 0} 
              readOnly 
              size="small" 
            />
          </Box>
        </Box>
        
        <Typography variant="body1" sx={{ mb: 2 }}>
          Completed on {format(new Date(workout.date_completed), 'PPP p')}
        </Typography>
        
        {stats && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center' }}>
              <QueryStatsIcon sx={{ mr: 1 }} /> Workout Statistics
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">Completion Rate</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      <Typography variant="h6" sx={{ mr: 1 }}>
                        {Math.round((stats.completedSets / stats.totalSets) * 100)}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(stats.completedSets / stats.totalSets) * 100}
                      sx={{ height: 8, borderRadius: 1 }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">Total Volume</Typography>
                    <Typography variant="h6">
                      {stats.totalActualReps && stats.totalActualWeight ? 
                        (stats.totalActualReps * stats.totalActualWeight).toFixed(1) : 0} kg
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stats.totalActualReps} reps × {stats.completedSets ? 
                        Math.round(stats.totalActualWeight / stats.completedSets) : 0} kg avg
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">Avg Set Duration</Typography>
                    <Typography variant="h6">
                      {formatTime(Math.round(stats.avgSetDuration))}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      per set
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">Planned vs Actual</Typography>
                    <Typography variant="h6">
                      {Math.round((stats.totalActualReps / stats.totalPlannedReps) * 100)}%
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stats.totalActualReps} of {stats.totalPlannedReps} planned reps
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        )}
        
        {workout.notes && (
          <Box sx={{ mt: 2, mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Notes:
            </Typography>
            <Typography variant="body2">
              {workout.notes}
            </Typography>
          </Box>
        )}
      </Paper>

      <Typography variant="h6" gutterBottom>
        Exercises
      </Typography>
      
      <Grid container spacing={2}>
        {workout.exercises.map((exercise) => (
          <Grid item xs={12} key={exercise.id}>
            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                {exercise.exercise.name}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <Chip 
                  size="small" 
                  label={`${exercise.sets} sets`} 
                  variant="outlined" 
                />
                <Chip 
                  size="small" 
                  label={`${exercise.reps} reps`} 
                  variant="outlined" 
                />
                {exercise.weight && (
                  <Chip 
                    size="small" 
                    label={`${exercise.weight} kg`} 
                    variant="outlined" 
                  />
                )}
              </Box>
              
              {exercise.set_details && exercise.set_details.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'background.default' }}>
                        <TableCell>Set</TableCell>
                        <TableCell>Planned</TableCell>
                        <TableCell>Actual</TableCell>
                        <TableCell>Duration</TableCell>
                        <TableCell>Completion Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {exercise.set_details.map((set) => (
                        <TableRow 
                          key={set.id} 
                          sx={{ 
                            '&:last-child td, &:last-child th': { border: 0 },
                            bgcolor: set.actual_reps !== null && set.actual_reps !== undefined ? 'rgba(46, 125, 50, 0.08)' : 'inherit'
                          }}
                        >
                          <TableCell component="th" scope="row">
                            Set {set.set_number}
                          </TableCell>
                          <TableCell>
                            {set.planned_reps} reps × {set.planned_weight || 0} kg
                          </TableCell>
                          <TableCell>
                            {set.actual_reps !== null 
                              ? `${set.actual_reps} reps × ${set.actual_weight || 0} kg` 
                              : '—'}
                          </TableCell>
                          <TableCell>
                            {set.duration_seconds 
                              ? formatTime(set.duration_seconds)
                              : '—'}
                          </TableCell>
                          <TableCell>
                            {set.completion_time 
                              ? format(new Date(set.completion_time), 'HH:mm:ss')
                              : '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {exercise.notes && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  <strong>Notes:</strong> {exercise.notes}
                </Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/history')}
        >
          Back to History
        </Button>
      </Box>
    </Box>
  );
};

export default WorkoutHistoryDetailPage; 