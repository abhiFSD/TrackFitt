import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Button, Container, Typography, Paper, Grid, Card, CardContent, 
  CardActions, Divider, IconButton, Chip, Dialog, DialogTitle, 
  DialogContent, DialogContentText, DialogActions, Tab, Tabs,
  Alert, Snackbar
} from '@mui/material';
import { Add as AddIcon, CalendarMonth as CalendarIcon, 
         FitnessCenter as FitnessCenterIcon, Delete as DeleteIcon,
         PlayArrow as StartIcon } from '@mui/icons-material';
import { format, isSameDay } from 'date-fns';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { PickersDay, PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { Badge } from '@mui/material';

import { ScheduledWorkout, Workout } from '../interfaces';
import { scheduledWorkoutAPI, workoutAPI } from '../services/api';
import { useWorkoutTracking } from '../context/WorkoutTrackingContext';
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
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Create a custom day component for the calendar
function ServerDay(props: PickersDayProps<Date> & { highlightedDays?: Date[] }) {
  const { highlightedDays = [], day, outsideCurrentMonth, ...other } = props;

  const isHighlighted = !outsideCurrentMonth && 
    highlightedDays.some((date) => isSameDay(date, day));

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={isHighlighted ? '•' : undefined}
      color="primary"
    >
      <PickersDay
        {...other}
        outsideCurrentMonth={outsideCurrentMonth}
        day={day}
      />
    </Badge>
  );
}

const ScheduledWorkoutsPage: React.FC = () => {
  const navigate = useNavigate();
  const { startWorkout } = useWorkoutTracking();
  const location = useLocation();
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  const [templateWorkouts, setTemplateWorkouts] = useState<Workout[]>([]);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [workoutToDelete, setWorkoutToDelete] = useState<number | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  useEffect(() => {
    loadScheduledWorkouts();
    loadTemplateWorkouts();

    // Check if we navigated here with a selected workout to schedule
    const state = location.state as { selectedWorkout?: Workout } | null;
    if (state && state.selectedWorkout) {
      handleScheduleWorkout(state.selectedWorkout);
      // Clear the state to avoid reopening the modal on page refresh
      navigate(location.pathname, { replace: true });
    }
  }, []);

  const loadScheduledWorkouts = async () => {
    try {
      const workouts = await scheduledWorkoutAPI.getScheduledWorkouts({ include_completed: true });
      setScheduledWorkouts(workouts);
    } catch (error) {
      console.error('Error loading scheduled workouts:', error);
    }
  };

  const loadTemplateWorkouts = async () => {
    try {
      // Load template workouts
      const templates = await workoutAPI.getWorkouts(true);
      setTemplateWorkouts(templates);
    } catch (error) {
      console.error('Error loading template workouts:', error);
    }
  };

  const handleScheduleWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setScheduleModalOpen(true);
  };

  const handleScheduleSuccess = () => {
    loadScheduledWorkouts();
    setNotification({
      show: true,
      message: 'Workout scheduled successfully!',
      type: 'success'
    });
  };

  const handleDeleteWorkout = (id: number) => {
    setWorkoutToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDeleteWorkout = async () => {
    if (workoutToDelete) {
      try {
        await scheduledWorkoutAPI.deleteScheduledWorkout(workoutToDelete);
        setScheduledWorkouts(scheduledWorkouts.filter(w => w.id !== workoutToDelete));
        setShowDeleteDialog(false);
        setWorkoutToDelete(null);
        setNotification({
          show: true,
          message: 'Workout removed from schedule',
          type: 'success'
        });
      } catch (error) {
        console.error('Error deleting scheduled workout:', error);
        setNotification({
          show: true,
          message: 'Error removing workout from schedule',
          type: 'error'
        });
      }
    }
  };

  const handleStartWorkout = async (scheduledWorkoutId: number, workoutId: number) => {
    setIsLoading(true);
    try {
      // Pass both parameters to startWorkout
      await startWorkout(workoutId, scheduledWorkoutId);
      navigate('/workout-tracker');
    } catch (error) {
      console.error('Error starting workout:', error);
      setError('Failed to start workout. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, show: false });
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter workouts by upcoming and past
  const now = new Date();
  const upcomingWorkouts = scheduledWorkouts.filter(workout => {
    const workoutDate = new Date(workout.scheduled_date);
    return !workout.is_completed && workoutDate > now;
  });
  const pastWorkouts = scheduledWorkouts.filter(workout => {
    const workoutDate = new Date(workout.scheduled_date);
    return workout.is_completed || workoutDate <= now;
  });

  // Get workouts for selected date in calendar view
  const selectedDateWorkouts = scheduledWorkouts.filter(workout => {
    if (!selectedDate) return false;
    const workoutDate = new Date(workout.scheduled_date);
    return isSameDay(workoutDate, selectedDate);
  });

  // Get workout dates for highlighting on calendar
  const workoutDates = scheduledWorkouts.map(workout => new Date(workout.scheduled_date));

  // Function to render workouts for the selected date
  const renderSelectedDateWorkouts = () => {
    if (selectedDateWorkouts.length === 0) {
      return (
        <Box sx={{ p: 2 }}>
          <Alert severity="info">
            No workouts scheduled for {selectedDate ? format(selectedDate, 'PPP') : 'selected date'}.
          </Alert>
        </Box>
      );
    }

    return (
      <Grid container spacing={3} sx={{ p: 2 }}>
        {selectedDateWorkouts.map(workout => (
          <Grid item xs={12} md={6} key={workout.id}>
            <Card>
              <CardContent>
                <Typography variant="h6" component="div">
                  {workout.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {format(new Date(workout.scheduled_date), 'p')} {/* Just show time */}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Duration: {workout.duration_minutes} minutes
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2">
                  Exercises: {workout.exercises.length}
                </Typography>
              </CardContent>
              <CardActions>
                {!workout.is_completed && (
                  <>
                    <Button 
                      startIcon={<StartIcon />}
                      onClick={() => handleStartWorkout(workout.id, workout.workout_template_id)}
                      size="small" 
                      color="primary"
                    >
                      Start
                    </Button>
                    <IconButton 
                      onClick={() => handleDeleteWorkout(workout.id)}
                      size="small" 
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                )}
                {workout.is_completed && (
                  <Chip 
                    label="Completed"
                    color="success"
                    size="small"
                  />
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    );
  };

  return (
    <Container maxWidth="lg">
      <Snackbar 
        open={notification.show} 
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={notification.type} onClose={handleCloseNotification}>
          {notification.message}
        </Alert>
      </Snackbar>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Scheduled Workouts
        </Typography>
      </Box>

      <Paper sx={{ mb: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="workout tabs">
            <Tab label="Templates" />
            <Tab label="Upcoming" />
            <Tab label="Past" />
            <Tab label="Calendar" />
          </Tabs>
        </Box>
        
        {/* Template Workouts Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            {templateWorkouts.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info">
                  No template workouts found. Create a template workout first before scheduling.
                </Alert>
              </Grid>
            ) : (
              templateWorkouts.map(workout => (
                <Grid item xs={12} md={6} lg={4} key={workout.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {workout.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Duration: {workout.duration_minutes} minutes
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {workout.description || 'No description'}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2">
                        Exercises: {workout.exercises.length}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        startIcon={<CalendarIcon />}
                        onClick={() => handleScheduleWorkout(workout)}
                        size="small" 
                        color="primary"
                      >
                        Schedule
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </TabPanel>
        
        {/* Upcoming Workouts Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            {upcomingWorkouts.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info">
                  No upcoming workouts scheduled. Go to Templates tab to schedule a workout.
                </Alert>
              </Grid>
            ) : (
              upcomingWorkouts.map(workout => (
                <Grid item xs={12} md={6} lg={4} key={workout.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {workout.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {format(new Date(workout.scheduled_date), 'PPP p')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duration: {workout.duration_minutes} minutes
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2">
                        Exercises: {workout.exercises.length}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button 
                        startIcon={<StartIcon />}
                        onClick={() => handleStartWorkout(workout.id, workout.workout_template_id)}
                        size="small" 
                        color="primary"
                      >
                        Start
                      </Button>
                      <IconButton 
                        onClick={() => handleDeleteWorkout(workout.id)}
                        size="small" 
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </TabPanel>
        
        {/* Past Workouts Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            {pastWorkouts.length === 0 ? (
              <Grid item xs={12}>
                <Alert severity="info">
                  No past or completed workouts found.
                </Alert>
              </Grid>
            ) : (
              pastWorkouts.map(workout => (
                <Grid item xs={12} md={6} lg={4} key={workout.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="h6" component="div">
                          {workout.title}
                        </Typography>
                        <Chip 
                          label={workout.is_completed ? "Completed" : "Missed"}
                          color={workout.is_completed ? "success" : "error"}
                          size="small"
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {format(new Date(workout.scheduled_date), 'PPP p')}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Duration: {workout.duration_minutes} minutes
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))
            )}
          </Grid>
        </TabPanel>

        {/* Calendar View Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6} lg={4}>
              <Paper elevation={3} sx={{ p: 1, height: '100%' }}>
                <StaticDatePicker
                  displayStaticWrapperAs="desktop"
                  value={selectedDate}
                  onChange={(newDate) => setSelectedDate(newDate)}
                  slots={{
                    day: (props) => (
                      <ServerDay {...props} highlightedDays={workoutDates} />
                    ),
                  }}
                  slotProps={{
                    toolbar: { hidden: false },
                    actionBar: { hidden: true }
                  }}
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={6} lg={8}>
              <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Workouts for {selectedDate ? format(selectedDate, 'PPP') : 'selected date'}
                </Typography>
                {renderSelectedDateWorkouts()}
              </Paper>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Use the new ScheduleModal component */}
      <ScheduleModal
        workout={selectedWorkout}
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSuccess={handleScheduleSuccess}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Remove Scheduled Workout</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this workout from your schedule?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDeleteWorkout} color="error">Remove</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ScheduledWorkoutsPage; 