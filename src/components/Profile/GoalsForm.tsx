import React from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Grid, 
  InputAdornment,
  Slider,
  FormHelperText,
  FormControl
} from '@mui/material';

interface GoalsFormProps {
  formData: {
    weight_goal_kg: string | number;
    weekly_workout_goal: number;
    [key: string]: any;
  };
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const GoalsForm: React.FC<GoalsFormProps> = ({ 
  formData, 
  handleInputChange 
}) => {
  const handleSliderChange = (_: Event, newValue: number | number[]) => {
    // Create a custom event object to pass to handleInputChange
    const event = {
      target: {
        name: 'weekly_workout_goal',
        value: newValue,
        type: 'number'
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    handleInputChange(event);
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Your Fitness Goals
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Setting clear goals helps us tailor your workout plans to achieve your desired results.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            id="weight_goal_kg"
            name="weight_goal_kg"
            label="Weight Goal"
            type="number"
            InputProps={{
              endAdornment: <InputAdornment position="end">kg</InputAdornment>,
            }}
            inputProps={{ 
              min: 40, 
              max: 200,
              step: 0.1
            }}
            value={formData.weight_goal_kg || ''}
            onChange={handleInputChange}
            helperText="Target weight you want to achieve (optional)"
          />
        </Grid>
        
        <Grid item xs={12}>
          <FormControl fullWidth>
            <Typography id="weekly-workout-goal-slider" gutterBottom>
              Weekly Workout Goal
            </Typography>
            <Slider
              aria-labelledby="weekly-workout-goal-slider"
              value={formData.weekly_workout_goal || 3}
              onChange={handleSliderChange}
              valueLabelDisplay="auto"
              step={1}
              marks
              min={1}
              max={7}
            />
            <FormHelperText>
              How many times per week do you plan to workout? (Current: {formData.weekly_workout_goal || 3})
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};

export default GoalsForm; 