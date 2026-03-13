import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';
import { 
  FitnessCenter as WorkoutIcon,
  BarChart as HistoryIcon,
  EmojiEvents as TokenIcon,
  Person as ProfileIcon
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useWorkoutTracking } from '../context/WorkoutTrackingContext';
import { tokenAPI, workoutAPI, workoutHistoryAPI, userProfileAPI } from '../services/api';
import { Workout, WorkoutHistory, UserTokenBalance } from '../interfaces';
import { formatLocalDate } from '../utils/dateUtils';
import DateDisplay from '../components/common/DateDisplay';
import ActiveWorkoutTracker from '../components/common/ActiveWorkoutTracker';

const DashboardPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { activeWorkout } = useWorkoutTracking();
  const navigate = useNavigate();
  
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [recentWorkouts, setRecentWorkouts] = useState<WorkoutHistory[]>([]);
  const [tokenBalance, setTokenBalance] = useState<UserTokenBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileAlert, setShowProfileAlert] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      try {
        const profile = await userProfileAPI.getProfile();
        
        // Check if essential profile details are missing
        const isMissingBasicInfo = !profile.first_name || !profile.last_name || !profile.gender;
        const isMissingPhysicalMetrics = !profile.height_cm || !profile.weight_kg;
        
        if (isMissingBasicInfo || isMissingPhysicalMetrics) {
          setShowProfileAlert(true);
          setProfileDialogOpen(true);
        }
      } catch (error) {
        // Profile doesn't exist yet
        setShowProfileAlert(true);
        setProfileDialogOpen(true);
      }
    };
    
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if profile is complete
        await checkProfileCompletion();
        
        // Fetch workout templates
        const workoutTemplates = await workoutAPI.getWorkouts(true);
        setWorkouts(workoutTemplates.slice(0, 3)); // Show only up to 3 templates
        
        // Fetch recent workout history
        const history = await workoutHistoryAPI.getWorkoutHistory();
        setRecentWorkouts(history.slice(0, 3)); // Show only up to 3 recent workouts
        
        // Fetch token balance
        const balance = await tokenAPI.getBalance();
        setTokenBalance(balance);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const handleProfileDialogClose = () => {
    setProfileDialogOpen(false);
  };

  const handleGoToProfile = () => {
    navigate('/profile');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {showProfileAlert && (
        <Alert 
          severity="warning" 
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={handleGoToProfile}>
              Complete Profile
            </Button>
          }
        >
          Your profile information is incomplete. Please complete your profile to get personalized workouts.
        </Alert>
      )}
      
      {/* Display active workout if exists */}
      {activeWorkout && <ActiveWorkoutTracker />}
      
      <Dialog
        open={profileDialogOpen}
        onClose={handleProfileDialogClose}
        aria-labelledby="profile-dialog-title"
        aria-describedby="profile-dialog-description"
      >
        <DialogTitle id="profile-dialog-title">
          {"Complete Your Profile"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="profile-dialog-description">
            To get the most out of the app, we need some information about you. This helps us personalize your workout experience.
            Please take a moment to complete your profile.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleProfileDialogClose}>Later</Button>
          <Button onClick={handleGoToProfile} autoFocus variant="contained">
            Complete Now
          </Button>
        </DialogActions>
      </Dialog>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {currentUser?.username}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Track your workouts, earn tokens, and achieve your fitness goals.
        </Typography>
      </Paper>

      {/* Token Balance */}
      <Paper sx={{ p: 3, mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TokenIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
          <Box>
            <Typography variant="h6">Your Token Balance</Typography>
            <Typography variant="h4" color="primary">
              {tokenBalance?.balance || 0} Tokens
            </Typography>
          </Box>
        </Box>
        <Button variant="outlined" onClick={() => navigate('/tokens')}>
          View Tokens
        </Button>
      </Paper>

      {/* Workout Templates */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Your Workout Templates
      </Typography>
      <Grid container spacing={3}>
        {workouts.length > 0 ? (
          workouts.map((workout) => (
            <Grid item xs={12} sm={6} md={4} key={workout.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {workout.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {workout.description || 'No description'}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">
                    Duration: {workout.duration_minutes} minutes
                  </Typography>
                  <Typography variant="body2">
                    Exercises: {workout.exercises.length}
                  </Typography>
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
                    onClick={() => navigate('/scheduled-workouts')}
                  >
                    Schedule
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You don't have any workout templates yet.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/workouts/create')}
                startIcon={<WorkoutIcon />}
              >
                Create Workout
              </Button>
            </Paper>
          </Grid>
        )}
        {workouts.length > 0 && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/workouts')}
              >
                View All Workouts
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>

      {/* Recent Workout History */}
      <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
        Recent Workout Activity
      </Typography>
      <Grid container spacing={3}>
        {recentWorkouts.length > 0 ? (
          recentWorkouts.map((history) => (
            <Grid item xs={12} sm={6} md={4} key={history.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {history.title}
                  </Typography>
                  <Chip 
                    label={`Rating: ${history.rating || 'N/A'}`} 
                    size="small" 
                    color={history.rating && history.rating > 3 ? "success" : "default"}
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="body2" color="text.secondary">
                    <DateDisplay date={history.date_completed} format="date" />
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">
                    Duration: {history.duration_minutes} minutes
                  </Typography>
                  <Typography variant="body2">
                    Exercises: {history.exercises.length}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button 
                    size="small" 
                    onClick={() => navigate(`/history/${history.id}`)}
                  >
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                You haven't logged any workouts yet.
              </Typography>
              <Button 
                variant="contained" 
                onClick={() => navigate('/workouts')}
                startIcon={<HistoryIcon />}
              >
                Log Workout
              </Button>
            </Paper>
          </Grid>
        )}
        {recentWorkouts.length > 0 && (
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                variant="outlined" 
                onClick={() => navigate('/history')}
              >
                View All History
              </Button>
            </Box>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DashboardPage; 