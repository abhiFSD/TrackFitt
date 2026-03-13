import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Stepper, Step, StepLabel, Button, CircularProgress, Alert, LinearProgress } from '@mui/material';
import { CheckCircleOutline as CompleteIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { userProfileAPI } from '../services/api';
import { FitnessLevel, ActivityLevel, ProfileCompletion, UserProfileCreate } from '../interfaces';
import BasicInfoForm from '../components/Profile/BasicInfoForm';
import PhysicalMetricsForm from '../components/Profile/PhysicalMetricsForm';
import FitnessDataForm from '../components/Profile/FitnessDataForm';
import GoalsForm from '../components/Profile/GoalsForm';
import PreferencesForm from '../components/Profile/PreferencesForm';
import HealthDataForm from '../components/Profile/HealthDataForm';
import ProfileSummary from '../components/Profile/ProfileSummary';

const steps = [
  'Basic Information',
  'Physical Metrics',
  'Fitness Data',
  'Goals',
  'Preferences',
  'Health Data',
  'Summary'
];

interface ProfileFormData {
  // Basic Information
  first_name: string;
  last_name: string;
  birth_date: string;
  gender: string;
  profile_image_url?: string;
  
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
  
  [key: string]: any;
}

const ProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<ProfileCompletion | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  
  const [formData, setFormData] = useState<ProfileFormData>({
    first_name: '',
    last_name: '',
    birth_date: '',
    gender: '',
    height_cm: '',
    weight_kg: '',
    body_fat_percentage: '',
    fitness_level: FitnessLevel.BEGINNER,
    activity_level: ActivityLevel.MODERATELY_ACTIVE,
    weight_goal_kg: '',
    weekly_workout_goal: 3,
    preferred_workout_duration: 45,
    preferred_workout_days: [],
    favorite_muscle_groups: [],
    has_injuries: false,
    injury_notes: '',
    has_medical_conditions: false,
    medical_notes: ''
  });
  
  useEffect(() => {
    if (currentUser) {
      fetchProfileData();
    } else {
      setLoading(false); // Make sure we're not in a loading state if there's no user
    }
  }, [currentUser]);
  
  const fetchProfileData = async () => {
    setLoading(true);
    try {
      // Fetch user profile data
      const profileData = await userProfileAPI.getUserProfile();
      if (profileData) {
        setFormData(prevData => ({
          ...prevData,
          ...profileData
        }));
      }
      
      // Fetch profile completion status
      const completion = await userProfileAPI.getProfileCompletion();
      setCompletionStatus(completion);
      
      // Set active step based on completion status
      if (completion) {
        if (!completion.sections.basic_information.is_complete) {
          setActiveStep(0);
        } else if (!completion.sections.physical_metrics.is_complete) {
          setActiveStep(1);
        } else if (!completion.sections.fitness_data.is_complete) {
          setActiveStep(2);
        } else if (!completion.sections.goals.is_complete) {
          setActiveStep(3);
        } else if (!completion.sections.preferences.is_complete) {
          setActiveStep(4);
        } else {
          // If all sections are complete, just start at the beginning
          setActiveStep(0);
        }
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setAlertMessage({
        type: 'error',
        message: 'Failed to load profile data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleNext = async () => {
    // Validate current step
    if (activeStep === 0) {
      // Validate basic information
      if (!formData.first_name || !formData.last_name || !formData.birth_date || !formData.gender) {
        setAlertMessage({
          type: 'error',
          message: 'Please fill out all required fields in Basic Information'
        });
        return;
      }
    } else if (activeStep === 1) {
      // Validate physical metrics
      if (!formData.height_cm || !formData.weight_kg) {
        setAlertMessage({
          type: 'error',
          message: 'Height and weight are required'
        });
        return;
      }
    }
    
    // If we're at the last step, save everything
    if (activeStep === steps.length - 1) {
      await saveProfile();
      return;
    }
    
    // Try to save the current section
    if (activeStep % 2 === 0) { // Save every two steps to reduce API calls
      await saveProfile();
    }
    
    // Move to next step
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
    setAlertMessage(null);
  };
  
  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
    setAlertMessage(null);
  };
  
  const saveProfile = async () => {
    setLoading(true);
    try {
      // Physical metrics are already converted to metric in the PhysicalMetricsForm
      // The backend stores all measurements in cm and kg
      
      // Convert string values to numbers for API
      const apiFormData: UserProfileCreate = {
        ...formData,
        height_cm: formData.height_cm ? Number(formData.height_cm) : undefined,
        weight_kg: formData.weight_kg ? Number(formData.weight_kg) : undefined,
        body_fat_percentage: formData.body_fat_percentage ? Number(formData.body_fat_percentage) : undefined,
        weight_goal_kg: formData.weight_goal_kg ? Number(formData.weight_goal_kg) : undefined
      };
      
      await userProfileAPI.createOrUpdateProfile(apiFormData);
      
      // Refresh completion status
      const completion = await userProfileAPI.getProfileCompletion();
      setCompletionStatus(completion);
      
      setAlertMessage({
        type: 'success',
        message: 'Profile information saved successfully!'
      });
    } catch (error) {
      console.error('Error saving profile:', error);
      setAlertMessage({
        type: 'error',
        message: 'Failed to save profile data. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target;
    
    // Handle checkboxes
    if (type === 'checkbox') {
      setFormData({
        ...formData,
        [name]: checked
      });
      return;
    }
    
    // Handle numeric inputs
    if (type === 'number' || name === 'height_cm' || name === 'weight_kg' || name === 'body_fat_percentage') {
      setFormData({
        ...formData,
        [name]: value === '' ? '' : Number(value)
      });
      return;
    }
    
    // Handle all other inputs
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleSelectChange = (name: string, value: unknown) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <BasicInfoForm 
            formData={formData} 
            handleInputChange={handleInputChange} 
            handleSelectChange={handleSelectChange}
            setFormData={setFormData}
          />
        );
      case 1:
        return (
          <PhysicalMetricsForm 
            formData={formData} 
            handleInputChange={handleInputChange}
          />
        );
      case 2:
        return (
          <FitnessDataForm 
            formData={formData} 
            handleSelectChange={handleSelectChange}
          />
        );
      case 3:
        return (
          <GoalsForm 
            formData={formData} 
            handleInputChange={handleInputChange}
          />
        );
      case 4:
        return (
          <PreferencesForm 
            formData={formData} 
            handleInputChange={handleInputChange}
            handleSelectChange={handleSelectChange}
          />
        );
      case 5:
        return (
          <HealthDataForm 
            formData={formData} 
            handleInputChange={handleInputChange}
          />
        );
      case 6:
        return (
          <ProfileSummary formData={formData} />
        );
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      
      {completionStatus && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" color="primary" sx={{ mr: 1 }}>
              Profile Completion: {completionStatus.completion_percentage}%
            </Typography>
            {completionStatus.is_complete && (
              <CompleteIcon color="success" />
            )}
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={completionStatus.completion_percentage} 
            sx={{ height: 8, borderRadius: 4 }} 
          />
          {!completionStatus.is_complete && (
            <Box mt={2}>
              <Alert severity="info">
                Please complete your profile to get personalized workout recommendations.
              </Alert>
            </Box>
          )}
        </Paper>
      )}
      
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {alertMessage && (
        <Alert severity={alertMessage.type} sx={{ mb: 3 }}>
          {alertMessage.message}
        </Alert>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {getStepContent(activeStep)}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                disabled={activeStep === 0}
                onClick={handleBack}
                variant="outlined"
              >
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
              >
                {activeStep === steps.length - 1 ? 'Complete Profile' : 'Next'}
              </Button>
            </Box>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ProfilePage; 