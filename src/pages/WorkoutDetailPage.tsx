import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Divider,
  Chip,
  List,
  ListItem,
  CircularProgress,
  Alert,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useMediaQuery,
  Theme,
} from '@mui/material';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import TimerIcon from '@mui/icons-material/Timer';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import YouTubeIcon from '@mui/icons-material/YouTube';
import ImageIcon from '@mui/icons-material/Image';
import { workoutAPI, exerciseAPI } from '../services/api';
import { Workout, Exercise } from '../interfaces';
import { useWorkoutTracking } from '../context/WorkoutTrackingContext';
import { ExerciseDetailModal } from '../components/common';

const WorkoutDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { startWorkout } = useWorkoutTracking();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseDetails, setExerciseDetails] = useState<Record<number, Exercise>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [startingWorkout, setStartingWorkout] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down('sm'));
  
  useEffect(() => {
    const fetchWorkout = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await workoutAPI.getWorkout(parseInt(id));
        setWorkout(data);
        
        // Fetch detailed exercise info for each exercise in the workout
        const exerciseDetailsMap: Record<number, Exercise> = {};
        for (const workoutExercise of data.exercises) {
          const exerciseDetail = await exerciseAPI.getExercise(workoutExercise.exercise_id);
          exerciseDetailsMap[workoutExercise.exercise_id] = exerciseDetail;
        }
        setExerciseDetails(exerciseDetailsMap);
        
        setLoading(false);
      } catch (error) {
        setError('Failed to load workout details. Please try again later.');
        setLoading(false);
      }
    };
    
    fetchWorkout();
  }, [id]);
  
  const handlePublishWorkout = async () => {
    if (!workout) return;
    
    try {
      setPublishing(true);
      await workoutAPI.publishWorkout(workout.id);
      
      // Refresh workout data
      const updatedWorkout = await workoutAPI.getWorkout(workout.id);
      setWorkout(updatedWorkout);
      
      setPublishing(false);
    } catch (error) {
      setError('Failed to publish workout. Please try again.');
      setPublishing(false);
    }
  };
  
  const handleStartWorkout = async () => {
    if (!workout || !id) return;
    
    try {
      setStartingWorkout(true);
      await startWorkout(parseInt(id));
      navigate('/workout-tracker');
    } catch (error) {
      console.error('Error starting workout:', error);
      setError('Failed to start workout. Please try again.');
    } finally {
      setStartingWorkout(false);
    }
  };

  const handleOpenExerciseModal = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setModalOpen(true);
  };

  const handleCloseExerciseModal = () => {
    setModalOpen(false);
    setSelectedExercise(null);
  };
  
  // Helper function to render sets data
  const renderSetsData = (workoutExercise: any) => {
    // If there are detailed sets, show them
    if (workoutExercise.set_details && workoutExercise.set_details.length > 0) {
      return (
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, mb: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Set</TableCell>
                <TableCell>Reps</TableCell>
                {workoutExercise.weight && <TableCell>Weight</TableCell>}
                {workoutExercise.rest_time_seconds && <TableCell>Rest</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {workoutExercise.set_details.map((set: any, idx: number) => (
                <TableRow key={idx}>
                  <TableCell>{set.set_number}</TableCell>
                  <TableCell>{set.reps}</TableCell>
                  {workoutExercise.weight && <TableCell>{set.weight || workoutExercise.weight} kg</TableCell>}
                  {workoutExercise.rest_time_seconds && 
                    <TableCell>{set.rest_time_seconds || workoutExercise.rest_time_seconds}s</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    } else {
      // Otherwise, generate a table for the sets based on the general information
      return (
        <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, mb: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Set</TableCell>
                <TableCell>Reps</TableCell>
                {workoutExercise.weight && <TableCell>Weight</TableCell>}
                {workoutExercise.rest_time_seconds && <TableCell>Rest</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from({ length: workoutExercise.sets }, (_, i) => (
                <TableRow key={i}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{workoutExercise.reps}</TableCell>
                  {workoutExercise.weight && <TableCell>{workoutExercise.weight} kg</TableCell>}
                  {workoutExercise.rest_time_seconds && 
                    <TableCell>{workoutExercise.rest_time_seconds}s</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      );
    }
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }
  
  if (!workout) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="warning">Workout not found</Alert>
      </Box>
    );
  }
  
  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, maxWidth: '1200px', mx: 'auto' }}>
      <Card elevation={2} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between', 
            alignItems: { xs: 'flex-start', md: 'center' }, 
            mb: 2 
          }}>
            <Box>
              <Typography variant="h5" gutterBottom>
                {workout.title}
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                {workout.is_template && (
                  <Chip label="Template" color="info" size="small" />
                )}
                
                {workout.is_published && (
                  <Chip label="Published" color="primary" size="small" />
                )}
              </Box>
            </Box>
            
            <Box sx={{ display: 'flex', mt: { xs: 1, md: 0 }, flexWrap: 'wrap', gap: 1 }}>
              {!workout.is_template && (
                <Button 
                  variant="contained" 
                  color="primary" 
                  onClick={handleStartWorkout}
                  disabled={startingWorkout}
                  size={isMobile ? "small" : "medium"}
                >
                  {startingWorkout ? <CircularProgress size={24} /> : 'Start Workout'}
                </Button>
              )}
              
              {workout.is_template && !workout.is_published && (
                <Button 
                  variant="outlined" 
                  color="secondary"
                  onClick={handlePublishWorkout}
                  disabled={publishing}
                  size={isMobile ? "small" : "medium"}
                >
                  {publishing ? <CircularProgress size={24} /> : 'Publish Workout'}
                </Button>
              )}
              
              {workout.is_template && (
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate('/scheduled-workouts')}
                  size={isMobile ? "small" : "medium"}
                >
                  Schedule Workout
                </Button>
              )}
            </Box>
          </Box>
          
          {workout.description && (
            <Typography variant="body2" sx={{ mb: 2 }}>
              {workout.description}
            </Typography>
          )}
          
          <Divider sx={{ my: 2 }} />
          
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimerIcon sx={{ mr: 1, color: 'text.secondary', fontSize: isMobile ? '1rem' : '1.25rem' }} />
                <Typography variant="body2">
                  {workout.duration_minutes} minutes
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={6} sm={4}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <FitnessCenterIcon sx={{ mr: 1, color: 'text.secondary', fontSize: isMobile ? '1rem' : '1.25rem' }} />
                <Typography variant="body2">
                  {workout.exercises.length} exercises
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
      
      <Typography variant="h6" gutterBottom sx={{ mt: 3, mb: 2, pl: 1 }}>
        Exercises
      </Typography>
      
      {workout.exercises.length === 0 ? (
        <Alert severity="info">No exercises in this workout</Alert>
      ) : (
        <Box>
          {workout.exercises.map((workoutExercise, index) => {
            const exercise = exerciseDetails[workoutExercise.exercise_id];
            
            return (
              <Accordion key={index} sx={{ mb: 1 }}>
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon />}
                  sx={{ alignItems: 'center' }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <Avatar 
                      sx={{ 
                        bgcolor: 'primary.main', 
                        width: 32, 
                        height: 32, 
                        mr: 1.5, 
                        fontSize: '0.875rem' 
                      }}
                    >
                      {index + 1}
                    </Avatar>
                    
                    {exercise?.image_url && (
                      <Box sx={{ mr: 1.5 }}>
                        <img 
                          src={exercise.image_url} 
                          alt={exercise.name}
                          style={{ 
                            width: '40px', 
                            height: '40px', 
                            borderRadius: '4px',
                            objectFit: 'cover'
                          }}
                        />
                      </Box>
                    )}
                    
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                        {exercise?.name || `Exercise #${workoutExercise.exercise_id}`}
                      </Typography>
                      
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                        {workoutExercise.sets} sets • {workoutExercise.reps} reps
                        {workoutExercise.weight ? ` • ${workoutExercise.weight} kg` : ''}
                      </Typography>
                    </Box>
                    
                    {exercise && (
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenExerciseModal(exercise);
                        }}
                        sx={{ mr: 1 }}
                        title="View exercise details"
                      >
                        <InfoIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </AccordionSummary>
                
                <AccordionDetails>
                  {exercise?.category && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                      <Chip label={exercise.category} size="small" variant="outlined" />
                      {exercise.difficulty && (
                        <Chip label={exercise.difficulty} size="small" variant="outlined" />
                      )}
                      {exercise.equipment && (
                        <Chip label={exercise.equipment} size="small" variant="outlined" />
                      )}
                    </Box>
                  )}
                  
                  {exercise?.description && (
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {exercise.description.length > 100 
                        ? `${exercise.description.substring(0, 100)}...` 
                        : exercise.description}
                    </Typography>
                  )}
                  
                  {/* Render sets table */}
                  {renderSetsData(workoutExercise)}
                  
                  {workoutExercise.notes && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Notes:
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {workoutExercise.notes}
                      </Typography>
                    </Box>
                  )}
                  
                  {/* Exercise video link */}
                  {exercise?.video_url && (
                    <Box sx={{ mt: 2 }}>
                      <Button 
                        startIcon={<YouTubeIcon />} 
                        href={exercise.video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        size="small"
                        variant="outlined"
                      >
                        Watch Demonstration
                      </Button>
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}

      {/* Use the shared ExerciseDetailModal component */}
      <ExerciseDetailModal
        open={modalOpen && selectedExercise !== null}
        onClose={handleCloseExerciseModal}
        exercise={selectedExercise}
      />
    </Box>
  );
};

export default WorkoutDetailPage; 