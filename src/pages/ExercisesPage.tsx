import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  CardMedia,
  CardActionArea,
  Paper,
  Button,
  CircularProgress,
  Chip,
  Alert,
  Divider,
  Avatar,
  Stack,
  Tooltip
} from '@mui/material';
import { exerciseAPI } from '../services/api';
import { Exercise, ExerciseCategory } from '../interfaces';
import { ExerciseDetailModal } from '../components/common';
import Model, { IExerciseData, Muscle } from 'react-body-highlighter';

// Add the following helper function to parse muscle groups
const parseMuscleGroups = (muscleGroupsString?: string): Array<{name: string, primary: number}> => {
  if (!muscleGroupsString) return [];
  
  try {
    // Try to parse the JSON format if it's in the format from the CSV
    if (muscleGroupsString.includes('"M":{')) {
      const regex = /"name":\s*{\s*"S":\s*"([^"]+)"\s*},\s*"primary":\s*{\s*"N":\s*"(\d+)"\s*}/g;
      
      // Use a more compatible approach instead of matchAll
      const matches: Array<{name: string, primary: number}> = [];
      let match;
      
      while ((match = regex.exec(muscleGroupsString)) !== null) {
        matches.push({
          name: match[1],
          primary: parseInt(match[2], 10)
        });
      }
      
      return matches;
    }
    
    // If it's already in JSON array format, parse it directly
    return JSON.parse(muscleGroupsString);
  } catch (e) {
    // If parsing fails, just return an empty array
    console.error('Error parsing muscle groups:', e);
    return [];
  }
};

// Function to get color based on intensity (1-10)
const getIntensityColor = (intensity: number): string => {
  const colors = {
    10: '#d32f2f', // Very high (intense red)
    9: '#e53935',
    8: '#f44336',
    7: '#ef5350',
    6: '#e57373', // Medium
    5: '#ef9a9a',
    4: '#ffcdd2',
    3: '#ffebee',
    2: '#fff5f5',
    1: '#ffffff', // Very low (light red)
  };
  
  return colors[intensity as keyof typeof colors] || '#ffebee';
};

// This function maps our muscle group names to the ones used by react-body-highlighter
const mapMuscleGroupToBodyHighlighter = (muscleName: string): Muscle | null => {
  const muscleMap: Record<string, Muscle> = {
    'Abs': 'abs',
    'Abdominals': 'abs',
    'Rectus Abdominis': 'abs',
    'Transverse Abdominis': 'abs',
    'Biceps': 'biceps',
    'Brachialis': 'biceps',
    'Calves': 'calves',
    'Soleus': 'calves',
    'Chest': 'chest',
    'Pectorals': 'chest',
    'Core': 'abs',
    'Erector Spinae': 'lower-back',
    'Forearms': 'forearm',
    'Grip': 'forearm',
    'Glutes': 'gluteal',
    'Gluteus': 'gluteal',
    'Hamstrings': 'hamstring',
    'Hip Flexors': 'adductor',
    'Iliopsoas': 'adductor',
    'Lower Back': 'lower-back',
    'Lumbars': 'lower-back',
    'Middle Back': 'upper-back',
    'Neck': 'neck',
    'Obliques': 'obliques',
    'Quadriceps': 'quadriceps',
    'Quads': 'quadriceps',
    'Rear Deltoids': 'back-deltoids',
    'Rear Shoulders': 'back-deltoids',
    'Rotator Cuff': 'back-deltoids',
    'Serratus Anterior': 'chest',
    'Shoulders': 'front-deltoids',
    'Deltoids': 'front-deltoids',
    'Lateral Deltoids': 'front-deltoids',
    'Tibialis Anterior': 'calves',
    'Traps': 'trapezius',
    'Trapezius': 'trapezius',
    'Triceps': 'triceps',
    'Upper Back': 'upper-back',
    'Back': 'upper-back',
    'Lats': 'trapezius',
    'Latissimus Dorsi': 'trapezius',
    'Adductors': 'adductor',
    'Abductors': 'adductor',
    'Rhomboids': 'upper-back'
  };
  
  return muscleMap[muscleName] || null;
};

const ExercisesPage: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exerciseCategories, setExerciseCategories] = useState<ExerciseCategory[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [muscleGroups, setMuscleGroups] = useState<{id: number, name: string, body_part: string, description: string}[]>([]);
  const [equipmentList, setEquipmentList] = useState<{id: number, name: string, description: string, icon_url: string}[]>([]);
  
  // Filter states
  const [filters, setFilters] = useState({
    category_id: undefined as number | undefined,
    difficulty: '',
    equipment: '',
    equipment_id: undefined as number | undefined,
    search: '',
    muscle_group: ''
  });
  
  // Difficulty options
  const difficultyOptions = ['Beginner', 'Intermediate', 'Advanced'];
  
  useEffect(() => {
    fetchExercises();
    fetchCategories();
    fetchMuscleGroups();
    fetchEquipment();
  }, []);
  
  const fetchExercises = async () => {
    try {
      setLoading(true);
      const data = await exerciseAPI.getExercises(filters);
      setExercises(data);
      setError(null);
    } catch (err) {
      setError('Failed to load exercises');
      console.error('Error fetching exercises:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const response = await exerciseAPI.getAllExerciseCategories();
      setExerciseCategories(response);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  };
  
  const fetchMuscleGroups = async () => {
    try {
      const response = await exerciseAPI.getMuscleGroups();
      setMuscleGroups(response);
    } catch (err) {
      console.error('Error fetching muscle groups:', err);
    }
  };
  
  const fetchEquipment = async () => {
    try {
      const response = await exerciseAPI.getEquipment();
      setEquipmentList(response);
    } catch (err) {
      console.error('Error fetching equipment:', err);
    }
  };
  
  const applyFilters = async () => {
    try {
      setLoading(true);
      const data = await exerciseAPI.getExercises(filters);
      setExercises(data);
      setError(null);
    } catch (err) {
      setError('Failed to apply filters');
      console.error('Error applying filters:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const resetFilters = () => {
    setFilters({
      category_id: undefined,
      difficulty: '',
      equipment: '',
      equipment_id: undefined,
      search: '',
      muscle_group: ''
    });
    fetchExercises();
  };
  
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    const processedValue = name === 'category_id' ? (value === '' ? undefined : Number(value)) : value;
    setFilters(prev => ({ ...prev, [name]: processedValue }));
  };
  
  const handleExerciseClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setDialogOpen(true);
  };
  
  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography 
        variant="h4" 
        gutterBottom 
        fontWeight="bold"
        color="primary.dark"
        sx={{ mb: 3 }}
      >
        Exercise Library
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Filter Section */}
      <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: '12px' }}>
        <Typography 
          variant="h6" 
          sx={{ mb: 2, fontWeight: 'medium' }}
        >
          Filter Exercises
        </Typography>
        <Grid container spacing={2.5}>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Search Exercises"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              size="small"
              placeholder="Name or description"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                name="category_id"
                value={filters.category_id ?? ''}
                label="Category"
                onChange={handleSelectChange}
              >
                <MenuItem value="">All Categories</MenuItem>
                {exerciseCategories.map(category => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Difficulty</InputLabel>
              <Select
                name="difficulty"
                value={filters.difficulty}
                label="Difficulty"
                onChange={handleSelectChange}
              >
                <MenuItem value="">All Levels</MenuItem>
                {difficultyOptions.map(level => (
                  <MenuItem key={level} value={level}>
                    {level}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Equipment</InputLabel>
              <Select
                name="equipment_id"
                value={filters.equipment_id ?? ''}
                label="Equipment"
                onChange={handleSelectChange}
              >
                <MenuItem value="">All Equipment</MenuItem>
                {equipmentList.map(equip => (
                  <MenuItem key={equip.id} value={equip.id}>
                    <Tooltip title={equip.description || equip.name} placement="right" arrow>
                      <Box component="span" sx={{ width: '100%' }}>
                        {equip.name}
                      </Box>
                    </Tooltip>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Muscle Group</InputLabel>
              <Select
                name="muscle_group"
                value={filters.muscle_group}
                label="Muscle Group"
                onChange={handleSelectChange}
              >
                <MenuItem value="">All Muscle Groups</MenuItem>
                {muscleGroups.map(group => (
                  <MenuItem key={group.id} value={group.name}>
                    <Tooltip title={group.description || `${group.name} (${group.body_part})`} placement="right" arrow>
                      <Box component="span" sx={{ width: '100%' }}>
                        {group.name}
                      </Box>
                    </Tooltip>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2} sx={{ display: 'flex' }}>
            <Button
              fullWidth
              variant="contained"
              onClick={applyFilters}
              sx={{ mr: 1 }}
            >
              Filter
            </Button>
            <Button
              variant="outlined"
              onClick={resetFilters}
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Exercise List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <CircularProgress size={60} /> 
          <Typography sx={{ ml: 2 }}>Loading exercises...</Typography> 
        </Box>
      ) : exercises.length === 0 ? (
        <Typography sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
          No exercises found matching your criteria. Try adjusting the filters.
        </Typography>
      ) : (
        <Grid container spacing={3}>
          {exercises.map((exercise) => (
            <Grid item xs={12} sm={6} md={4} key={exercise.id}>
              <Card 
                elevation={2}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  borderRadius: '12px',
                  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                  }
                }}
              >
                <CardActionArea 
                  onClick={() => handleExerciseClick(exercise)} 
                  sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}
                >
                  {exercise.image_url ? (
                    <CardMedia
                      component="img"
                      image={exercise.image_url} 
                      alt={exercise.name}
                      sx={{ 
                        height: 180,
                        objectFit: 'contain',
                        bgcolor: '#f5f5f5'
                      }} 
                    />
                  ) : (
                    <Box
                      sx={{ 
                        height: 180,
                        backgroundColor: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      {(() => {
                        // Create data for muscle highlighter
                        const muscleGroups = parseMuscleGroups(exercise.muscle_groups);
                        
                        // Group muscles by intensity to create different colored groups
                        const musclesByIntensity: Record<number, Muscle[]> = {};
                        
                        // Process each muscle group and map it to its intensity
                        muscleGroups.forEach(muscle => {
                          const mappedMuscle = mapMuscleGroupToBodyHighlighter(muscle.name);
                          if (!mappedMuscle) return;
                          
                          // Initialize the array for this intensity if it doesn't exist
                          if (!musclesByIntensity[muscle.primary]) {
                            musclesByIntensity[muscle.primary] = [];
                          }
                          
                          // Add the muscle to its intensity group
                          musclesByIntensity[muscle.primary].push(mappedMuscle);
                        });
                        
                        // Convert the grouped muscles into the data format expected by react-body-highlighter
                        const highlighterData: IExerciseData[] = Object.entries(musclesByIntensity).map(
                          ([intensity, muscles]) => ({
                            name: `Intensity ${intensity}`,
                            muscles
                          })
                        );
                        
                        // Define color intensity levels - from highest to lowest intensity
                        const highlightedColors = [
                          '#d32f2f', // Very high intensity (dark red)
                          '#e53935',
                          '#f44336',
                          '#ef5350',
                          '#e57373',
                          '#ef9a9a', // Medium intensity
                          '#ffcdd2',
                          '#ffebee', // Low intensity
                        ];
                        
                        return (
                          <Box sx={{ width: '100%', height: '100%', display: 'flex', position: 'relative' }}>
                            <Box sx={{ 
                              width: '50%', 
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              position: 'relative'
                            }}>
                              <Model
                                data={highlighterData}
                                type="anterior"
                                style={{ 
                                  width: '100%',
                                  height: '140px'
                                }}
                                highlightedColors={highlightedColors}
                              />
                            </Box>
                            <Divider orientation="vertical" flexItem />
                            <Box sx={{ 
                              width: '50%', 
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <Model
                                data={highlighterData}
                                type="posterior"
                                style={{ 
                                  width: '100%',
                                  height: '140px'
                                }}
                                highlightedColors={highlightedColors}
                              />
                            </Box>
                          </Box>
                        );
                      })()}
                    </Box>
                  )}
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography 
                      gutterBottom 
                      variant="h6" 
                      component="div"
                      fontWeight="medium"
                      sx={{ 
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        minHeight: '3em'
                      }}
                    >
                      {exercise.name}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip 
                        label={exercise.category || 'Uncategorized'} 
                        size="small" 
                        color="primary" 
                        variant="outlined"
                        sx={{ borderRadius: '16px', fontWeight: 'medium' }} 
                      />
                      {exercise.difficulty && (
                        <Chip 
                          label={exercise.difficulty} 
                          size="small" 
                          color={
                            exercise.difficulty === 'Beginner' ? 'success' :
                            exercise.difficulty === 'Intermediate' ? 'warning' : 'error'
                          } 
                          variant="outlined"
                          sx={{ borderRadius: '16px', fontWeight: 'medium' }} 
                        />
                      )}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Exercise Detail Modal */}
      <ExerciseDetailModal 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        exercise={selectedExercise} 
      />
    </Box>
  );
};

export default ExercisesPage; 