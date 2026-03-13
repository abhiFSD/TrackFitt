import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Paper,
  FormControlLabel,
  Switch,
  FormGroup,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Chip,
  Card,
  CardContent,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
  Stack,
  Checkbox,
  OutlinedInput,
  FormHelperText
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import RemoveIcon from '@mui/icons-material/Remove';
import TimerIcon from '@mui/icons-material/Timer';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import InfoIcon from '@mui/icons-material/Info';
import { exerciseAPI, workoutAPI, aiAPI, userProfileAPI } from '../services/api';
import {
  Exercise,
  WorkoutCreate,
  WorkoutExerciseCreate,
  WorkoutAIFrontendRequest,
  WorkoutAIResponse,
  WorkoutAIExerciseResponse,
  UserProfile
} from '../interfaces';
import { useAuth } from '../context/AuthContext';

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

const CreateWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Workout form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number | ''>(45);
  const [isPublished, setIsPublished] = useState(false);
  
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
  
  // For managing multiple sets
  const [showDetailedSets, setShowDetailedSets] = useState(false);
  const [exerciseSets, setExerciseSets] = useState<ExerciseSetForm[]>([
    { setNumber: 1, reps: 10, weight: '', restTimeSeconds: 60 }
  ]);
  
  // AI state
  const [showAiForm, setShowAiForm] = useState(false);
  const [userPrompt, setUserPrompt] = useState('');
  const [fitnessLevel, setFitnessLevel] = useState<string | null>(null);
  const [preferredDuration, setPreferredDuration] = useState<number | ''>('');
  const [preferredEquipment, setPreferredEquipment] = useState<string[]>([]);
  const [targetMuscleGroups, setTargetMuscleGroups] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [generatedWorkout, setGeneratedWorkout] = useState<WorkoutAIResponse | null>(null);
  const [aiNotes, setAiNotes] = useState<string | null>(null);
  
  // State for profile data and sharing options
  const [userProfileData, setUserProfileData] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [shareProfileDataOptions, setShareProfileDataOptions] = useState<ShareProfileOptions>({
    basicInfo: false,
    physicalMetrics: false,
    fitnessActivity: false,
    healthInfo: false,
    goals: false,
    preferences: false,
  });
  
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
  
  // Fetch user profile data when component mounts or currentUser object changes
  useEffect(() => {
    const fetchUserProfileData = () => {
      setProfileLoading(true);
      setProfileError(null);
      if (currentUser?.profile) {
        try {
          setUserProfileData(currentUser.profile);
        } catch (error) {
          console.error("Error processing user profile from context:", error);
          setProfileError('Failed to process user profile data.');
          setUserProfileData(null);
        }
      } else {
         setUserProfileData(null);
      }
      setProfileLoading(false);
    };

    fetchUserProfileData();
  }, [currentUser]);
  
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
  
  // Update exercise sets when sets changes
  useEffect(() => {
    if (!showDetailedSets) {
      const newSets: ExerciseSetForm[] = [];
      for (let i = 0; i < sets; i++) {
        newSets.push({
          setNumber: i + 1,
          reps,
          weight: weight,
          restTimeSeconds: restTimeSeconds || 60
        });
      }
      setExerciseSets(newSets);
    } else {
       const fallbackSet: ExerciseSetForm = {
         setNumber: 1, 
         reps: reps || 10, 
         weight: weight || '',
         restTimeSeconds: restTimeSeconds || 60
       };
       const detailedSets: ExerciseSetForm[] = exerciseSets.length > 0 ? exerciseSets : [fallbackSet];
       setExerciseSets(detailedSets);
       setSets(detailedSets.length);
    }
  }, [sets, reps, weight, restTimeSeconds, showDetailedSets]);
  
  const openAddExerciseDialog = () => {
    setDialogOpen(true);
    setSelectedExerciseId('');
    setSets(3);
    setReps(10);
    setWeight('');
    setRestTimeSeconds(60);
    setNotes('');
    setShowDetailedSets(false);
    setExerciseSets([{ setNumber: 1, reps: 10, weight: '', restTimeSeconds: 60 }]);
  };
  
  const closeDialog = () => {
    setDialogOpen(false);
  };
  
  const addSet = () => {
    const nextSetNumber = exerciseSets.length + 1;
    setExerciseSets([
      ...exerciseSets,
      { 
        setNumber: nextSetNumber, 
        reps: exerciseSets[exerciseSets.length - 1]?.reps || 10,
        weight: exerciseSets[exerciseSets.length - 1]?.weight || '',
        restTimeSeconds: exerciseSets[exerciseSets.length - 1]?.restTimeSeconds || 60
      }
    ]);
    setSets(nextSetNumber);
  };
  
  const removeSet = (index: number) => {
    if (exerciseSets.length <= 1) return;
    
    const newSets = exerciseSets.filter((_, i) => i !== index);
    const renumberedSets = newSets.map((set, i) => ({
      ...set,
      setNumber: i + 1
    }));
    
    setExerciseSets(renumberedSets);
    setSets(renumberedSets.length);
  };
  
  const updateSetValue = (index: number, field: keyof ExerciseSetForm, value: any) => {
    const newSets = [...exerciseSets];
    let processedValue = value;
    if ((field === 'reps' || field === 'weight' || field === 'restTimeSeconds') && value !== '') {
      processedValue = Number(value);
      if (isNaN(processedValue)) processedValue = '';
    }
    newSets[index] = { ...newSets[index], [field]: processedValue };
    setExerciseSets(newSets);
  };
  
  const addExerciseToWorkout = () => {
    if (selectedExerciseId === '') {
      return;
    }
    
    const selectedExerciseDetails = availableExercises.find(ex => ex.id === selectedExerciseId);
    if (!selectedExerciseDetails) {
      setError('Selected exercise not found.');
      return;
    }

    const newExercise: WorkoutExerciseCreate = {
      exercise_id: selectedExerciseId as number,
      sets: showDetailedSets ? exerciseSets.length : sets,
      reps: showDetailedSets ? 0 : reps,
      weight: showDetailedSets ? undefined : (weight !== '' ? Number(weight) : undefined),
      rest_time_seconds: showDetailedSets ? undefined : (restTimeSeconds !== '' ? Number(restTimeSeconds) : undefined),
      notes: notes || undefined,
      set_details: undefined
    };
    
    if (showDetailedSets) {
      newExercise.set_details = exerciseSets.map(set => ({
        set_number: set.setNumber,
        reps: set.reps,
        weight: set.weight !== '' ? Number(set.weight) : undefined,
        rest_time_seconds: set.restTimeSeconds !== '' ? Number(set.restTimeSeconds) : undefined
      }));
      newExercise.reps = 0;
      newExercise.weight = undefined;
      newExercise.rest_time_seconds = undefined;
    } else {
       newExercise.set_details = undefined;
    }
    
    setExercises([...exercises, newExercise]);
    closeDialog();
  };
  
  const removeExercise = (index: number) => {
    const updatedExercises = [...exercises];
    updatedExercises.splice(index, 1);
    setExercises(updatedExercises);
  };
  
  const handleCreateWorkout = async () => {
    if (!title) {
      setError('Please enter a workout title');
      return;
    }
    
    if (exercises.length === 0) {
      setError('Please add at least one exercise to your workout');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const workoutData: WorkoutCreate = {
      title,
      description: description || undefined,
      duration_minutes: Number(durationMinutes) || 0,
      is_template: true,
      is_published: isPublished,
      exercises
    };
    
    try {
      console.log("Creating manual workout with data:", workoutData);
      const createdWorkout = await workoutAPI.createWorkout(workoutData);
      setSuccess(true);
      setLoading(false);
      setAiNotes(null);
      
      setTimeout(() => {
        navigate(`/workouts/${createdWorkout.id}`);
      }, 1500);
    } catch (error) {
      console.error("Error creating manual workout:", error);
      setError('Failed to create workout. Please check your input and try again.');
      setLoading(false);
    }
  };
  
  const getExerciseNameById = (id: number): string => {
    const exercise = availableExercises.find((ex) => ex.id === id);
    return exercise ? exercise.name : 'Unknown Exercise';
  };
  
  // Handler for profile sharing checkbox changes
  const handleShareProfileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShareProfileDataOptions({
      ...shareProfileDataOptions,
      [event.target.name]: event.target.checked,
    });
  };
  
  const handleGenerateAIWorkout = async () => {
    // Ensure currentUser exists before proceeding
    if (!currentUser) {
      setAiError("User not logged in. Cannot generate workout.");
      return;
    }
    
    if (!userPrompt) {
      setAiError("Please enter a prompt describing the workout you want.");
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setGeneratedWorkout(null);
    setAiNotes(null);

    // Construct shared profile data based on selections
    const sharedData: { [key: string]: any } = {};
    if (userProfileData) { 
        const calculateAge = (birthDate: string | undefined | null): number | undefined => {
            if (!birthDate) return undefined;
            try {
                const birth = new Date(birthDate);
                if (isNaN(birth.getTime())) {
                   console.error("Invalid birth date format for age calculation:", birthDate);
                   return undefined;
                }
                const today = new Date();
                let age = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                    age--;
                }
                return age > 0 ? age : undefined;
            } catch (e) {
                console.error("Error calculating age:", e);
                return undefined;
            }
        };

      if (shareProfileDataOptions.basicInfo) {
        sharedData.basicInfo = {
          age: calculateAge(userProfileData.birth_date),
          gender: userProfileData.gender,
        };
      }
      if (shareProfileDataOptions.physicalMetrics) {
        sharedData.physicalMetrics = {
          height_cm: userProfileData.height_cm,
          weight_kg: userProfileData.weight_kg,
          body_fat_percentage: userProfileData.body_fat_percentage,
        };
      }
      if (shareProfileDataOptions.fitnessActivity) {
        sharedData.fitnessActivity = {
            activity_level: userProfileData.activity_level,
            weekly_workout_goal: userProfileData.weekly_workout_goal
        };
      }
      if (shareProfileDataOptions.healthInfo) {
        sharedData.healthInfo = {
          has_injuries: userProfileData.has_injuries,
          injury_notes: userProfileData.injury_notes,
          has_medical_conditions: userProfileData.has_medical_conditions,
          medical_notes: userProfileData.medical_notes,
        };
      }
      if (shareProfileDataOptions.goals) {
         sharedData.goals = {
             weight_goal_kg: userProfileData.weight_goal_kg,
         };
      }
      if (shareProfileDataOptions.preferences) {
         sharedData.preferences = {
             preferred_workout_days: userProfileData.preferred_workout_days,
             favorite_muscle_groups: userProfileData.favorite_muscle_groups
         };
      }
    }

    const cleanSharedData = Object.keys(sharedData).length > 0 ? sharedData : undefined;

    const requestData: WorkoutAIFrontendRequest = {
      user_id: currentUser.id, // Include the user ID
      user_prompt: userPrompt,
      fitness_level: fitnessLevel || undefined,
      preferred_duration: preferredDuration !== '' ? Number(preferredDuration) : undefined,
      preferred_equipment: preferredEquipment,
      target_muscle_groups: targetMuscleGroups,
      shared_profile_data: cleanSharedData 
    };

    try {
      const result = await aiAPI.createWorkout(requestData);
      setGeneratedWorkout(result);
      setAiNotes(result.ai_notes || null);

      setTitle(result.title);
      setDescription(result.description);
      setDurationMinutes(result.duration_minutes);
      setIsPublished(false);

      const mappedExercises: WorkoutExerciseCreate[] = result.exercises.map(
        (aiEx: WorkoutAIExerciseResponse): WorkoutExerciseCreate | null => {
          const matchingExercise = availableExercises.find(dbEx =>
             dbEx.id !== undefined && aiEx.exercise_id !== undefined && Number(dbEx.id) === Number(aiEx.exercise_id)
          );

          if (!matchingExercise) {
            console.warn(`AI suggested exercise ID ${aiEx.exercise_id} not found in available exercises.`);
            return null;
          }

          return {
            exercise_id: matchingExercise.id as number,
            sets: aiEx.sets,
            reps: aiEx.reps,
            weight: aiEx.weight !== null ? aiEx.weight : undefined,
            rest_time_seconds: aiEx.rest_time_seconds !== null ? aiEx.rest_time_seconds : undefined,
            notes: aiEx.notes || undefined,
            set_details: undefined
          };
        }
      ).filter((ex): ex is WorkoutExerciseCreate => ex !== null);

      setExercises(mappedExercises);

    } catch (err: any) {
       console.error('Error generating AI workout:', err);
       setAiError(`Failed to generate AI workout: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
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
    setGeneratedWorkout(null);
    setAiNotes(null);
  };
  
  const renderGeneratedWorkout = () => {
    if (!generatedWorkout) return null;

    return (
      <Box sx={{ mt: 3 }}>
        <Typography variant="h6" gutterBottom>Generated Workout Plan</Typography>
        {aiNotes && (
           <Alert severity="info" sx={{ mb: 2 }}>
             <Typography variant="subtitle2" gutterBottom>AI Notes:</Typography>
             {aiNotes}
           </Alert>
        )}
        <Card variant="outlined">
            <CardContent>
                 <Typography variant="h5" component="div" gutterBottom>
                    {generatedWorkout.title}
                </Typography>
                 <Typography sx={{ mb: 1.5 }} color="text.secondary">
                    {generatedWorkout.description}
                </Typography>
                 <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <Chip label={`Duration: ${generatedWorkout.duration_minutes} min`} size="small" icon={<TimerIcon />} />
                    <Chip label={`Difficulty: ${generatedWorkout.difficulty_level}`} size="small" sx={{textTransform: 'capitalize'}} />
                 </Stack>

                 <Table size="small">
                    <TableHead>
                         <TableRow>
                            <TableCell>Exercise</TableCell>
                            <TableCell align="right">Sets</TableCell>
                            <TableCell align="right">Reps</TableCell>
                            <TableCell align="right">Weight</TableCell>
                            <TableCell align="right">Rest (s)</TableCell>
                            <TableCell>Notes</TableCell>
                         </TableRow>
                    </TableHead>
                    <TableBody>
                         {generatedWorkout.exercises.map((ex, index) => {
                           const exerciseDetail = availableExercises.find(e => Number(e.id) === Number(ex.exercise_id));
                           return (
                             <TableRow key={`${ex.exercise_id}-${index}`}>
                                <TableCell component="th" scope="row">
                                 {exerciseDetail ? exerciseDetail.name : `Unknown ID: ${ex.exercise_id}`}
                               </TableCell>
                               <TableCell align="right">{ex.sets}</TableCell>
                               <TableCell align="right">{ex.reps}</TableCell>
                               <TableCell align="right">{ex.weight ?? 'N/A'}</TableCell>
                               <TableCell align="right">{ex.rest_time_seconds ?? 'N/A'}</TableCell>
                               <TableCell>{ex.notes ?? '-'}</TableCell>
                             </TableRow>
                           );
                         })}
                    </TableBody>
                 </Table>
            </CardContent>
        </Card>
         <Button
             variant="contained"
             color="primary"
             onClick={applyGeneratedWorkout}
             sx={{ mt: 2 }}
          >
             Apply This Workout Plan
          </Button>
      </Box>
    );
  };

  const applyGeneratedWorkout = () => {
    if (!generatedWorkout) return;

    setTitle(generatedWorkout.title);
    setDescription(generatedWorkout.description);
    setDurationMinutes(generatedWorkout.duration_minutes);
    setIsPublished(false);

    const mappedExercises: WorkoutExerciseCreate[] = generatedWorkout.exercises.map(
      (aiEx: WorkoutAIExerciseResponse): WorkoutExerciseCreate | null => {
         const matchingExercise = availableExercises.find(dbEx =>
            dbEx.id !== undefined && aiEx.exercise_id !== undefined && Number(dbEx.id) === Number(aiEx.exercise_id)
         );
         if (!matchingExercise) return null;
         return {
            exercise_id: matchingExercise.id as number,
            sets: aiEx.sets,
            reps: aiEx.reps,
            weight: aiEx.weight !== null ? aiEx.weight : undefined,
            rest_time_seconds: aiEx.rest_time_seconds !== null ? aiEx.rest_time_seconds : undefined,
            notes: aiEx.notes || undefined,
            set_details: undefined,
         };
      }
   ).filter((ex): ex is WorkoutExerciseCreate => ex !== null);

   setExercises(mappedExercises);
   setGeneratedWorkout(null);
   setAiNotes(null);
   setShowAiForm(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Create New Workout Template
      </Typography>
      
      <FormGroup sx={{ mb: 3 }}>
        <FormControlLabel
          control={<Switch checked={showAiForm} onChange={(e) => setShowAiForm(e.target.checked)} />}
          label="Generate Workout with AI"
        />
        {showAiForm && (
           <FormHelperText>Let AI create a workout plan based on your preferences.</FormHelperText>
        )}
      </FormGroup>

      {showAiForm && (
        <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>AI Workout Generator</Typography>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Your Workout Prompt"
              name="userPrompt"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              multiline
              rows={3}
              placeholder="e.g., 'Create a 45-minute intermediate full body workout focusing on strength', 'Beginner home workout, no equipment needed, 30 minutes', 'Advanced leg day targeting quads and glutes'"
              required
              sx={{ mb: 2 }}
            />
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
               <FormControl fullWidth>
                 <InputLabel id="fitness-level-label">Fitness Level</InputLabel>
                 <Select
                   labelId="fitness-level-label"
                   value={fitnessLevel || ''}
                   label="Fitness Level"
                   onChange={(e) => setFitnessLevel(e.target.value as string)}
                 >
                   {FITNESS_LEVELS.map(level => (
                     <MenuItem key={level} value={level} sx={{textTransform: 'capitalize'}}>
                       {level}
                     </MenuItem>
                   ))}
                 </Select>
                  <FormHelperText>Select your current fitness level</FormHelperText>
               </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Preferred Duration (minutes)"
                name="preferredDuration"
                type="number"
                value={preferredDuration}
                onChange={(e) => setPreferredDuration(e.target.value === '' ? '' : Number(e.target.value))}
                inputProps={{ min: 15, max: 180, step: 5 }}
                 helperText="How long should the workout be?"
              />
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6}>
               <FormControl fullWidth>
                   <InputLabel id="preferred-equipment-label">Preferred Equipment</InputLabel>
                   <Select
                       labelId="preferred-equipment-label"
                       multiple
                       value={preferredEquipment}
                       onChange={(e) => setPreferredEquipment(e.target.value as string[])}
                       input={<OutlinedInput label="Preferred Equipment" />}
                       renderValue={(selected) => (
                       <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                           {(selected as string[]).map((value) => (
                           <Chip key={value} label={value} size="small"/>
                           ))}
                       </Box>
                       )}
                   >
                       {EQUIPMENT_LIST.map((equip) => (
                       <MenuItem key={equip} value={equip}>
                           {equip}
                       </MenuItem>
                       ))}
                   </Select>
                    <FormHelperText>Select equipment you have or prefer to use</FormHelperText>
               </FormControl>
            </Grid>
             <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                    <InputLabel id="target-muscle-groups-label">Target Muscle Groups</InputLabel>
                    <Select
                        labelId="target-muscle-groups-label"
                        multiple
                        value={targetMuscleGroups}
                        onChange={(e) => setTargetMuscleGroups(e.target.value as string[])}
                        input={<OutlinedInput label="Target Muscle Groups" />}
                        renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((value) => (
                            <Chip key={value} label={value} size="small"/>
                            ))}
                        </Box>
                        )}
                    >
                        {MUSCLE_GROUPS.map((group) => (
                        <MenuItem key={group} value={group}>
                            {group}
                        </MenuItem>
                        ))}
                    </Select>
                    <FormHelperText>Which muscles do you want to focus on?</FormHelperText>
                </FormControl>
             </Grid>
          </Grid>

          <Divider sx={{ my: 3 }}>
               <Chip label="Enhance with Profile Data" size="small" icon={<AutoFixHighIcon />} />
          </Divider>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Optionally share parts of your profile to help the AI create a more personalized workout.
          </Typography>

          {profileLoading && <CircularProgress size={20} sx={{ mb: 1 }}/>}
          {profileError && <Alert severity="warning" sx={{ mb: 2 }}>{profileError}</Alert>}

          {!profileLoading && !profileError && userProfileData && (
              <FormGroup>
                  <Grid container spacing={1}>
                      <Grid item xs={12} sm={6} md={4}>
                          <FormControlLabel
                              control={
                                  <Checkbox
                                      checked={shareProfileDataOptions.basicInfo}
                                      onChange={handleShareProfileChange}
                                      name="basicInfo"
                                  />
                              }
                              label="Basic Info (Age, Gender)"
                          />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                          <FormControlLabel
                              control={
                                  <Checkbox
                                      checked={shareProfileDataOptions.physicalMetrics}
                                      onChange={handleShareProfileChange}
                                      name="physicalMetrics"
                                  />
                              }
                              label="Physical Metrics (H/W, Body Fat)"
                          />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                          <FormControlLabel
                              control={
                                  <Checkbox
                                      checked={shareProfileDataOptions.fitnessActivity}
                                      onChange={handleShareProfileChange}
                                      name="fitnessActivity"
                                  />
                              }
                              label="Fitness & Activity Level"
                          />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                          <FormControlLabel
                              control={
                                  <Checkbox
                                      checked={shareProfileDataOptions.healthInfo}
                                      onChange={handleShareProfileChange}
                                      name="healthInfo"
                                  />
                              }
                              label="Health Info (Injuries, Conditions)"
                          />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                          <FormControlLabel
                              control={
                                  <Checkbox
                                      checked={shareProfileDataOptions.goals}
                                      onChange={handleShareProfileChange}
                                      name="goals"
                                  />
                              }
                              label="Goals (Weight, Weekly Frequency)"
                          />
                      </Grid>
                      <Grid item xs={12} sm={6} md={4}>
                          <FormControlLabel
                              control={
                                  <Checkbox
                                      checked={shareProfileDataOptions.preferences}
                                      onChange={handleShareProfileChange}
                                      name="preferences"
                                  />
                              }
                              label="Preferences (Fav Days/Muscles)"
                          />
                      </Grid>
                  </Grid>
              </FormGroup>
          )}
           {!profileLoading && !profileError && !userProfileData && (
                <Typography variant="caption" color="text.secondary">
                   Complete your profile to enable personalization.
                    <Tooltip title="Profile data like age, weight, fitness level, goals, and health information can significantly improve the AI's ability to create a suitable workout plan for you.">
                       <IconButton size="small"><InfoIcon fontSize="inherit" /></IconButton>
                   </Tooltip>
               </Typography>
           )}


         <Button
           variant="contained"
           onClick={handleGenerateAIWorkout}
           disabled={aiLoading || !userPrompt}
           startIcon={aiLoading ? <CircularProgress size={20} color="inherit" /> : <AutoFixHighIcon />}
           sx={{ mt: 3, mr: 1 }}
         >
           {aiLoading ? 'Generating...' : 'Generate Workout'}
         </Button>
          {generatedWorkout && (
            <Button variant="outlined" color="secondary" onClick={resetAiForm} sx={{ mt: 3 }}>
              Clear AI Form
            </Button>
          )}

          {aiError && <Alert severity="error" sx={{ mt: 2 }}>{aiError}</Alert>}

          {generatedWorkout && renderGeneratedWorkout()}
        </Paper>
      )}

      <Divider sx={{ my: 3 }} />

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {generatedWorkout ? 'Generated Workout Plan (Editable)' : 'Workout Details (Manual)'}
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>Workout template created successfully!</Alert>}
        
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Workout Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              variant="outlined"
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description (Optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              variant="outlined"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Estimated Duration (minutes)"
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : Number(e.target.value))}
              variant="outlined"
              InputProps={{ inputProps: { min: 0 } }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormGroup>
              <FormControlLabel 
                control={<Switch checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />} 
                label="Publish this template? (Make public)" 
              />
            </FormGroup>
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Exercises
        </Typography>
        
        {exercises.length === 0 ? (
          <Typography>No exercises added yet.</Typography>
        ) : (
          <List disablePadding>
            {exercises.map((exercise, index) => (
              <Paper key={index} variant="outlined" sx={{ mb: 2, p: 2 }}>
                <ListItem disableGutters>
                  <ListItemText 
                    primary={`${index + 1}. ${getExerciseNameById(exercise.exercise_id)}`}
                    secondary={`
                      ${exercise.set_details ? `${exercise.set_details.length} Sets (Detailed)` : `${exercise.sets} Sets`}
                      ${exercise.set_details ? '' : ` x ${exercise.reps} Reps`}
                      ${exercise.weight !== undefined ? ` | Weight: ${exercise.weight}kg` : ''}
                      ${exercise.rest_time_seconds !== undefined ? ` | Rest: ${exercise.rest_time_seconds}s` : ''}
                      ${exercise.notes ? ` | Notes: ${exercise.notes}` : ''}
                    `}
                    secondaryTypographyProps={{ whiteSpace: 'pre-line' }}
                  />
                  <ListItemSecondaryAction>
                    <IconButton edge="end" aria-label="delete" onClick={() => removeExercise(index)}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                 {exercise.set_details && (
                   <Box sx={{ pl: 2, mt: 1 }}>
                     <Typography variant="caption">Detailed Sets:</Typography>
                     <Table size="small">
                       <TableHead>
                         <TableRow>
                           <TableCell>Set</TableCell>
                           <TableCell>Reps</TableCell>
                           <TableCell>Weight (kg)</TableCell>
                           <TableCell>Rest (s)</TableCell>
                         </TableRow>
                       </TableHead>
                       <TableBody>
                         {exercise.set_details.map((set, setIndex) => (
                           <TableRow key={setIndex}>
                             <TableCell>{set.set_number}</TableCell>
                             <TableCell>{set.reps}</TableCell>
                             <TableCell>{set.weight ?? '-'}</TableCell>
                             <TableCell>{set.rest_time_seconds ?? '-'}</TableCell>
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </Box>
                 )}
              </Paper>
            ))}
          </List>
        )}

        <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">Exercises</Typography>
            <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={openAddExerciseDialog}
                disabled={showAiForm && !!generatedWorkout}
            >
                Add Exercise
            </Button>
            {showAiForm && !!generatedWorkout && (
                 <Typography variant="caption" color="text.secondary">
                    Apply or clear the generated workout to add exercises manually.
                 </Typography>
            )}
        </Box>

        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleCreateWorkout}
          disabled={loading || exercises.length === 0}
          sx={{ mt: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Create Workout Template'}
        </Button>
      </Paper>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add Exercise to Workout</DialogTitle>
        <DialogContent>
          <TextField
            label="Search Exercises (Name, Muscle Group, Category)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
          />
          <FormControl fullWidth margin="normal" variant="outlined">
            <InputLabel id="select-exercise-label">Select Exercise *</InputLabel>
            <Select
              labelId="select-exercise-label"
              value={selectedExerciseId}
              onChange={(e) => setSelectedExerciseId(e.target.value as number)}
              label="Select Exercise *"
              required
            >
              {filteredExercises.length > 0 ? (
                filteredExercises.map((ex) => (
                  <MenuItem key={ex.id} value={ex.id}>
                    {ex.name} ({ex.category || 'N/A'}) - [{ex.muscle_groups || 'N/A'}]
                  </MenuItem>
                ))
              ) : (
                <MenuItem disabled>No exercises match search or none loaded.</MenuItem>
              )}
            </Select>
          </FormControl>
          
           <FormGroup>
             <FormControlLabel 
               control={<Switch checked={showDetailedSets} onChange={(e) => setShowDetailedSets(e.target.checked)} />} 
               label="Enter Detailed Sets (Varying Reps/Weight/Rest per set)"
               sx={{ mt: 1, mb: 1}}
             />

            {!showDetailedSets ? (
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Sets *"
                    type="number"
                    value={sets}
                    onChange={(e) => setSets(Number(e.target.value))}
                    fullWidth
                    required
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Reps *"
                    type="number"
                    value={reps}
                    onChange={(e) => setReps(Number(e.target.value))}
                    fullWidth
                    required
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Weight (kg, optional)"
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value === '' ? '' : Number(e.target.value))}
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <TextField
                    label="Rest (s, optional)"
                    type="number"
                    value={restTimeSeconds}
                    onChange={(e) => setRestTimeSeconds(e.target.value === '' ? '' : Number(e.target.value))}
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                  />
                </Grid>
              </Grid>
            ) : (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">Detailed Sets:</Typography>
                {exerciseSets.map((set, index) => (
                  <Stack key={index} direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography sx={{ minWidth: '50px' }}>Set {set.setNumber}</Typography>
                    <TextField 
                      label="Reps" 
                      size="small" 
                      type="number" 
                      value={set.reps}
                      onChange={(e) => updateSetValue(index, 'reps', e.target.value)}
                      sx={{ width: '100px' }}
                    />
                    <TextField 
                      label="Weight" 
                      size="small" 
                      type="number" 
                      value={set.weight}
                      onChange={(e) => updateSetValue(index, 'weight', e.target.value)}
                      sx={{ width: '100px' }}
                    />
                    <TextField 
                      label="Rest (s)" 
                      size="small" 
                      type="number" 
                      value={set.restTimeSeconds}
                      onChange={(e) => updateSetValue(index, 'restTimeSeconds', e.target.value)}
                      sx={{ width: '100px' }}
                    />
                    {exerciseSets.length > 1 && (
                      <Tooltip title="Remove Set">
                        <IconButton size="small" onClick={() => removeSet(index)} color="error">
                          <RemoveIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                ))}
                <Button size="small" startIcon={<AddIcon />} onClick={addSet} sx={{mt: 1}}>
                  Add Another Set
                </Button>
              </Box>
            )}

            <TextField
              label="Notes (Optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              fullWidth
              multiline
              rows={2}
              margin="normal"
            />
           </FormGroup>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button onClick={addExerciseToWorkout} disabled={selectedExerciseId === ''}>Add Exercise</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CreateWorkoutPage; 