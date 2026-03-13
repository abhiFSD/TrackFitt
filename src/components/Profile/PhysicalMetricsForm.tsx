import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Grid, 
  InputAdornment,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  FormLabel,
  Stack,
  Divider,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';

interface PhysicalMetricsFormProps {
  formData: {
    height_cm: string | number;  // Always stored in cm regardless of display unit
    weight_kg: string | number;  // Always stored in kg regardless of display unit
    body_fat_percentage: string | number;
    [key: string]: any;
  };
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const PhysicalMetricsForm: React.FC<PhysicalMetricsFormProps> = ({ 
  formData, 
  handleInputChange 
}) => {
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lb'>('kg');
  const [feet, setFeet] = useState(0);
  const [inches, setInches] = useState(0);
  const [pounds, setPounds] = useState(0);

  // Convert between units when they change
  useEffect(() => {
    if (heightUnit === 'ft' && formData.height_cm) {
      // Convert cm to feet and inches
      const totalInches = Number(formData.height_cm) / 2.54;
      const ft = Math.floor(totalInches / 12);
      const inch = Math.round(totalInches % 12);
      setFeet(ft);
      setInches(inch);
    }
    
    if (weightUnit === 'lb' && formData.weight_kg) {
      // Convert kg to pounds
      const lb = Math.round(Number(formData.weight_kg) * 2.20462);
      setPounds(lb);
    }
  }, [heightUnit, weightUnit, formData.height_cm, formData.weight_kg]);

  // Handle height unit change
  const handleHeightUnitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newUnit = event.target.value as 'cm' | 'ft';
    setHeightUnit(newUnit);
    
    if (newUnit === 'cm' && feet > 0) {
      // Convert feet/inches to cm
      const totalCm = Math.round((feet * 12 + inches) * 2.54);
      const e = {
        target: {
          name: 'height_cm',
          value: totalCm,
          type: 'number'
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleInputChange(e);
    }
  };

  // Handle weight unit change
  const handleWeightUnitChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newUnit = event.target.value as 'kg' | 'lb';
    setWeightUnit(newUnit);
    
    if (newUnit === 'kg' && pounds > 0) {
      // Convert pounds to kg
      const totalKg = Number((pounds / 2.20462).toFixed(1));
      const e = {
        target: {
          name: 'weight_kg',
          value: totalKg,
          type: 'number'
        }
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleInputChange(e);
    }
  };

  // Handle feet/inches input
  const handleFeetChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFeet = Number(event.target.value);
    setFeet(newFeet);
    
    // Convert to cm
    const totalCm = Math.round((newFeet * 12 + inches) * 2.54);
    const e = {
      target: {
        name: 'height_cm',
        value: totalCm,
        type: 'number'
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(e);
  };

  const handleInchesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newInches = Number(event.target.value);
    setInches(newInches);
    
    // Convert to cm
    const totalCm = Math.round((feet * 12 + newInches) * 2.54);
    const e = {
      target: {
        name: 'height_cm',
        value: totalCm,
        type: 'number'
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(e);
  };

  // Handle pounds input
  const handlePoundsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPounds = Number(event.target.value);
    setPounds(newPounds);
    
    // Convert to kg
    const totalKg = Number((newPounds / 2.20462).toFixed(1));
    const e = {
      target: {
        name: 'weight_kg',
        value: totalKg,
        type: 'number'
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    handleInputChange(e);
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Physical Metrics
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        These measurements help us customize workouts to your body type and track your progress.
      </Typography>
      
      {/* Height section */}
      <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
        <FormLabel component="legend">Height</FormLabel>
        <RadioGroup
          row
          name="height-unit"
          value={heightUnit}
          onChange={handleHeightUnitChange}
        >
          <FormControlLabel value="cm" control={<Radio />} label="Centimeters" />
          <FormControlLabel value="ft" control={<Radio />} label="Feet/Inches" />
        </RadioGroup>
        
        <Box sx={{ mt: 2 }}>
          {heightUnit === 'cm' ? (
            <TextField
              fullWidth
              id="height_cm"
              name="height_cm"
              label="Height"
              type="number"
              InputProps={{
                endAdornment: <InputAdornment position="end">cm</InputAdornment>,
              }}
              inputProps={{ 
                min: 120, 
                max: 250,
                step: 0.5
              }}
              value={formData.height_cm}
              onChange={handleInputChange}
              helperText="Your height in centimeters"
            />
          ) : (
            <Stack direction="row" spacing={2}>
              <TextField
                id="feet"
                label="Feet"
                type="number"
                value={feet}
                onChange={handleFeetChange}
                inputProps={{ min: 3, max: 8 }}
                sx={{ width: '50%' }}
              />
              <TextField
                id="inches"
                label="Inches"
                type="number"
                value={inches}
                onChange={handleInchesChange}
                inputProps={{ min: 0, max: 11 }}
                sx={{ width: '50%' }}
              />
            </Stack>
          )}
        </Box>
      </FormControl>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Weight section */}
      <FormControl component="fieldset" sx={{ mb: 3, width: '100%' }}>
        <FormLabel component="legend">Weight</FormLabel>
        <RadioGroup
          row
          name="weight-unit"
          value={weightUnit}
          onChange={handleWeightUnitChange}
        >
          <FormControlLabel value="kg" control={<Radio />} label="Kilograms" />
          <FormControlLabel value="lb" control={<Radio />} label="Pounds" />
        </RadioGroup>
        
        <Box sx={{ mt: 2 }}>
          {weightUnit === 'kg' ? (
            <TextField
              fullWidth
              id="weight_kg"
              name="weight_kg"
              label="Weight"
              type="number"
              InputProps={{
                endAdornment: <InputAdornment position="end">kg</InputAdornment>,
              }}
              inputProps={{ 
                min: 30, 
                max: 250,
                step: 0.1
              }}
              value={formData.weight_kg}
              onChange={handleInputChange}
              helperText="Your current weight in kilograms"
            />
          ) : (
            <TextField
              fullWidth
              id="weight_lb"
              label="Weight"
              type="number"
              InputProps={{
                endAdornment: <InputAdornment position="end">lb</InputAdornment>,
              }}
              inputProps={{ 
                min: 65, 
                max: 550,
                step: 1
              }}
              value={pounds}
              onChange={handlePoundsChange}
              helperText="Your current weight in pounds"
            />
          )}
        </Box>
      </FormControl>
      
      <Divider sx={{ my: 3 }} />
      
      {/* Body fat percentage */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <TextField
            fullWidth
            id="body_fat_percentage"
            name="body_fat_percentage"
            label="Body Fat Percentage"
            type="number"
            InputProps={{
              endAdornment: <InputAdornment position="end">%</InputAdornment>,
            }}
            inputProps={{ 
              min: 3, 
              max: 50,
              step: 0.1
            }}
            value={formData.body_fat_percentage}
            onChange={handleInputChange}
            helperText="Optional: Enter if you know your body fat %"
          />
        </Grid>
      </Grid>
      
      <Box mt={3}>
        <Typography variant="body2" color="textSecondary">
          Note: We store all measurements in metric units (cm, kg) in our database but you can enter your data in your preferred units.
        </Typography>
      </Box>
    </Box>
  );
};

export default PhysicalMetricsForm; 