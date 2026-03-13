import React from 'react';
import { 
  Box, 
  Typography, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid,
  FormHelperText
} from '@mui/material';
import { FitnessLevel, ActivityLevel } from '../../interfaces';

interface FitnessDataFormProps {
  formData: {
    fitness_level: FitnessLevel;
    activity_level: ActivityLevel;
    [key: string]: any;
  };
  handleSelectChange: (name: string, value: unknown) => void;
}

const FitnessDataForm: React.FC<FitnessDataFormProps> = ({ 
  formData, 
  handleSelectChange 
}) => {
  const fitnessLevelDescriptions = {
    [FitnessLevel.BEGINNER]: "New to fitness or returning after a long break",
    [FitnessLevel.INTERMEDIATE]: "Consistent with exercise for 6+ months",
    [FitnessLevel.ADVANCED]: "Very experienced, training regularly for years"
  };

  const activityLevelDescriptions = {
    [ActivityLevel.SEDENTARY]: "Mostly sitting throughout the day, minimal physical activity",
    [ActivityLevel.LIGHTLY_ACTIVE]: "Light activity, mostly walking, 1-2 days/week of exercise",
    [ActivityLevel.MODERATELY_ACTIVE]: "Moderate activity, regular exercise 3-5 days/week",
    [ActivityLevel.VERY_ACTIVE]: "Very active lifestyle or physically demanding job, 6-7 days/week of exercise",
    [ActivityLevel.EXTREMELY_ACTIVE]: "Professional athlete or extremely high activity level daily"
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Fitness Data
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Tell us about your current fitness level and activity habits. This helps us tailor workout recommendations to your experience and lifestyle.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel id="fitness-level-label">Fitness Level</InputLabel>
            <Select
              labelId="fitness-level-label"
              id="fitness_level"
              name="fitness_level"
              value={formData.fitness_level || FitnessLevel.BEGINNER}
              label="Fitness Level"
              onChange={(e) => handleSelectChange('fitness_level', e.target.value)}
            >
              <MenuItem value={FitnessLevel.BEGINNER}>Beginner</MenuItem>
              <MenuItem value={FitnessLevel.INTERMEDIATE}>Intermediate</MenuItem>
              <MenuItem value={FitnessLevel.ADVANCED}>Advanced</MenuItem>
            </Select>
            <FormHelperText>
              {fitnessLevelDescriptions[formData.fitness_level as FitnessLevel] || fitnessLevelDescriptions[FitnessLevel.BEGINNER]}
            </FormHelperText>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth required>
            <InputLabel id="activity-level-label">Activity Level</InputLabel>
            <Select
              labelId="activity-level-label"
              id="activity_level"
              name="activity_level"
              value={formData.activity_level || ActivityLevel.MODERATELY_ACTIVE}
              label="Activity Level"
              onChange={(e) => handleSelectChange('activity_level', e.target.value)}
            >
              <MenuItem value={ActivityLevel.SEDENTARY}>Sedentary</MenuItem>
              <MenuItem value={ActivityLevel.LIGHTLY_ACTIVE}>Lightly Active</MenuItem>
              <MenuItem value={ActivityLevel.MODERATELY_ACTIVE}>Moderately Active</MenuItem>
              <MenuItem value={ActivityLevel.VERY_ACTIVE}>Very Active</MenuItem>
              <MenuItem value={ActivityLevel.EXTREMELY_ACTIVE}>Extremely Active</MenuItem>
            </Select>
            <FormHelperText>
              {activityLevelDescriptions[formData.activity_level as ActivityLevel] || activityLevelDescriptions[ActivityLevel.MODERATELY_ACTIVE]}
            </FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
      
      <Box mt={3}>
        <Typography variant="body2" color="textSecondary">
          Note: Your fitness level and activity level help us determine the appropriate intensity and frequency of workouts for your plan.
        </Typography>
      </Box>
    </Box>
  );
};

export default FitnessDataForm; 