import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, 
  Container,
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
  useMediaQuery,
  useTheme,
  Fab,
  Stepper,
  Step,
  StepLabel,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormGroup,
  FormControlLabel,
  Switch as MuiSwitch,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Drawer,
  AppBar,
  Toolbar,
  Badge,
  OutlinedInput,
  Checkbox
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker, StaticDatePicker, PickersDay, PickersDayProps } from '@mui/x-date-pickers';
import { format, isSameDay, addDays } from 'date-fns';

// Icons
import AddIcon from '@mui/icons-material/Add';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TodayIcon from '@mui/icons-material/Today';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import InfoIcon from '@mui/icons-material/Info';
import TimerIcon from '@mui/icons-material/Timer';
import RemoveIcon from '@mui/icons-material/Remove';

// Interfaces and API services
import { 
  Workout, 
  Exercise, 
  ScheduledWorkout, 
  ScheduledWorkoutCreate,
  WorkoutCreate,
  WorkoutExerciseCreate,
  WorkoutAIResponse,
  WorkoutAIFrontendRequest,
  UserProfile,
  WorkoutAIExerciseResponse
} from '../interfaces';
import { 
  workoutAPI, 
  scheduledWorkoutAPI, 
  exerciseAPI,
  aiAPI,
  userProfileAPI
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useWorkoutTracking } from '../context/WorkoutTrackingContext';

// Components
import { ScheduleModal } from '../components/common';

// Custom day component for calendar
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

// Tab Panel component
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
      id={`workout-tabpanel-${index}`}
      aria-labelledby={`workout-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `workout-tab-${index}`,
    'aria-controls': `workout-tabpanel-${index}`,
  };
}

// For AI Workout Creation
interface ExerciseSetForm {
  setNumber: number;
  reps: number;
  weight: number | '';
  restTimeSeconds: number | '';
}

interface ShareProfileOptions {
  basicInfo: boolean;
  physicalMetrics: boolean;
  fitnessActivity: boolean;
  healthInfo: boolean;
  goals: boolean;
  preferences: boolean;
}

const FITNESS_LEVELS = ['beginner', 'intermediate', 'advanced'];
const MUSCLE_GROUPS = [
  'Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Calves', 'Forearms', 'Glutes', 'Full Body'
];
const EQUIPMENT_LIST = [
  'Barbell', 'Dumbbell', 'Kettlebell', 'Machine', 'Bodyweight', 'Resistance Band', 'Cable', 'Medicine Ball', 'TRX'
];

// Create Workout Section Component
interface CreateWorkoutSectionProps {
  onSuccess: () => void;
}

const CreateWorkoutSection: React.FC<CreateWorkoutSectionProps> = ({ onSuccess }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentUser } = useAuth();
  
  // Basic form state
  const [createMethod, setCreateMethod] = useState<'template' | 'ai'>('ai');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(45);
  const [isTemplate, setIsTemplate] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Exercise state
  const [exercises, setExercises] = useState<WorkoutExerciseCreate[]>([]);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | ''>('');
  const [sets, setSets] = useState(3);
  const [reps, setReps] = useState(10);
  const [weight, setWeight] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [restTimeSeconds, setRestTimeSeconds] = useState<number | ''>(60);
  
  // AI state
  const [userPrompt, setUserPrompt] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState<string | null>(null);
  const [preferredDuration, setPreferredDuration] = useState<number | ''>('');
  const [preferredEquipment, setPreferredEquipment] = useState<string[]>([]);
  const [targetMuscleGroups, setTargetMuscleGroups] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatedWorkout, setGeneratedWorkout] = useState<WorkoutAIResponse | null>(null);
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  
  // Profile data sharing options
  const [shareProfileDataOptions, setShareProfileDataOptions] = useState<ShareProfileOptions>({
    basicInfo: false,
    physicalMetrics: false,
    fitnessActivity: false,
    healthInfo: false,
    goals: false,
    preferences: false,
  });
  
  // Calculate user age from birth date if available
  const calculateAge = (birthDate: string | undefined | null): number | undefined => {
    if (!birthDate) return undefined;
    
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Fetch available exercises on component mount
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        const data = await exerciseAPI.getExercises();
        setAvailableExercises(data);
        setFilteredExercises(data);
      } catch (error) {
        setError('Failed to load exercises. Please try again later.');
      }
    };
    
    fetchExercises();
  }, []);
  
  // Filter exercises based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredExercises(availableExercises);
      return;
    }
    
    const filtered = availableExercises.filter(
      (exercise) => 
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (exercise.muscle_groups && exercise.muscle_groups.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (exercise.category && exercise.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    
    setFilteredExercises(filtered);
  }, [searchQuery, availableExercises]);
  
  const openAddExerciseDialog = () => {
    setDialogOpen(true);
    setSelectedExerciseId('');
    setSets(3);
    setReps(10);
    setWeight('');
    setRestTimeSeconds(60);
    setNotes('');
  };
  
  const closeDialog = () => {
    setDialogOpen(false);
  };
  
  const addExerciseToWorkout = () => {
    if (!selectedExerciseId) {
      return;
    }
    
    const newExercise: WorkoutExerciseCreate = {
      exercise_id: typeof selectedExerciseId === 'number' ? selectedExerciseId : parseInt(selectedExerciseId),
      sets: sets,
      reps: reps,
      weight: weight !== '' ? weight : undefined,
      rest_time_seconds: restTimeSeconds !== '' ? restTimeSeconds : undefined,
      notes: notes || undefined
    };
    
    setExercises([...exercises, newExercise]);
    closeDialog();
  };
  
  const removeExercise = (index: number) => {
    const updatedExercises = [...exercises];
    updatedExercises.splice(index, 1);
    setExercises(updatedExercises);
  };
  
  const getExerciseNameById = (id: number): string => {
    const exercise = availableExercises.find(ex => ex.id === id);
    return exercise ? exercise.name : `Exercise #${id}`;
  };
  
  const handleCreateWorkout = async () => {
    if (!title) {
      setError('Title is required');
      return;
    }
    
    if (exercises.length === 0) {
      setError('At least one exercise is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const workoutData: WorkoutCreate = {
        title,
        description: description || undefined,
        duration_minutes: typeof durationMinutes === 'number' ? durationMinutes : 45,
        is_template: isTemplate,
        is_published: isPublished,
        exercises
      };
      
      await workoutAPI.createWorkout(workoutData);
      
      // Reset form
      setTitle('');
      setDescription('');
      setDurationMinutes(45);
      setExercises([]);
      
      // Call success callback
      onSuccess();
    } catch (error) {
      console.error('Error creating workout:', error);
      setError('Failed to create workout. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleShareProfileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShareProfileDataOptions({
      ...shareProfileDataOptions,
      [event.target.name]: event.target.checked
    });
  };
  
  const handleGenerateAIWorkout = async () => {
    if (!userPrompt) {
      setAiError('Please enter what kind of workout you want');
      return;
    }
    
    setAiLoading(true);
    setAiError(null);
    setGeneratedWorkout(null);
    
    try {
      // Prepare shared profile data
      let sharedProfileData: Record<string, any> | null = null;
      
      if (currentUser?.profile) {
        const profile = currentUser.profile;
        sharedProfileData = {};
        
        // Only add profile sections that the user has selected to share
        if (shareProfileDataOptions.basicInfo) {
          sharedProfileData.basic_info = {
            age: profile.birth_date ? calculateAge(profile.birth_date) : undefined,
            gender: profile.gender
          };
        }
        
        if (shareProfileDataOptions.physicalMetrics) {
          sharedProfileData.physical_metrics = {
            height_cm: profile.height_cm,
            weight_kg: profile.weight_kg,
            body_fat_percentage: profile.body_fat_percentage
          };
        }
        
        if (shareProfileDataOptions.fitnessActivity) {
          sharedProfileData.fitness_data = {
            fitness_level: profile.fitness_level,
            activity_level: profile.activity_level
          };
        }
        
        if (shareProfileDataOptions.healthInfo) {
          sharedProfileData.health_info = {
            has_injuries: profile.has_injuries,
            injury_notes: profile.injury_notes,
            has_medical_conditions: profile.has_medical_conditions,
            medical_notes: profile.medical_notes
          };
        }
        
        if (shareProfileDataOptions.goals) {
          sharedProfileData.goals = {
            weight_goal_kg: profile.weight_goal_kg,
            weekly_workout_goal: profile.weekly_workout_goal
          };
        }
        
        if (shareProfileDataOptions.preferences) {
          sharedProfileData.preferences = {
            preferred_workout_duration: profile.preferred_workout_duration,
            preferred_workout_days: profile.preferred_workout_days,
            favorite_muscle_groups: profile.favorite_muscle_groups
          };
        }
        
        // If no profile sections were selected, set to null
        if (Object.keys(sharedProfileData).length === 0) {
          sharedProfileData = null;
        }
      }
      
      // Prepare AI request
      const request: WorkoutAIFrontendRequest = {
        user_id: currentUser?.id || 0,
        user_prompt: userPrompt,
        fitness_level: fitnessLevel,
        preferred_duration: typeof preferredDuration === 'number' ? preferredDuration : null,
        preferred_equipment: preferredEquipment.length > 0 ? preferredEquipment : null,
        target_muscle_groups: targetMuscleGroups.length > 0 ? targetMuscleGroups : null,
        shared_profile_data: sharedProfileData
      };
      
      console.log('Sending AI request:', request);
      
      const response = await aiAPI.createWorkout(request);
      setGeneratedWorkout(response);
      setAiNotes(response.ai_notes || null);
      
      console.log('AI response:', response);
      
      // Pre-fill the form with the generated workout
      setTitle(response.title);
      setDescription(response.description);
      setDurationMinutes(response.duration_minutes);
      
      // Create exercise entries
      const generatedExercises: WorkoutExerciseCreate[] = [];
      
      for (const exercise of response.exercises) {
        // Find the exercise in our database by name (inexact match)
        const matchedExercise = availableExercises.find(ex => 
          ex.name.toLowerCase().includes(exercise.exercise_id.toLowerCase()) ||
          exercise.exercise_id.toLowerCase().includes(ex.name.toLowerCase())
        );
        
        if (matchedExercise) {
          generatedExercises.push({
            exercise_id: matchedExercise.id,
            sets: exercise.sets,
            reps: exercise.reps,
            weight: exercise.weight || undefined,
            rest_time_seconds: exercise.rest_time_seconds,
            notes: exercise.notes || undefined
          });
        }
      }
      
      setExercises(generatedExercises);
      
    } catch (error) {
      console.error('Error generating AI workout:', error);
      setAiError('Failed to generate workout. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };
  
  const resetAiForm = () => {
    setUserPrompt('');
    setFitnessLevel(null);
    setPreferredDuration('');
    setPreferredEquipment([]);
    setTargetMuscleGroups([]);
    setAiError(null);
    setGeneratedWorkout(null);
    setAiNotes(null);
  };
  
  const renderAIForm = () => {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Create AI Workout
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Describe the workout you want"
              placeholder="e.g., A 30-minute HIIT workout focusing on upper body with minimal equipment"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              fullWidth
              required
              multiline
              rows={3}
              helperText="Be specific about your goals, time constraints, equipment, and any limitations"
            />
          </Grid>
          
          {/* Optional parameters to help the AI */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Fitness Level</InputLabel>
              <Select
                value={fitnessLevel || ''}
                onChange={(e) => setFitnessLevel(e.target.value || null)}
                label="Fitness Level"
              >
                <MenuItem value="">Any Level</MenuItem>
                {FITNESS_LEVELS.map((level) => (
                  <MenuItem key={level} value={level}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Preferred Duration (minutes)"
              type="number"
              value={preferredDuration}
              onChange={(e) => setPreferredDuration(e.target.value ? parseInt(e.target.value) : '')}
              fullWidth
              inputProps={{ min: 5, max: 120 }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Target Muscle Groups</InputLabel>
              <Select
                multiple
                value={targetMuscleGroups}
                onChange={(e) => setTargetMuscleGroups(typeof e.target.value === 'string' ? [] : e.target.value)}
                input={<OutlinedInput label="Target Muscle Groups" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {MUSCLE_GROUPS.map((muscle) => (
                  <MenuItem key={muscle} value={muscle}>
                    {muscle}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Available Equipment</InputLabel>
              <Select
                multiple
                value={preferredEquipment}
                onChange={(e) => setPreferredEquipment(typeof e.target.value === 'string' ? [] : e.target.value)}
                input={<OutlinedInput label="Available Equipment" />}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => (
                      <Chip key={value} label={value} size="small" />
                    ))}
                  </Box>
                )}
              >
                {EQUIPMENT_LIST.map((equipment) => (
                  <MenuItem key={equipment} value={equipment}>
                    {equipment}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {currentUser?.profile && (
            <Grid item xs={12}>
              <Typography variant="subtitle2" gutterBottom>
                Share profile data with AI for better recommendations:
              </Typography>
              
              <Grid container spacing={1}>
                <Grid item xs={6} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shareProfileDataOptions.basicInfo}
                        onChange={handleShareProfileChange}
                        name="basicInfo"
                        size="small"
                      />
                    }
                    label="Basic Info"
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shareProfileDataOptions.physicalMetrics}
                        onChange={handleShareProfileChange}
                        name="physicalMetrics"
                        size="small"
                      />
                    }
                    label="Physical Metrics"
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shareProfileDataOptions.fitnessActivity}
                        onChange={handleShareProfileChange}
                        name="fitnessActivity"
                        size="small"
                      />
                    }
                    label="Fitness Level"
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shareProfileDataOptions.healthInfo}
                        onChange={handleShareProfileChange}
                        name="healthInfo"
                        size="small"
                      />
                    }
                    label="Health Info"
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shareProfileDataOptions.goals}
                        onChange={handleShareProfileChange}
                        name="goals"
                        size="small"
                      />
                    }
                    label="Goals"
                  />
                </Grid>
                <Grid item xs={6} sm={4}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={shareProfileDataOptions.preferences}
                        onChange={handleShareProfileChange}
                        name="preferences"
                        size="small"
                      />
                    }
                    label="Preferences"
                  />
                </Grid>
              </Grid>
            </Grid>
          )}
          
          {aiError && (
            <Grid item xs={12}>
              <Alert severity="error">{aiError}</Alert>
            </Grid>
          )}
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                color="primary"
                onClick={resetAiForm}
                disabled={aiLoading}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AutoFixHighIcon />}
                onClick={handleGenerateAIWorkout}
                disabled={aiLoading || !userPrompt.trim()}
              >
                {aiLoading ? <CircularProgress size={24} /> : 'Generate Workout'}
              </Button>
            </Box>
          </Grid>
        </Grid>
        
        {aiNotes && generatedWorkout && (
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              AI Notes:
            </Typography>
            <Typography variant="body2" whiteSpace="pre-line">
              {aiNotes}
            </Typography>
          </Box>
        )}
      </Paper>
    );
  };
  
  const renderWorkoutForm = () => {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Workout Details
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              error={!title && error !== null}
              helperText={!title && error !== null ? 'Title is required' : ''}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Duration (minutes)"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value ? parseInt(e.target.value) : '')}
              fullWidth
              required
              inputProps={{ min: 5 }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormGroup>
              <FormControlLabel
                control={
                  <MuiSwitch
                    checked={isTemplate}
                    onChange={(e) => setIsTemplate(e.target.checked)}
                    color="primary"
                  />
                }
                label="Save as Template"
              />
              
              {isTemplate && (
                <FormControlLabel
                  control={
                    <MuiSwitch
                      checked={isPublished}
                      onChange={(e) => setIsPublished(e.target.checked)}
                      color="secondary"
                    />
                  }
                  label="Publish Publicly"
                />
              )}
            </FormGroup>
          </Grid>
        </Grid>
      </Paper>
    );
  };
  
  const renderExercises = () => {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Exercises ({exercises.length})
          </Typography>
          
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={openAddExerciseDialog}
          >
            Add Exercise
          </Button>
        </Box>
        
        {exercises.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            No exercises added yet. Add some exercises to create your workout.
          </Alert>
        )}
        
        <List>
          {exercises.map((exercise, index) => (
            <ListItem
              key={index}
              secondaryAction={
                <IconButton edge="end" onClick={() => removeExercise(index)} color="error">
                  <DeleteIcon />
                </IconButton>
              }
              sx={{ 
                border: '1px solid', 
                borderColor: 'divider', 
                borderRadius: 1, 
                mb: 1,
                '&:hover': {
                  bgcolor: 'action.hover'
                }
              }}
            >
              <ListItemText
                primary={getExerciseNameById(exercise.exercise_id)}
                secondary={
                  <React.Fragment>
                    <Typography variant="body2" component="span">
                      {exercise.sets} sets x {exercise.reps} reps
                      {exercise.weight ? ` @ ${exercise.weight} kg` : ''}
                    </Typography>
                    {exercise.notes && (
                      <Typography variant="body2" color="text.secondary" component="div">
                        Note: {exercise.notes}
                      </Typography>
                    )}
                  </React.Fragment>
                }
              />
            </ListItem>
          ))}
        </List>
        
        {/* Exercise Dialog */}
        <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
          <DialogTitle>Add Exercise</DialogTitle>
          <DialogContent>
            <Box sx={{ my: 2 }}>
              <TextField
                label="Search Exercises"
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ mb: 2 }}
                placeholder="Search by name, muscle group, or category"
              />
              
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Exercise</InputLabel>
                <Select
                  value={selectedExerciseId}
                  onChange={(e) => setSelectedExerciseId(e.target.value as number)}
                  label="Select Exercise"
                >
                  {filteredExercises.map((exercise) => (
                    <MenuItem key={exercise.id} value={exercise.id}>
                      {exercise.name} {exercise.muscle_groups && `(${exercise.muscle_groups})`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Sets"
                    type="number"
                    value={sets}
                    onChange={(e) => setSets(parseInt(e.target.value))}
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Reps"
                    type="number"
                    value={reps}
                    onChange={(e) => setReps(parseInt(e.target.value))}
                    fullWidth
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Weight (kg)"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value ? parseInt(e.target.value) : '')}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Rest Time (seconds)"
                    type="number"
                    value={restTimeSeconds}
                    onChange={(e) => setRestTimeSeconds(e.target.value ? parseInt(e.target.value) : '')}
                    fullWidth
                    inputProps={{ min: 0 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    label="Notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>Cancel</Button>
            <Button 
              onClick={addExerciseToWorkout} 
              variant="contained" 
              color="primary"
              disabled={!selectedExerciseId}
            >
              Add Exercise
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    );
  };
  
  return (
    <Box sx={{ mb: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Creation method selection */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
        <Tabs
          value={createMethod}
          onChange={(e, newValue) => setCreateMethod(newValue)}
          centered
        >
          <Tab 
            value="ai" 
            label="AI-Generated Workout" 
            icon={<AutoFixHighIcon />} 
            iconPosition="start"
          />
          <Tab 
            value="template" 
            label="Manual Creation" 
            icon={<EditIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>
      
      {/* AI Form */}
      {createMethod === 'ai' && renderAIForm()}
      
      {/* Workout Form (shown for both AI and manual) */}
      {renderWorkoutForm()}
      
      {/* Exercises */}
      {renderExercises()}
      
      {/* Submit button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleCreateWorkout}
          disabled={loading || exercises.length === 0 || !title}
          sx={{ minWidth: 200, py: 1.5 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Workout'}
        </Button>
      </Box>
    </Box>
  );
};

const UnifiedWorkoutsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isMediumScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { currentUser } = useAuth();
  const { startWorkout } = useWorkoutTracking();

  // Check if we have an initial tab to set
  const locationState = location.state as { initialTab?: number } | null;
  
  // Main state
  const [mainTabValue, setMainTabValue] = useState(locationState?.initialTab || 0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Notification state
  const [notification, setNotification] = useState<{show: boolean, message: string, type: 'success' | 'error'}>({
    show: false,
    message: '',
    type: 'success'
  });

  // Workouts and templates state
  const [myTemplates, setMyTemplates] = useState<Workout[]>([]);
  const [publicTemplates, setPublicTemplates] = useState<Workout[]>([]);
  const [templateTabValue, setTemplateTabValue] = useState(0);
  
  // Scheduled workouts state
  const [scheduledWorkouts, setScheduledWorkouts] = useState<ScheduledWorkout[]>([]);
  const [scheduleTabValue, setScheduleTabValue] = useState(0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [workoutToDelete, setWorkoutToDelete] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Schedule modal state
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  // Mobile drawer state
  const [mobileCreateDrawerOpen, setMobileCreateDrawerOpen] = useState(false);

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
        scheduledWorkoutAPI.getScheduledWorkouts({ include_completed: true })
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

  const handlePublishWorkout = async (workoutId: number) => {
    try {
      await workoutAPI.publishWorkout(workoutId);
      // Refresh workouts after publishing
      fetchData();
      setNotification({
        show: true,
        message: 'Workout published successfully!',
        type: 'success'
      });
    } catch (error) {
      setNotification({
        show: true,
        message: 'Failed to publish workout. Please try again.',
        type: 'error'
      });
    }
  };
  
  const handleStartWorkout = async (workoutId: number, scheduledWorkoutId?: number) => {
    try {
      await startWorkout(workoutId, scheduledWorkoutId);
      navigate('/workout-tracker');
    } catch (error) {
      console.error('Error starting workout:', error);
      setNotification({
        show: true,
        message: 'Failed to start workout. Please try again.',
        type: 'error'
      });
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
    // Show success notification
    setNotification({
      show: true,
      message: 'Workout scheduled successfully!',
      type: 'success'
    });
    // Optionally switch to the scheduled workouts tab
    setMainTabValue(1);
  };

  const handleDeleteScheduledWorkout = (id: number) => {
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
      <Grid container spacing={2}>
        {workouts.map((workout) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={workout.id}>
            <Card sx={{ 
              height: '100%', 
              display: 'flex', 
              flexDirection: 'column',
              '&:hover': {
                boxShadow: 4,
                transform: 'translateY(-2px)',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out'
              }
            }}>
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h6" gutterBottom>
                  {workout.title}
                </Typography>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {workout.is_published && (
                    <Chip 
                      label="Published" 
                      color="primary" 
                      size="small" 
                      sx={{ borderRadius: '20px' }} 
                    />
                  )}
                  
                  {workout.user_id !== currentUser?.id && (
                    <Chip
                      label="Public"
                      size="small"
                      color="secondary"
                      sx={{ borderRadius: '20px' }}
                    />
                  )}
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ 
                  mb: 1,
                  height: '2.5em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}>
                  {workout.description || 'No description provided'}
                </Typography>
                
                <Divider sx={{ my: 1 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <TimerIcon fontSize="small" sx={{ mr: 0.5 }} />
                    {workout.duration_minutes} min
                  </Typography>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <FitnessCenterIcon fontSize="small" sx={{ mr: 0.5 }} />
                    {workout.exercises.length} exercises
                  </Typography>
                </Box>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'space-between', p: 1 }}>
                <Button 
                  size="small" 
                  onClick={() => navigate(`/workouts/${workout.id}`)}
                >
                  View
                </Button>
                
                <Box>
                  <Button 
                    size="small" 
                    startIcon={<PlayArrowIcon />}
                    onClick={() => handleStartWorkout(workout.id)}
                    color="success"
                  >
                    Start
                  </Button>
                  
                  <Button 
                    size="small" 
                    color="primary"
                    startIcon={<CalendarMonthIcon />}
                    onClick={() => handleScheduleWorkout(workout)}
                  >
                    Schedule
                  </Button>
                </Box>
                
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

  // Filter scheduled workouts
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

  // Clear the location state after using it
  useEffect(() => {
    if (locationState?.initialTab) {
      navigate(location.pathname, { replace: true });
    }
  }, [locationState]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Container maxWidth="xl" sx={{ mt: 3, mb: 6 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Workouts
        </Typography>
        
        {/* Main content */}
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
            <Tabs 
              value={mainTabValue} 
              onChange={(e, newValue) => setMainTabValue(newValue)}
              variant={isMobile ? "fullWidth" : "standard"}
              centered={!isMobile}
              sx={{ 
                '& .MuiTab-root': { 
                  fontSize: isMobile ? '0.8rem' : '0.9rem',
                  minWidth: isMobile ? 'auto' : 80,
                  px: isMobile ? 1 : 2
                } 
              }}
            >
              <Tab 
                label={isMobile ? "Templates" : "Workout Templates"} 
                icon={isMobile ? <FitnessCenterIcon /> : undefined}
                iconPosition="start"
                {...a11yProps(0)} 
              />
              <Tab 
                label={isMobile ? "Schedule" : "Scheduled Workouts"} 
                icon={isMobile ? <CalendarMonthIcon /> : undefined}
                iconPosition="start"
                {...a11yProps(1)} 
              />
              <Tab 
                label={isMobile ? "Create" : "Create Workout"} 
                icon={isMobile ? <AddIcon /> : undefined}
                iconPosition="start"
                {...a11yProps(2)} 
              />
            </Tabs>
          </Box>

          {/* Notification alert */}
          {notification.show && (
            <Alert 
              severity={notification.type} 
              sx={{ mb: 2 }}
              onClose={() => setNotification({...notification, show: false})}
            >
              {notification.message}
            </Alert>
          )}
          
          {/* Template tab panel */}
          <TabPanel value={mainTabValue} index={0}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <Box>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs 
                    value={templateTabValue} 
                    onChange={(e, newValue) => setTemplateTabValue(newValue)}
                    variant={isMobile ? "fullWidth" : "standard"}
                  >
                    <Tab label="My Templates" {...a11yProps(0)} />
                    <Tab label="Public Templates" {...a11yProps(1)} />
                  </Tabs>
                </Box>
                
                <TabPanel value={templateTabValue} index={0}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="h6">My Workout Templates</Typography>
                    <Button 
                      variant="contained" 
                      startIcon={<AddIcon />}
                      onClick={() => setMainTabValue(2)}
                    >
                      Create New Template
                    </Button>
                  </Box>
                  {renderWorkoutCards(myTemplates, true)}
                </TabPanel>
                
                <TabPanel value={templateTabValue} index={1}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6">Public Workout Templates</Typography>
                  </Box>
                  {renderWorkoutCards(publicTemplates)}
                </TabPanel>
              </Box>
            )}
          </TabPanel>
          
          {/* Schedule tab panel */}
          <TabPanel value={mainTabValue} index={1}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <Box>
                {/* Tabs for different schedule views */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                  <Tabs 
                    value={scheduleTabValue} 
                    onChange={(e, newValue) => setScheduleTabValue(newValue)}
                    variant={isMobile ? "fullWidth" : "standard"}
                  >
                    <Tab label="Upcoming" {...a11yProps(0)} />
                    <Tab label="Calendar" {...a11yProps(1)} />
                    <Tab label="Past" {...a11yProps(2)} />
                  </Tabs>
                </Box>
                
                {/* Upcoming workouts view */}
                <TabPanel value={scheduleTabValue} index={0}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="h6">Upcoming Workouts</Typography>
                    
                    <Button 
                      variant="outlined" 
                      color="primary"
                      startIcon={<AddIcon />}
                      onClick={() => setMainTabValue(0)}
                    >
                      Schedule a Workout
                    </Button>
                  </Box>

                  {upcomingWorkouts.length === 0 ? (
                    <Alert 
                      severity="info" 
                      action={
                        <Button 
                          color="inherit" 
                          size="small" 
                          onClick={() => setMainTabValue(0)}
                        >
                          Find Workouts
                        </Button>
                      }
                    >
                      No upcoming workouts scheduled. Browse templates to schedule one!
                    </Alert>
                  ) : (
                    <Grid container spacing={2}>
                      {upcomingWorkouts.map((workout) => {
                        const workoutDate = new Date(workout.scheduled_date);
                        return (
                          <Grid item xs={12} sm={6} md={4} key={workout.id}>
                            <Card sx={{ 
                              height: '100%', 
                              display: 'flex', 
                              flexDirection: 'column',
                              '&:hover': {
                                boxShadow: 4,
                                transform: 'translateY(-2px)',
                                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out'
                              }
                            }}>
                              <Box sx={{ 
                                bgcolor: 'primary.light', 
                                color: 'primary.contrastText',
                                p: 1,
                                borderBottom: '1px solid',
                                borderColor: 'primary.main',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                              }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <CalendarMonthIcon sx={{ mr: 1 }} />
                                  <Typography variant="subtitle2">
                                    {format(workoutDate, 'EEEE, MMMM d')}
                                  </Typography>
                                </Box>
                                <Typography variant="subtitle2">
                                  {format(workoutDate, 'h:mm a')}
                                </Typography>
                              </Box>
                              
                              <CardContent sx={{ flexGrow: 1 }}>
                                <Typography variant="h6" gutterBottom>
                                  {workout.title}
                                </Typography>
                                
                                <Typography variant="body2" color="text.secondary" sx={{ 
                                  mb: 1,
                                  height: '2.5em',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                }}>
                                  {workout.description || 'No description provided'}
                                </Typography>
                                
                                <Divider sx={{ my: 1 }} />
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <TimerIcon fontSize="small" sx={{ mr: 0.5 }} />
                                    {workout.duration_minutes} min
                                  </Typography>
                                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                                    <FitnessCenterIcon fontSize="small" sx={{ mr: 0.5 }} />
                                    {workout.exercises.length} exercises
                                  </Typography>
                                </Box>
                              </CardContent>
                              
                              <CardActions sx={{ justifyContent: 'space-between', p: 1 }}>
                                <Button 
                                  size="small" 
                                  onClick={() => navigate(`/workouts/${workout.workout_template_id}`)}
                                >
                                  View Details
                                </Button>
                                
                                <Box>
                                  <Button 
                                    size="small" 
                                    color="success"
                                    startIcon={<PlayArrowIcon />}
                                    onClick={() => handleStartWorkout(workout.workout_template_id, workout.id)}
                                  >
                                    Start
                                  </Button>
                                  
                                  <IconButton 
                                    size="small" 
                                    color="error"
                                    onClick={() => handleDeleteScheduledWorkout(workout.id)}
                                  >
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                              </CardActions>
                            </Card>
                          </Grid>
                        );
                      })}
                    </Grid>
                  )}
                </TabPanel>
                
                {/* Calendar view */}
                <TabPanel value={scheduleTabValue} index={1}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2, mb: isMobile ? 2 : 0 }}>
                        <Typography variant="h6" gutterBottom>
                          Workout Calendar
                        </Typography>
                        <StaticDatePicker
                          displayStaticWrapperAs="desktop"
                          value={selectedDate}
                          onChange={(newValue) => setSelectedDate(newValue)}
                          slots={{
                            day: (dayProps) => 
                              <ServerDay 
                                {...dayProps as PickersDayProps<Date>} 
                                highlightedDays={workoutDates}
                              />
                          }}
                          slotProps={{
                            toolbar: { hidden: true },
                            day: { 
                              sx: { 
                                fontSize: isMobile ? '0.7rem' : '0.8rem',
                                width: isMobile ? 28 : 36, 
                                height: isMobile ? 28 : 36 
                              }
                            }
                          }}
                        />
                      </Paper>
                    </Grid>
                    
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 2, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                          {selectedDate ? format(selectedDate, 'EEEE, MMMM d, yyyy') : 'Selected Date'}
                        </Typography>
                        
                        {selectedDateWorkouts.length === 0 ? (
                          <Alert severity="info" sx={{ mt: 2 }}>
                            No workouts scheduled for this date.
                          </Alert>
                        ) : (
                          <List sx={{ mt: 2 }}>
                            {selectedDateWorkouts.map((workout) => {
                              const workoutTime = new Date(workout.scheduled_date);
                              return (
                                <ListItem 
                                  key={workout.id}
                                  secondaryAction={
                                    <Box>
                                      <Button
                                        size="small"
                                        color="success"
                                        startIcon={<PlayArrowIcon />}
                                        onClick={() => handleStartWorkout(workout.workout_template_id, workout.id)}
                                        sx={{ mr: 1 }}
                                      >
                                        Start
                                      </Button>
                                      <IconButton
                                        edge="end"
                                        color="error"
                                        onClick={() => handleDeleteScheduledWorkout(workout.id)}
                                      >
                                        <DeleteIcon />
                                      </IconButton>
                                    </Box>
                                  }
                                  sx={{ 
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    borderRadius: 1,
                                    mb: 1,
                                    '&:hover': {
                                      bgcolor: 'action.hover'
                                    }
                                  }}
                                >
                                  <ListItemText
                                    primary={workout.title}
                                    secondary={
                                      <React.Fragment>
                                        <Typography variant="body2" component="span" color="text.primary">
                                          {format(workoutTime, 'h:mm a')}
                                        </Typography>
                                        {' • '}
                                        <Typography variant="body2" component="span">
                                          {workout.duration_minutes} min
                                        </Typography>
                                        {' • '}
                                        <Typography variant="body2" component="span">
                                          {workout.exercises.length} exercises
                                        </Typography>
                                      </React.Fragment>
                                    }
                                  />
                                </ListItem>
                              );
                            })}
                          </List>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                </TabPanel>
                
                {/* Past workouts view */}
                <TabPanel value={scheduleTabValue} index={2}>
                  <Typography variant="h6" gutterBottom>
                    Past Workouts
                  </Typography>
                  
                  {pastWorkouts.length === 0 ? (
                    <Alert severity="info">
                      No past workouts found.
                    </Alert>
                  ) : (
                    <List>
                      {pastWorkouts.map((workout) => {
                        const workoutDate = new Date(workout.scheduled_date);
                        return (
                          <ListItem 
                            key={workout.id}
                            sx={{ 
                              border: '1px solid',
                              borderColor: 'divider',
                              borderRadius: 1,
                              mb: 1,
                              opacity: workout.is_completed ? 0.7 : 1,
                              bgcolor: workout.is_completed ? 'action.selected' : 'background.paper'
                            }}
                          >
                            <ListItemText
                              primary={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <Typography variant="subtitle1">
                                    {workout.title}
                                  </Typography>
                                  {workout.is_completed && (
                                    <Chip 
                                      label="Completed" 
                                      color="success" 
                                      size="small" 
                                      sx={{ ml: 1, height: 20 }} 
                                    />
                                  )}
                                </Box>
                              }
                              secondary={
                                <React.Fragment>
                                  <Typography variant="body2" component="span" color="text.primary">
                                    {format(workoutDate, 'MMMM d, yyyy')}
                                  </Typography>
                                  {' • '}
                                  <Typography variant="body2" component="span">
                                    {format(workoutDate, 'h:mm a')}
                                  </Typography>
                                  {' • '}
                                  <Typography variant="body2" component="span">
                                    {workout.duration_minutes} min
                                  </Typography>
                                </React.Fragment>
                              }
                            />
                            {!workout.is_completed && (
                              <ListItemSecondaryAction>
                                <Button
                                  size="small"
                                  color="primary"
                                  onClick={() => handleStartWorkout(workout.workout_template_id, workout.id)}
                                >
                                  Start Late
                                </Button>
                              </ListItemSecondaryAction>
                            )}
                          </ListItem>
                        );
                      })}
                    </List>
                  )}
                </TabPanel>
              </Box>
            )}
          </TabPanel>
          
          {/* Create tab panel */}
          <TabPanel value={mainTabValue} index={2}>
            <CreateWorkoutSection
              onSuccess={() => {
                fetchData();
                setNotification({
                  show: true,
                  message: 'Workout created successfully!',
                  type: 'success'
                });
                setMainTabValue(0); // Switch to templates tab
              }}
            />
          </TabPanel>
        </Box>
      </Container>

      {/* Schedule modal */}
      <ScheduleModal
        workout={selectedWorkout}
        open={scheduleModalOpen}
        onClose={() => setScheduleModalOpen(false)}
        onSuccess={handleScheduleSuccess}
      />
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
      >
        <DialogTitle>Remove Scheduled Workout?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this workout from your schedule?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
          <Button onClick={confirmDeleteWorkout} color="error">
            Remove
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Mobile FAB for creating workout */}
      {isMobile && mainTabValue !== 2 && (
        <Fab
          color="primary"
          aria-label="create workout"
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
          }}
          onClick={() => setMainTabValue(2)}
        >
          <AddIcon />
        </Fab>
      )}
    </LocalizationProvider>
  );
};

export default UnifiedWorkoutsPage; 