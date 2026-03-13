import React, { useState, useEffect } from 'react';
import {
  Button,
  TextField, 
  Typography, 
  Box, 
  useMediaQuery, 
  useTheme,
  Stack, 
  InputAdornment
} from '@mui/material';
import { format, addDays, parse } from 'date-fns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { Workout, ScheduledWorkoutCreate } from '../../interfaces';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import TodayIcon from '@mui/icons-material/Today';

interface ScheduleWorkoutFormProps {
  workout: Workout | null;
  onSubmit: (data: ScheduledWorkoutCreate) => void;
  onClose: () => void;
  open: boolean; // Keep this for backward compatibility
}

/**
 * Form for scheduling a workout without the Dialog container
 * so it can be reused within different modal containers.
 */
const ScheduleWorkoutForm: React.FC<ScheduleWorkoutFormProps> = ({
  workout, onSubmit, onClose
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [scheduledTime, setScheduledTime] = useState<string>('');
  const [dateObject, setDateObject] = useState<Date | null>(null);
  const [timeObject, setTimeObject] = useState<Date | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(0);

  // Quick date options for mobile
  const generateQuickDateOptions = () => {
    const today = new Date();
    return [
      { label: 'Today', value: format(today, 'yyyy-MM-dd'), date: today },
      { label: 'Tomorrow', value: format(addDays(today, 1), 'yyyy-MM-dd'), date: addDays(today, 1) },
      { label: 'In 2 days', value: format(addDays(today, 2), 'yyyy-MM-dd'), date: addDays(today, 2) },
      { label: 'In 3 days', value: format(addDays(today, 3), 'yyyy-MM-dd'), date: addDays(today, 3) },
    ];
  };

  // Quick time options for mobile
  const quickTimeOptions = [
    { label: 'Morning (8:00 AM)', value: '08:00', date: setHours(new Date(), 8, 0) },
    { label: 'Noon (12:00 PM)', value: '12:00', date: setHours(new Date(), 12, 0) },
    { label: 'Afternoon (4:00 PM)', value: '16:00', date: setHours(new Date(), 16, 0) },
    { label: 'Evening (7:00 PM)', value: '19:00', date: setHours(new Date(), 19, 0) }
  ];

  // Helper function for setting hours and minutes
  function setHours(date: Date, hours: number, minutes: number): Date {
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  }

  useEffect(() => {
    if (workout) {
      setTitle(workout.title);
      setDescription(workout.description || '');
      setDurationMinutes(workout.duration_minutes);
      
      // Set default date to tomorrow at 8 AM
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(8, 0, 0, 0);
      
      // Format date and time for the inputs
      setScheduledDate(format(tomorrow, 'yyyy-MM-dd'));
      setScheduledTime(format(tomorrow, 'HH:mm'));
      setDateObject(tomorrow);
      setTimeObject(tomorrow);
    }
  }, [workout]);

  // Sync string date/time with Date objects
  useEffect(() => {
    if (dateObject) {
      setScheduledDate(format(dateObject, 'yyyy-MM-dd'));
    }
  }, [dateObject]);

  useEffect(() => {
    if (timeObject) {
      setScheduledTime(format(timeObject, 'HH:mm'));
    }
  }, [timeObject]);

  const handleSubmit = () => {
    if (!workout || !scheduledDate || !scheduledTime) return;

    // Combine date and time
    const dateTimeStr = `${scheduledDate}T${scheduledTime}:00`;
    const dateTime = new Date(dateTimeStr);

    // Format date to ISO string which includes the Z timezone indicator
    const formattedDate = dateTime.toISOString();

    const scheduledWorkout: ScheduledWorkoutCreate = {
      workout_template_id: workout.id,
      title,
      description: description || undefined,
      scheduled_date: formattedDate,
      duration_minutes: durationMinutes,
    };

    onSubmit(scheduledWorkout);
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setScheduledDate('');
    setScheduledTime('');
    setDateObject(null);
    setTimeObject(null);
    setDurationMinutes(0);
    onClose();
  };

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      {workout && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6">{workout.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            Duration: {workout.duration_minutes} minutes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Exercises: {workout.exercises.length}
          </Typography>
        </Box>
      )}
      
      <TextField
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        fullWidth
        required
        autoComplete="off"
        variant={isMobile ? "outlined" : "standard"}
      />
      
      <TextField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        multiline
        rows={isMobile ? 2 : 3}
        variant={isMobile ? "outlined" : "standard"}
      />
      
      <TextField
        label="Duration (minutes)"
        type="number"
        value={durationMinutes}
        onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
        fullWidth
        required
        inputProps={{ min: 1 }}
        variant={isMobile ? "outlined" : "standard"}
      />
      
      <Typography variant="subtitle1" sx={{ pt: 1 }}>
        When will you do this workout?
      </Typography>
      
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        {isMobile ? (
          <>
            {/* Mobile Date Selection */}
            <Box>
              <DatePicker
                label="Select Date"
                value={dateObject}
                onChange={(newValue) => {
                  setDateObject(newValue);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EventIcon color="primary" />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
              
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1, mt: 1 }}>
                {generateQuickDateOptions().map((option, index) => (
                  <Button
                    key={index}
                    variant={scheduledDate === option.value ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setDateObject(option.date)}
                    startIcon={index === 0 ? <TodayIcon /> : null}
                    sx={{ 
                      whiteSpace: 'nowrap',
                      minWidth: 'auto',
                      flexShrink: 0
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Stack>
            </Box>
            
            {/* Mobile Time Selection */}
            <Box>
              <TimePicker
                label="Select Time"
                value={timeObject}
                onChange={(newValue) => {
                  setTimeObject(newValue);
                }}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined",
                    InputProps: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <AccessTimeIcon color="primary" />
                        </InputAdornment>
                      ),
                    },
                  },
                }}
              />
              
              <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1, mt: 1 }}>
                {quickTimeOptions.map((option, index) => (
                  <Button
                    key={index}
                    variant={scheduledTime === option.value ? "contained" : "outlined"}
                    size="small"
                    onClick={() => setTimeObject(option.date)}
                    sx={{ 
                      whiteSpace: 'nowrap',
                      minWidth: 'auto',
                      flexShrink: 0
                    }}
                  >
                    {option.label}
                  </Button>
                ))}
              </Stack>
            </Box>
          </>
        ) : (
          // Desktop date and time pickers
          <Stack 
            direction="row" 
            spacing={3} 
            sx={{ mt: 1 }}
          >
            <DatePicker
              label="Date"
              value={dateObject}
              onChange={(newValue) => {
                setDateObject(newValue);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: "standard",
                },
              }}
            />
            
            <TimePicker
              label="Time"
              value={timeObject}
              onChange={(newValue) => {
                setTimeObject(newValue);
              }}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: "standard",
                },
              }}
            />
          </Stack>
        )}
      </LocalizationProvider>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button 
          onClick={handleCancel}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={!title || !dateObject || !timeObject || durationMinutes <= 0}
          variant="contained"
          color="primary"
        >
          Schedule
        </Button>
      </Box>
    </Stack>
  );
};

export default ScheduleWorkoutForm; 