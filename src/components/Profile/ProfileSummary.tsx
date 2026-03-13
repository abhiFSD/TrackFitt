import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Avatar
} from '@mui/material';
import { FitnessLevel, ActivityLevel } from '../../interfaces';

interface ProfileSummaryProps {
  formData: {
    // Basic Information
    first_name: string;
    last_name: string;
    birth_date: string;
    gender: string;
    
    // Physical Metrics
    height_cm: string | number;
    weight_kg: string | number;
    body_fat_percentage: string | number;
    
    // Fitness Data
    fitness_level: FitnessLevel;
    activity_level: ActivityLevel;
    
    // Goals
    weight_goal_kg: string | number;
    weekly_workout_goal: number;
    
    // Preferences
    preferred_workout_duration: number;
    preferred_workout_days: string[];
    favorite_muscle_groups: string[];
    
    // Health Data
    has_injuries: boolean;
    injury_notes: string;
    has_medical_conditions: boolean;
    medical_notes: string;
    
    profile_image_url?: string;
    
    [key: string]: any;
  };
}

const ProfileSummary: React.FC<ProfileSummaryProps> = ({ formData }) => {
  const formatFitnessLevel = (level: FitnessLevel) => {
    switch (level) {
      case FitnessLevel.BEGINNER:
        return 'Beginner';
      case FitnessLevel.INTERMEDIATE:
        return 'Intermediate';
      case FitnessLevel.ADVANCED:
        return 'Advanced';
      default:
        return 'Unknown';
    }
  };
  
  const formatActivityLevel = (level: ActivityLevel) => {
    switch (level) {
      case ActivityLevel.SEDENTARY:
        return 'Sedentary';
      case ActivityLevel.LIGHTLY_ACTIVE:
        return 'Lightly Active';
      case ActivityLevel.MODERATELY_ACTIVE:
        return 'Moderately Active';
      case ActivityLevel.VERY_ACTIVE:
        return 'Very Active';
      case ActivityLevel.EXTREMELY_ACTIVE:
        return 'Extremely Active';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Profile Summary
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Review your profile information before completing.
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Avatar 
          src={formData.profile_image_url || ''} 
          alt={`${formData.first_name} ${formData.last_name}`}
          sx={{ width: 120, height: 120 }}
        />
      </Box>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Basic Information
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Name" 
                  secondary={`${formData.first_name} ${formData.last_name}`} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Birth Date" 
                  secondary={formData.birth_date} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Gender" 
                  secondary={formData.gender} 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Physical Metrics
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Height" 
                  secondary={formData.height_cm ? `${formData.height_cm} cm` : 'Not specified'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Weight" 
                  secondary={formData.weight_kg ? `${formData.weight_kg} kg` : 'Not specified'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Body Fat" 
                  secondary={formData.body_fat_percentage ? `${formData.body_fat_percentage}%` : 'Not specified'} 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Fitness Level
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Fitness Level" 
                  secondary={formatFitnessLevel(formData.fitness_level)} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Activity Level" 
                  secondary={formatActivityLevel(formData.activity_level)} 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Goals
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Weight Goal" 
                  secondary={formData.weight_goal_kg ? `${formData.weight_goal_kg} kg` : 'Not specified'} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Weekly Workout Goal" 
                  secondary={`${formData.weekly_workout_goal || 3} times per week`} 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Workout Preferences
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Preferred Workout Duration" 
                  secondary={`${formData.preferred_workout_duration || 45} minutes`} 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Preferred Workout Days" 
                  secondary={
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {formData.preferred_workout_days && formData.preferred_workout_days.length > 0 ? (
                        formData.preferred_workout_days.map((day: string) => (
                          <Chip key={day} label={day} size="small" />
                        ))
                      ) : (
                        'Not specified'
                      )}
                    </Box>
                  } 
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Favorite Muscle Groups" 
                  secondary={
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                      {formData.favorite_muscle_groups && formData.favorite_muscle_groups.length > 0 ? (
                        formData.favorite_muscle_groups.map((group: string) => (
                          <Chip key={group} label={group} size="small" />
                        ))
                      ) : (
                        'Not specified'
                      )}
                    </Box>
                  } 
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Health Information
            </Typography>
            {formData.has_injuries ? (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                  Injuries or Mobility Limitations
                </Typography>
                <Typography variant="body2" paragraph>
                  {formData.injury_notes || 'Not provided'}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No injuries or mobility limitations reported
              </Typography>
            )}
            <Divider sx={{ my: 1 }} />
            {formData.has_medical_conditions ? (
              <>
                <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                  Medical Conditions
                </Typography>
                <Typography variant="body2" paragraph>
                  {formData.medical_notes || 'Not provided'}
                </Typography>
              </>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No medical conditions reported
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ProfileSummary; 