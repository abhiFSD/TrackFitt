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
  Tabs,
  Tab,
  Divider,
  Chip,
  Paper,
  Avatar,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FitnessCenter from '@mui/icons-material/FitnessCenter';
import CalendarMonth from '@mui/icons-material/CalendarMonth';
import PlayArrow from '@mui/icons-material/PlayArrow';
import { workoutAPI, scheduledWorkoutAPI } from '../services/api';
import { Workout, ScheduledWorkout } from '../interfaces';
import { useWorkoutTracking } from '../context/WorkoutTrackingContext';
import { useAuth } from '../context/AuthContext';
import { ScheduleModal } from '../components/common';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `simple-tab-${index}`,
    'aria-controls': `simple-tabpanel-${index}`,
  };
}

const WorkoutsPage: React.FC = () => {
  const navigate = useNavigate();
  const { startWorkout } = useWorkoutTracking();
  const { currentUser } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [myTemplates, setMyTemplates] = useState<Workout[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<Workout[]>([]);
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  
  // Update state for schedule modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    // Reset states to avoid any potential stale data
    setMyTemplates([]);
    setPublicTemplates([]);
    setScheduledWorkouts([]);
    
    try {
      // Fetch all data in parallel with individual error handling
      await Promise.allSettled([
        // Fetch user's templates
        workoutAPI.getWorkouts(true)
          .then(templatesData => {
            console.log('My Templates:', templatesData);
            setMyTemplates(templatesData || []);
          })
          .catch(err => {
            console.error('Error fetching my templates:', err);
            setMyTemplates([]);
          }),
          
        // Fetch public templates
        workoutAPI.getWorkouts(undefined, true)
          .then(publicWorkoutsData => {
            console.log('Published Templates:', publicWorkoutsData);
            if (publicWorkoutsData) {
              // Filter to show only templates
              setPublicTemplates(publicWorkoutsData.filter(workout => workout.is_template));
            }
          })
          .catch(err => {
            console.error('Error fetching public templates:', err);
            setPublicTemplates([]);
          }),
          
        // Fetch scheduled workouts
        scheduledWorkoutAPI.getScheduledWorkouts()
          .then(scheduledData => {
            console.log('Scheduled Workouts:', scheduledData);
            setScheduledWorkouts(scheduledData || []);
          })
          .catch(err => {
            console.error('Error fetching scheduled workouts:', err);
            setScheduledWorkouts([]);
          })
      ]);
      
    } catch (error) {
      console.error('Error in Promise.allSettled:', error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handlePublishWorkout = async (workoutId: number) => {
    try {
      await workoutAPI.publishWorkout(workoutId);
      // Refresh workouts after publishing
      fetchData();
    } catch (error) {
      setError('Failed to publish workout. Please try again.');
    }
  };
  
  const handleStartWorkout = async (workoutId: number) => {
    try {
      await startWorkout(workoutId);
      navigate('/workout-tracker');
    } catch (error) {
      console.error('Error starting workout:', error);
    }
  };
  
  const handleScheduleWorkout = (workout: Workout) => {
    // Open the schedule modal
    setSelectedWorkout(workout);
    setScheduleModalOpen(true);
  };
  
  const handleScheduleSuccess = () => {
    // Refresh the data after successful scheduling
    fetchData();
    // Optionally switch to the scheduled workouts tab
    setTabValue(2);
  };

  const renderWorkoutCards = (workouts: Workout[], showPublishButton = false) => {
    console.log('Rendering workout cards:', workouts);
    
    if (!workouts || workouts.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No workouts found.
        </Alert>
      );
    }
    
    return (
      <Grid container spacing={3}>
        {workouts.map((workout) => (
          <Grid item xs={12} sm={6} md={4} key={workout.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {workout.title}
                </Typography>
                
                {workout.is_published && (
                  <Chip 
                    label="Published" 
                    color="primary" 
                    size="small" 
                    sx={{ mb: 1 }} 
                  />
                )}
                
                {workout.user_id !== currentUser?.id && (
                  <Chip
                    label="Published by another user"
                    size="small"
                    color="secondary"
                    sx={{ mb: 1, ml: 1 }}
                  />
                )}
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {workout.description || 'No description provided'}
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Duration: {workout.duration_minutes} min
                  </Typography>
                  <Typography variant="body2">
                    Exercises: {workout.exercises.length}
                  </Typography>
                </Box>
              </CardContent>
              
              <CardActions>
                <Button 
                  size="small" 
                  onClick={() => navigate(`/workouts/${workout.id}`)}
                >
                  View Details
                </Button>
                
                <Button 
                  size="small" 
                  color="primary"
                  startIcon={<CalendarMonth />}
                  onClick={() => handleScheduleWorkout(workout)}
                >
                  Schedule
                </Button>
                
                {showPublishButton && !workout.is_published && (
                  <Button 
                    size="small" 
                    color="secondary"
                    onClick={() => handlePublishWorkout(workout.id)}
                  >
                    Publish
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderScheduledWorkouts = () => {
    console.log('Rendering scheduled workouts:', scheduledWorkouts);
    
    if (!scheduledWorkouts || scheduledWorkouts.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No scheduled workouts found. Schedule a workout from the templates.
        </Alert>
      );
    }

    return (
      <Grid container spacing={3}>
        {scheduledWorkouts.map((workout) => (
          <Grid item xs={12} sm={6} md={4} key={workout.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {workout.title}
                </Typography>
                
                <Chip 
                  label={`Date: ${new Date(workout.scheduled_date).toLocaleDateString()}`}
                  color="primary" 
                  size="small" 
                  sx={{ mb: 1 }} 
                />

                {workout.is_completed && (
                  <Chip 
                    label="Completed"
                    color="success" 
                    size="small" 
                    sx={{ mb: 1, ml: 1 }} 
                  />
                )}
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {workout.description || 'No description provided'}
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">
                    Duration: {workout.duration_minutes} min
                  </Typography>
                  <Typography variant="body2">
                    Exercises: {workout.exercises.length}
                  </Typography>
                </Box>
              </CardContent>
              
              <CardActions>
                {!workout.is_completed && (
                  <Button 
                    size="small" 
                    color="primary"
                    startIcon={<PlayArrow />}
                    onClick={() => handleStartWorkout(workout.workout_template_id)}
                  >
                    Start Workout
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Workouts
        </Typography>
        
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/workouts/create')}
        >
          Create Workout
        </Button>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      <Paper sx={{ width: '100%' }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="workout tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="My Templates" {...a11yProps(0)} />
          <Tab label="Published Templates" {...a11yProps(1)} />
          <Tab label="Scheduled Workouts" {...a11yProps(2)} />
        </Tabs>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TabPanel value={tabValue} index={0}>
              {renderWorkoutCards(myTemplates, true)}
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              {renderWorkoutCards(publicTemplates)}
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              {renderScheduledWorkouts()}
            </TabPanel>
          </>
        )}
      </Paper>
      
      {/* Use the new ScheduleModal component */}
      <ScheduleModal
        workout={selectedWorkout}
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSuccess={handleScheduleSuccess}
      />
    </Box>
  );
};

export default WorkoutsPage; 