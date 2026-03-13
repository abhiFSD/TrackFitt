import React from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import YouTubeIcon from '@mui/icons-material/YouTube';
import { Exercise } from '../../interfaces';
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

interface ExerciseDetailModalProps {
  open: boolean;
  onClose: () => void;
  exercise: Exercise | null;
}

const ExerciseDetailModal: React.FC<ExerciseDetailModalProps> = ({ 
  open, 
  onClose, 
  exercise
}) => {
  if (!exercise) return null;
  
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '16px',
          maxHeight: '95vh',
          overflowY: 'auto',
          m: { xs: 1, sm: 2 }
        }
      }}
    >
      <DialogTitle sx={{ 
        borderBottom: '2px solid',
        borderColor: 'primary.main',
        p: 3,
        backgroundColor: 'primary.light',
        color: 'primary.contrastText',
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <Typography variant="h6">Exercise Details</Typography>
        <IconButton onClick={onClose} size="small" color="inherit">
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ p: 0 }}>
        <Box>
          {/* Exercise header section with background color */}
          <Box 
            sx={{ 
              background: 'linear-gradient(to right, #f5f5f5, #e0e0e0)',
              p: 3,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Typography 
              variant="h4" 
              fontWeight="bold"
              sx={{ 
                fontSize: { xs: '1.5rem', sm: '2rem' },
                lineHeight: 1.2,
                mb: 2,
                color: 'text.primary'
              }}
            >
              {exercise.name}
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              <Chip 
                label={exercise.category || 'Uncategorized'} 
                color="primary" 
                sx={{ 
                  borderRadius: '20px',
                  fontWeight: 'bold',
                  px: 1
                }}
              />
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
                  sx={{ 
                    borderRadius: '20px',
                    fontWeight: 'bold',
                    px: 1
                  }}
                />
              )}
            </Box>
            
            <Typography 
              sx={{ 
                fontSize: '1rem', 
                mt: 2,
                lineHeight: 1.5,
                fontStyle: 'italic'
              }}
            >
              {exercise.description || 'No description available'}
            </Typography>
          </Box>
          
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              {/* Only render the image section if there's an image */}
              {exercise.image_url && (
                <Grid item xs={12} md={6}>
                  <Box 
                    sx={{ 
                      borderRadius: '12px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                      mb: 3,
                      position: 'relative'
                    }}
                  >
                    <img
                      src={exercise.image_url}
                      alt={exercise.name}
                      style={{ 
                        width: '100%', 
                        objectFit: 'contain',
                        maxHeight: '400px',
                        display: 'block',
                        margin: '0 auto'
                      }}
                    />
                  </Box>
                </Grid>
              )}
              
              <Grid item xs={12} md={exercise.image_url ? 6 : 12}>
                <Box 
                  sx={{ 
                    backgroundColor: '#f8f8f8',
                    borderRadius: '12px',
                    p: 3,
                    mb: 3,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    gutterBottom
                    sx={{ 
                      borderBottom: '2px solid',
                      borderColor: 'primary.main',
                      pb: 1,
                      display: 'inline-block'
                    }}
                  >
                    Equipment
                  </Typography>
                  <Typography sx={{ mt: 1, fontWeight: 500 }}>
                    {exercise.equipment || 'No equipment required'}
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    backgroundColor: '#f8f8f8',
                    borderRadius: '12px',
                    p: 3,
                    mb: 3,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    gutterBottom
                    sx={{ 
                      borderBottom: '2px solid',
                      borderColor: 'primary.main',
                      pb: 1,
                      display: 'inline-block'
                    }}
                  >
                    Muscle Groups
                  </Typography>
                  
                  <Stack 
                    direction="row" 
                    spacing={1} 
                    flexWrap="wrap" 
                    sx={{ mt: 2, gap: 1 }}
                  >
                    {parseMuscleGroups(exercise.muscle_groups).map((muscle, index) => (
                      <Chip 
                        key={index}
                        label={`${muscle.name} (${muscle.primary}/10)`}
                        size="medium"
                        sx={{ 
                          mb: 1,
                          borderRadius: '20px',
                          fontWeight: 'bold',
                          height: 'auto',
                          py: 0.75,
                          px: 0.5,
                          backgroundColor: getIntensityColor(muscle.primary),
                          color: muscle.primary > 6 ? 'white' : 'rgba(0,0,0,0.87)'
                        }}
                      />
                    ))}
                  </Stack>
                  
                  {/* Muscle visualization with react-body-highlighter */}
                  <Box sx={{ 
                    mt: 2,
                    display: 'flex',
                    flexDirection: { xs: 'column', sm: 'row' },
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 2
                  }}>
                    {(() => {
                      const muscleGroups = parseMuscleGroups(exercise.muscle_groups);
                      
                      // Group muscles by intensity to create different colored groups
                      // We'll create an object with intensity levels as keys and arrays of muscle names as values
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
                        <>
                          <Box sx={{ 
                            width: { xs: '100%', sm: '48%' }, 
                            textAlign: 'center',
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            p: 1,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}>
                            <Typography 
                              variant="subtitle2" 
                              color="text.secondary" 
                              mb={1} 
                              fontWeight="bold"
                            >
                              Front View
                            </Typography>
                            <Model
                              data={highlighterData}
                              type="anterior"
                              style={{ 
                                width: '100%', 
                                height: '140px',
                                maxWidth: '100%' 
                              }}
                              highlightedColors={highlightedColors}
                            />
                          </Box>
                          <Box sx={{ 
                            width: { xs: '100%', sm: '48%' }, 
                            textAlign: 'center',
                            backgroundColor: '#fff',
                            borderRadius: '8px',
                            p: 1,
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}>
                            <Typography 
                              variant="subtitle2" 
                              color="text.secondary" 
                              mb={1} 
                              fontWeight="bold"
                            >
                              Back View
                            </Typography>
                            <Model
                              data={highlighterData}
                              type="posterior"
                              style={{ 
                                width: '100%', 
                                height: '140px',
                                maxWidth: '100%'
                              }}
                              highlightedColors={highlightedColors}
                            />
                          </Box>
                        </>
                      );
                    })()}
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box 
                  sx={{ 
                    backgroundColor: '#f8f8f8',
                    borderRadius: '12px',
                    p: 3,
                    mb: 3,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    gutterBottom
                    sx={{ 
                      borderBottom: '2px solid',
                      borderColor: 'primary.main',
                      pb: 1,
                      display: 'inline-block'
                    }}
                  >
                    Instructions
                  </Typography>
                  <Typography
                    sx={{ 
                      lineHeight: 1.8,
                      mt: 2,
                      pl: 2,
                      borderLeft: '3px solid',
                      borderColor: 'primary.light',
                      fontSize: '0.95rem'
                    }}
                    dangerouslySetInnerHTML={{
                      __html: exercise.instructions?.replace(/\n/g, '<br>') || 'No instructions available'
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box 
                  sx={{ 
                    backgroundColor: '#f8f8f8',
                    borderRadius: '12px',
                    p: 3,
                    mb: 3,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    height: '100%'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    gutterBottom
                    sx={{ 
                      borderBottom: '2px solid',
                      borderColor: 'primary.main',
                      pb: 1,
                      display: 'inline-block'
                    }}
                  >
                    Form Tips
                  </Typography>
                  <Typography 
                    sx={{ 
                      mt: 2,
                      fontSize: '0.95rem',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {exercise.form_tips || 'No form tips available'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Box 
                  sx={{ 
                    backgroundColor: '#f8f8f8',
                    borderRadius: '12px',
                    p: 3,
                    mb: 3,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                    height: '100%'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    gutterBottom
                    sx={{ 
                      borderBottom: '2px solid',
                      borderColor: 'primary.main',
                      pb: 1,
                      display: 'inline-block'
                    }}
                  >
                    Common Mistakes
                  </Typography>
                  <Typography 
                    sx={{ 
                      mt: 2,
                      fontSize: '0.95rem',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {exercise.common_mistakes || 'No common mistakes listed'}
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12}>
                <Box 
                  sx={{ 
                    backgroundColor: '#f8f8f8',
                    borderRadius: '12px',
                    p: 3,
                    mb: 3,
                    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    fontWeight="bold" 
                    gutterBottom
                    sx={{ 
                      borderBottom: '2px solid',
                      borderColor: 'primary.main',
                      pb: 1,
                      display: 'inline-block'
                    }}
                  >
                    Variations
                  </Typography>
                  <Typography 
                    sx={{ 
                      mt: 2,
                      fontSize: '0.95rem',
                      whiteSpace: 'pre-line'
                    }}
                  >
                    {exercise.variations || 'No variations listed'}
                  </Typography>
                </Box>
              </Grid>
              
              {exercise.video_url && (
                <Grid item xs={12}>
                  <Box 
                    sx={{ 
                      backgroundColor: '#f0f7ff',
                      borderRadius: '12px',
                      p: 3,
                      textAlign: 'center',
                      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                    }}
                  >
                    <Typography 
                      variant="h6" 
                      fontWeight="bold" 
                      gutterBottom
                      sx={{ color: 'primary.dark' }}
                    >
                      Video Demonstration
                    </Typography>
                    <Button 
                      variant="contained" 
                      color="primary"
                      href={exercise.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      size="large"
                      startIcon={<YouTubeIcon />}
                      sx={{
                        borderRadius: '30px',
                        textTransform: 'none',
                        py: 1.5,
                        px: 4,
                        mt: 1,
                        fontWeight: 'bold',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                      }}
                    >
                      Watch Video
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions sx={{ 
        p: 3,
        borderTop: '1px solid',
        borderColor: 'divider',
        justifyContent: 'center'
      }}>
        <Button 
          onClick={onClose}
          variant="contained"
          color="primary"
          size="large"
          sx={{
            borderRadius: '30px',
            textTransform: 'none',
            py: 1,
            px: 4,
            minWidth: '150px',
            fontWeight: 'bold',
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExerciseDetailModal; 