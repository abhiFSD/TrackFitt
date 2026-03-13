import React from 'react';
import { 
  Box, 
  Typography, 
  Grid, 
  FormControlLabel,
  Checkbox,
  TextField,
  Alert
} from '@mui/material';

interface HealthDataFormProps {
  formData: {
    has_injuries: boolean;
    injury_notes: string;
    has_medical_conditions: boolean;
    medical_notes: string;
    [key: string]: any;
  };
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const HealthDataForm: React.FC<HealthDataFormProps> = ({ 
  formData, 
  handleInputChange 
}) => {
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Health Information
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Please provide relevant health information to help us create safe workout programs for you.
        This information is kept confidential and only used to customize your workouts.
      </Typography>
      
      <Alert severity="info" sx={{ mb: 3 }}>
        It's important to let us know about any health concerns so we can suggest appropriate exercises for you.
      </Alert>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.has_injuries || false}
                onChange={handleInputChange}
                name="has_injuries"
              />
            }
            label="I have injuries or mobility limitations"
          />
        </Grid>
        
        {formData.has_injuries && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              id="injury_notes"
              name="injury_notes"
              label="Describe your injuries or limitations"
              value={formData.injury_notes || ''}
              onChange={handleInputChange}
              placeholder="Please describe any injuries, joint problems, or mobility limitations that might affect your workouts"
              helperText="This helps us avoid exercises that could cause pain or injury"
            />
          </Grid>
        )}
        
        <Grid item xs={12}>
          <FormControlLabel
            control={
              <Checkbox
                checked={formData.has_medical_conditions || false}
                onChange={handleInputChange}
                name="has_medical_conditions"
              />
            }
            label="I have medical conditions that may affect my exercise"
          />
        </Grid>
        
        {formData.has_medical_conditions && (
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              id="medical_notes"
              name="medical_notes"
              label="Describe your medical conditions"
              value={formData.medical_notes || ''}
              onChange={handleInputChange}
              placeholder="Please describe any medical conditions such as heart problems, diabetes, asthma, high blood pressure, etc."
              helperText="This helps us create safer workout programs tailored to your needs"
            />
          </Grid>
        )}
        
        <Grid item xs={12}>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Note: Always consult with a healthcare professional before starting any new exercise program,
            especially if you have any medical conditions or injuries.
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HealthDataForm; 