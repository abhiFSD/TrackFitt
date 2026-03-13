import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Grid,
  FormHelperText,
  Button,
  Avatar,
  CircularProgress,
  IconButton
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { userProfileAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

interface BasicInfoFormProps {
  formData: {
    first_name: string;
    last_name: string;
    birth_date: string;
    gender: string;
    profile_image_url?: string;
    [key: string]: any;
  };
  handleInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: unknown) => void;
  setFormData: (data: any) => void;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ 
  formData, 
  handleInputChange, 
  handleSelectChange,
  setFormData
}) => {
  const { refreshUserProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) {
      return;
    }
    
    const file = event.target.files[0];
    setUploading(true);
    setUploadError('');
    
    console.log('Starting image upload process...', file.name, file.size, file.type);
    
    try {
      // Check file size
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        throw new Error('File size exceeds 5MB limit');
      }
      
      // Check file type
      if (!file.type.match('image/jpeg') && !file.type.match('image/png')) {
        throw new Error('Only JPEG and PNG images are allowed');
      }
      
      console.log('File checks passed, attempting to upload...');
      
      // Try our updated endpoint
      try {
        const result = await userProfileAPI.uploadProfileImage(file);
        console.log('Upload successful:', result);
        
        if (result.success) {
          setFormData({
            ...formData,
            profile_image_url: result.url
          });
          // Refresh the user profile in auth context to update navbar and other components
          await refreshUserProfile();
        } else {
          throw new Error(result.message || 'Failed to upload image');
        }
      } catch (apiError: any) {
        console.error('API call error details:', apiError.response?.data || apiError.message);
        setUploadError(`Error uploading image: ${apiError.response?.data?.detail || apiError.message}`);
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      setUploadError(error.message || 'Error uploading image. Please try again.');
    } finally {
      setUploading(false);
    }
  };
  
  const isValidName = (name: string | null | undefined) => {
    // If name is null, undefined, or an empty string, return false.
    // Otherwise, check if its length is >= 2.
    return name ? name.length >= 2 : false;
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Basic Information
      </Typography>
      <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
        Please provide your basic personal information to help us personalize your experience.
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} display="flex" flexDirection="column" alignItems="center" mb={2}>
          {/* Profile Image Upload */}
          <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="subtitle1" gutterBottom>
              Profile Picture
            </Typography>
            
            {formData.profile_image_url ? (
              <Box sx={{ mb: 2, position: 'relative' }}>
                <Avatar 
                  src={formData.profile_image_url} 
                  alt={`${formData.first_name} ${formData.last_name}`}
                  sx={{ width: 100, height: 100 }}
                />
                <IconButton 
                  size="small"
                  sx={{ 
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    backgroundColor: 'white',
                    '&:hover': {
                      backgroundColor: '#f0f0f0'
                    }
                  }}
                  onClick={() => setFormData({...formData, profile_image_url: ''})}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <Avatar sx={{ width: 100, height: 100, mb: 2 }}>
                <PersonIcon fontSize="large" />
              </Avatar>
            )}
            
            <Button
              component="label"
              variant="outlined"
              startIcon={<CloudUploadIcon />}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
              <input
                type="file"
                hidden
                accept="image/png, image/jpeg"
                onChange={handleImageUpload}
              />
            </Button>
            
            {uploadError && (
              <Typography color="error" variant="body2" sx={{ mt: 1, textAlign: 'center' }}>
                {uploadError}
              </Typography>
            )}
            
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
              Upload a profile picture (JPEG or PNG, max 5MB)
            </Typography>
          </Box>
        </Grid>
      
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            id="first_name"
            name="first_name"
            label="First Name"
            value={formData.first_name || ''}
            onChange={handleInputChange}
            error={formData.first_name !== '' && !isValidName(formData.first_name)}
            helperText={formData.first_name !== '' && !isValidName(formData.first_name) ? 
              "First name should be at least 2 characters" : ""}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            id="last_name"
            name="last_name"
            label="Last Name"
            value={formData.last_name || ''}
            onChange={handleInputChange}
            error={formData.last_name !== '' && !isValidName(formData.last_name)}
            helperText={formData.last_name !== '' && !isValidName(formData.last_name) ? 
              "Last name should be at least 2 characters" : ""}
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <TextField
            required
            fullWidth
            id="birth_date"
            name="birth_date"
            label="Birth Date"
            type="date"
            value={formData.birth_date}
            onChange={handleInputChange}
            InputLabelProps={{
              shrink: true,
            }}
            helperText="Format: YYYY-MM-DD"
          />
        </Grid>
        
        <Grid item xs={12} sm={6}>
          <FormControl fullWidth required>
            <InputLabel id="gender-label">Gender</InputLabel>
            <Select
              labelId="gender-label"
              id="gender"
              name="gender"
              value={formData.gender}
              label="Gender"
              onChange={(e) => handleSelectChange('gender', e.target.value)}
            >
              <MenuItem value="male">Male</MenuItem>
              <MenuItem value="female">Female</MenuItem>
              <MenuItem value="non-binary">Non-binary</MenuItem>
              <MenuItem value="prefer-not-to-say">Prefer not to say</MenuItem>
            </Select>
            <FormHelperText>Select your gender</FormHelperText>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  );
};

export default BasicInfoForm; 