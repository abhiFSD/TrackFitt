import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  FormHelperText
} from '@mui/material';

interface PreferencesFormProps {
  formData: {
    preferred_workout_duration: number;
    preferred_workout_days: string[];
    favorite_muscle_groups: string[];
    [key: string]: any;
  };
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: unknown) => void;
}

const daysOfWeek = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const muscleGroups = [
  'Chest', 'Back', 'Shoulders', 'Arms', 'Abs', 'Legs', 'Glutes', 'Calves', 
  'Full Body', 'Upper Body', 'Lower Body', 'Core'
];

const PreferencesForm: React.FC<PreferencesFormProps> = ({ 
  formData, 
  handleInputChange, 
  handleSelectChange 
}) => {
  const handleDurationChange = (_: Event, newValue: number | number[]) => {
    // Create a custom event object to pass to handleInputChange
    const event = {
      target: {
        name: 'preferred_workout_duration',
        value: newValue,
        type: 'number'
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    handleInputChange(event);
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Workout Preferences
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Let us know your preferences to customize your workout experience.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Typography id="workout-duration-slider" gutterBottom>
            Preferred Workout Duration (minutes)
          </Typography>
          <Slider
            aria-labelledby="workout-duration-slider"
            value={formData.preferred_workout_duration || 45}
            onChange={handleDurationChange}
            valueLabelDisplay="auto"
            step={5}
            marks={[
              { value: 15, label: '15m' },
              { value: 30, label: '30m' },
              { value: 45, label: '45m' },
              { value: 60, label: '60m' },
              { value: 90, label: '90m' },
              { value: 120, label: '120m' }
            ]}
            min={15}
            max={120}
          />
          <FormHelperText>
            How long do you prefer your workouts to be? (Current: {formData.preferred_workout_duration || 45} minutes)
          </FormHelperText>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="preferred-days-label">Preferred Workout Days</InputLabel>
            <Select
              labelId="preferred-days-label"
              id="preferred_workout_days"
              multiple
              value={formData.preferred_workout_days || []}
              onChange={(e) => handleSelectChange('preferred_workout_days', e.target.value)}
              input={<OutlinedInput id="select-multiple-days" label="Preferred Workout Days" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {daysOfWeek.map((day) => (
                <MenuItem key={day} value={day}>
                  {day}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Select the days you prefer to work out</FormHelperText>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth>
            <InputLabel id="favorite-muscles-label">Favorite Muscle Groups</InputLabel>
            <Select
              labelId="favorite-muscles-label"
              id="favorite_muscle_groups"
              multiple
              value={formData.favorite_muscle_groups || []}
              onChange={(e) => handleSelectChange('favorite_muscle_groups', e.target.value)}
              input={<OutlinedInput id="select-multiple-muscles" label="Favorite Muscle Groups" />}
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => (
                    <Chip key={value} label={value} />
                  ))}
                </Box>
              )}
            >
              {muscleGroups.map((group) => (
                <MenuItem key={group} value={group}>
                  {group}
                </MenuItem>
              ))}
            </Select>
            <FormHelperText>Select the muscle groups you enjoy training most</FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PreferencesForm; 