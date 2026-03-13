import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Alert,
  TablePagination,
  Chip,
  Tooltip,
  CircularProgress,
  FormControlLabel,
  Switch,
  Snackbar,
  InputAdornment,
} from '@mui/material';
import {
  Edit as EditIcon,
  Visibility as ViewIcon,
  Delete,
  Search,
  Add as AddIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { exerciseAPI } from '../services/api';
import { Exercise, ExerciseCreate, ExerciseCategory } from '../interfaces';
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

const AdminExercisesPage: React.FC = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter states
  const [filters, setFilters] = useState({
    category: '',
    category_id: undefined as number | undefined,
    difficulty: '',
    equipment: '',
    equipment_id: undefined as number | undefined,
    search: '',
    muscle_group: ''
  });
  
  // Selected exercise for viewing/editing
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  
  // New state for category management
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  
  const [editForm, setEditForm] = useState<ExerciseCreate>({
    name: '',
    description: '',
    category: '',
    category_id: undefined,
    difficulty: '',
    equipment: '',
    instructions: '',
    image_url: '',
    video_url: '',
    form_tips: '',
    common_mistakes: '',
    variations: '',
    muscle_groups: ''
  });
  const [addForm, setAddForm] = useState<ExerciseCreate>({
    name: '',
    description: '',
    category: '',
    category_id: undefined,
    difficulty: '',
    equipment: '',
    instructions: '',
    image_url: '',
    video_url: '',
    form_tips: '',
    common_mistakes: '',
    variations: '',
    muscle_groups: ''
  });
  
  // Categories for filter dropdown
  const [categories, setCategories] = useState<string[]>([]);
  
  // Add new state for exercise categories
  const [exerciseCategories, setExerciseCategories] = useState<ExerciseCategory[]>([]);
  
  // Add state for muscle groups
  const [muscleGroups, setMuscleGroups] = useState<{id: number, name: string, body_part: string, description: string}[]>([]);
  
  // Add state for equipment
  const [equipmentList, setEquipmentList] = useState<{id: number, name: string, description: string, icon_url: string}[]>([]);
  
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
      const data = await exerciseAPI.getExercises();
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
      // Fetch legacy categories for backward compatibility
      const legacyCategories = await exerciseAPI.getExerciseCategories();
      setCategories(legacyCategories);
      
      // Fetch the new category objects
      const categoryObjects = await exerciseAPI.getAllExerciseCategories();
      setExerciseCategories(categoryObjects);
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
      category: '',
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
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleViewExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setViewDialogOpen(true);
  };
  
  const handleEditExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setEditForm({
      name: exercise.name,
      description: exercise.description || '',
      category: exercise.category || '',
      category_id: exercise.category_id,
      difficulty: exercise.difficulty || '',
      equipment: exercise.equipment || '',
      instructions: exercise.instructions || '',
      image_url: exercise.image_url || '',
      video_url: exercise.video_url || '',
      form_tips: exercise.form_tips || '',
      common_mistakes: exercise.common_mistakes || '',
      variations: exercise.variations || '',
      muscle_groups: exercise.muscle_groups || ''
    });
    setEditDialogOpen(true);
  };
  
  const handleSaveExercise = async () => {
    if (!selectedExercise) return;
    
    try {
      setLoading(true);
      await exerciseAPI.updateExercise(selectedExercise.id, editForm);
      setEditDialogOpen(false);
      await fetchExercises();
      setError(null);
    } catch (err) {
      setError('Failed to update exercise');
      console.error('Error updating exercise:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleAddExercise = () => {
    // Reset the add form
    setAddForm({
      name: '',
      description: '',
      category: '',
      difficulty: '',
      equipment: '',
      instructions: '',
      image_url: '',
      video_url: '',
      form_tips: '',
      common_mistakes: '',
      variations: '',
      muscle_groups: '',
      category_id: undefined,
    });
    setAddDialogOpen(true);
  };
  
  const handleCreateExercise = async () => {
    try {
      setLoading(true);
      await exerciseAPI.createExercise(addForm);
      setAddDialogOpen(false);
      await fetchExercises();
      setError(null);
    } catch (err) {
      setError('Failed to create exercise');
      console.error('Error creating exercise:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Add handlers for category management
  const handleOpenCategoryDialog = () => {
    setSelectedCategory(null);
    setCategoryForm({ name: '', description: '' });
    setCategoryDialogOpen(true);
  };
  
  const handleEditCategory = (category: ExerciseCategory) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || '',
    });
    setCategoryDialogOpen(true);
  };
  
  const handleSaveCategory = async () => {
    try {
      setLoading(true);
      
      if (selectedCategory) {
        // Update existing category
        await exerciseAPI.updateExerciseCategory(selectedCategory.id, categoryForm);
      } else {
        // Create new category
        await exerciseAPI.createExerciseCategory(categoryForm);
      }
      
      setCategoryDialogOpen(false);
      await fetchCategories();
      setError(null);
    } catch (err) {
      setError(`Failed to ${selectedCategory ? 'update' : 'create'} category`);
      console.error(`Error ${selectedCategory ? 'updating' : 'creating'} category:`, err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteCategory = async (categoryId: number) => {
    try {
      setLoading(true);
      await exerciseAPI.deleteExerciseCategory(categoryId);
      await fetchCategories();
      setError(null);
    } catch (err) {
      setError('Failed to delete category');
      console.error('Error deleting category:', err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4">
          Exercise Management
        </Typography>
        <Box>
          <Button 
            variant="outlined" 
            color="primary" 
            onClick={handleOpenCategoryDialog}
            sx={{ mr: 2 }}
          >
            Manage Categories
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleAddExercise}
          >
            Add Exercise
          </Button>
        </Box>
      </Box>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={2}>
            <TextField
              fullWidth
              label="Search"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={4} md={2}>
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
          <Grid item xs={12} sm={4} md={2}>
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
          <Grid item xs={12} sm={4} md={2}>
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
          <Grid item xs={12} sm={4} md={2}>
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
          <Grid item xs={12} sm={4} md={2}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button 
                variant="contained" 
                onClick={applyFilters}
                size="small"
                fullWidth
              >
                Filter
              </Button>
              <Button 
                variant="outlined" 
                onClick={resetFilters}
                size="small"
                fullWidth
              >
                Reset
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Exercises Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={80}>Image</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Difficulty</TableCell>
                <TableCell>Equipment</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && exercises.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <CircularProgress size={24} sx={{ my: 2 }} />
                  </TableCell>
                </TableRow>
              ) : exercises.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No exercises found
                  </TableCell>
                </TableRow>
              ) : (
                exercises
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((exercise) => (
                    <TableRow key={exercise.id}>
                      <TableCell>
                        {exercise.image_url ? (
                          <Box
                            component="img"
                            src={exercise.image_url}
                            alt={exercise.name}
                            sx={{ 
                              width: 60, 
                              height: 60, 
                              objectFit: 'cover',
                              borderRadius: 1,
                              border: '1px solid #e0e0e0'
                            }}
                          />
                        ) : (
                          <Box 
                            sx={{ 
                              width: 60, 
                              height: 60, 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              bgcolor: 'grey.100',
                              borderRadius: 1,
                              border: '1px solid #e0e0e0',
                              overflow: 'hidden'
                            }}
                          >
                            {(() => {
                              const muscleGroups = parseMuscleGroups(exercise.muscle_groups);
                              
                              if (muscleGroups.length === 0) {
                                return (
                                  <Typography variant="caption" color="text.secondary">
                                    No image
                                  </Typography>
                                );
                              }
                              
                              // Create the data format expected by react-body-highlighter
                              const highlighterData = [{
                                name: exercise.name,
                                muscles: muscleGroups
                                  .map(m => mapMuscleGroupToBodyHighlighter(m.name))
                                  .filter(Boolean) as Muscle[]
                              }];
                              
                              return (
                                <Model
                                  data={highlighterData}
                                  type="anterior"
                                  style={{ 
                                    width: '100%',
                                    height: '100%'
                                  }}
                                  highlightedColors={[
                                    '#d32f2f', // Very high intensity (red)
                                    '#f44336', // High intensity
                                    '#e57373', // Medium intensity
                                    '#ffcdd2', // Low intensity
                                  ]}
                                />
                              );
                            })()}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>{exercise.name}</TableCell>
                      <TableCell>
                        {exercise.category_relation ? exercise.category_relation.name : exercise.category || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {exercise.difficulty && (
                          <Chip
                            label={exercise.difficulty}
                            color={
                              exercise.difficulty === 'Beginner'
                                ? 'success'
                                : exercise.difficulty === 'Intermediate'
                                ? 'primary'
                                : 'error'
                            }
                            size="small"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {exercise.equipment ? (
                          <Tooltip 
                            title={
                              equipmentList.find(e => e.name === exercise.equipment)?.description || 
                              "Equipment information"
                            } 
                            arrow
                          >
                            <Box component="span">
                              {exercise.equipment}
                            </Box>
                          </Tooltip>
                        ) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton onClick={() => handleViewExercise(exercise)} size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Exercise">
                          <IconButton onClick={() => handleEditExercise(exercise)} size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={exercises.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
      
      {/* View Exercise Dialog */}
      <ExerciseDetailModal
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        exercise={selectedExercise}
      />
      
      {/* Edit Exercise Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Edit Exercise</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={editForm.category}
                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                sx={{ display: 'none' }} // Hide the legacy category field
              />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category_id"
                  value={editForm.category_id || ''}
                  label="Category"
                  onChange={(e) => {
                    const categoryId = e.target.value as number;
                    // Find the category name for backward compatibility
                    const category = exerciseCategories.find(c => c.id === categoryId);
                    setEditForm({ 
                      ...editForm, 
                      category_id: categoryId,
                      category: category ? category.name : ''
                    });
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  {exerciseCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  name="difficulty"
                  value={editForm.difficulty}
                  label="Difficulty"
                  onChange={(e) => setEditForm({ ...editForm, difficulty: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {difficultyOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Equipment"
                name="equipment"
                value={editForm.equipment}
                onChange={(e) => setEditForm({ ...editForm, equipment: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                name="instructions"
                value={editForm.instructions}
                onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
                multiline
                rows={4}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Image URL"
                name="image_url"
                value={editForm.image_url}
                onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Video URL"
                name="video_url"
                value={editForm.video_url}
                onChange={(e) => setEditForm({ ...editForm, video_url: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Muscle Groups"
                name="muscle_groups"
                value={editForm.muscle_groups || ''}
                onChange={(e) => setEditForm({ ...editForm, muscle_groups: e.target.value })}
                multiline
                rows={2}
                helperText="Format: [{'name':'Chest','primary':8},{'name':'Triceps','primary':6}]"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Form Tips"
                name="form_tips"
                value={editForm.form_tips}
                onChange={(e) => setEditForm({ ...editForm, form_tips: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Common Mistakes"
                name="common_mistakes"
                value={editForm.common_mistakes}
                onChange={(e) => setEditForm({ ...editForm, common_mistakes: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Variations"
                name="variations"
                value={editForm.variations}
                onChange={(e) => setEditForm({ ...editForm, variations: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveExercise} variant="contained" color="primary">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Add Exercise Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => setAddDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Add New Exercise</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Name"
                name="name"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                required
                error={!addForm.name}
                helperText={!addForm.name ? "Name is required" : ""}
              />
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Category"
                name="category"
                value={addForm.category}
                onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                sx={{ display: 'none' }} // Hide the legacy category field
              />
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category_id"
                  value={addForm.category_id || ''}
                  label="Category"
                  onChange={(e) => {
                    const categoryId = e.target.value as number;
                    // Find the category name for backward compatibility
                    const category = exerciseCategories.find(c => c.id === categoryId);
                    setAddForm({ 
                      ...addForm, 
                      category_id: categoryId,
                      category: category ? category.name : ''
                    });
                  }}
                >
                  <MenuItem value="">None</MenuItem>
                  {exerciseCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select
                  name="difficulty"
                  value={addForm.difficulty}
                  label="Difficulty"
                  onChange={(e) => setAddForm({ ...addForm, difficulty: e.target.value })}
                >
                  <MenuItem value="">None</MenuItem>
                  {difficultyOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="Equipment"
                name="equipment"
                value={addForm.equipment}
                onChange={(e) => setAddForm({ ...addForm, equipment: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={addForm.description}
                onChange={(e) => setAddForm({ ...addForm, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Instructions"
                name="instructions"
                value={addForm.instructions}
                onChange={(e) => setAddForm({ ...addForm, instructions: e.target.value })}
                multiline
                rows={4}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Image URL"
                name="image_url"
                value={addForm.image_url}
                onChange={(e) => setAddForm({ ...addForm, image_url: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Video URL"
                name="video_url"
                value={addForm.video_url}
                onChange={(e) => setAddForm({ ...addForm, video_url: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Muscle Groups"
                name="muscle_groups"
                value={addForm.muscle_groups || ''}
                onChange={(e) => setAddForm({ ...addForm, muscle_groups: e.target.value })}
                multiline
                rows={2}
                helperText="Format: [{'name':'Chest','primary':8},{'name':'Triceps','primary':6}]"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Form Tips"
                name="form_tips"
                value={addForm.form_tips}
                onChange={(e) => setAddForm({ ...addForm, form_tips: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Common Mistakes"
                name="common_mistakes"
                value={addForm.common_mistakes}
                onChange={(e) => setAddForm({ ...addForm, common_mistakes: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Variations"
                name="variations"
                value={addForm.variations}
                onChange={(e) => setAddForm({ ...addForm, variations: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateExercise} 
            variant="contained" 
            color="primary"
            disabled={!addForm.name}
          >
            Create Exercise
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Category Management Dialog */}
      <Dialog
        open={categoryDialogOpen}
        onClose={() => setCategoryDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {selectedCategory ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Category Name"
                name="name"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                required
                error={!categoryForm.name}
                helperText={!categoryForm.name ? "Name is required" : ""}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
          
          {exerciseCategories.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Existing Categories
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {exerciseCategories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell>{category.name}</TableCell>
                        <TableCell>{category.description || '-'}</TableCell>
                        <TableCell align="right">
                          <IconButton 
                            size="small" 
                            onClick={() => handleEditCategory(category)}
                            color="primary"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
                                handleDeleteCategory(category.id);
                              }
                            }}
                            color="error"
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCategoryDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleSaveCategory} 
            variant="contained" 
            color="primary"
            disabled={!categoryForm.name}
          >
            {selectedCategory ? 'Update Category' : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminExercisesPage; 