import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Tooltip,
  Chip,
  Snackbar,
  DialogContentText
} from '@mui/material';
import { Visibility as VisibilityIcon, AddCircleOutline as AddIcon } from '@mui/icons-material';
import { aiAPI, workoutAPI, exerciseAPI } from '../services/api';
import { AITrackingEntry, AIOperationType, WorkoutCreate, WorkoutExerciseCreate, Exercise } from '../interfaces';
import { format } from 'date-fns'; // For formatting timestamps

// Helper to format the operation type nicely
const formatOperationType = (type: AIOperationType): string => {
  switch (type) {
    case AIOperationType.WORKOUT_CREATION:
      return 'Workout Creation';
    // Add cases for other operation types if needed
    default:
      // Treat type as string here for formatting unknown enum values
      // and explicitly type 'l' as string
      const typeString = type as string; // Cast to string
      return typeString.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
  }
};

// Helper to parse JSON safely
const tryParseJson = (jsonString: string | null | undefined): any => {
  if (!jsonString) return null;
  try {
    return JSON.parse(jsonString);
  } catch (e) {
    console.error("Failed to parse JSON string:", e);
    return { error: "Failed to parse JSON", raw: jsonString };
  }
};

// Helper to check if data looks like a workout
const isWorkoutData = (data: any): boolean => {
  return data && typeof data === 'object' && data.title && Array.isArray(data.exercises);
};

const AiHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<AITrackingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<AITrackingEntry | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogContent, setDialogContent] = useState<any | null>(null);
  const [dialogTitle, setDialogTitle] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await aiAPI.getHistory(0, 100); // Fetch latest 100 entries
        setHistory(data);
      } catch (err: any) {
        setError(`Failed to load AI history: ${err.response?.data?.detail || err.message || 'Unknown error'}`);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  const handleViewDetails = (entry: AITrackingEntry, type: 'input' | 'response' | 'metadata') => {
    setSelectedEntry(entry);
    let content = null;
    let title = '';

    switch (type) {
      case 'input':
        content = tryParseJson(entry.input_data);
        title = `Input Data for Entry #${entry.id}`;
        break;
      case 'response':
        content = tryParseJson(entry.response_data);
        title = `Response Data for Entry #${entry.id}`;
        break;
      case 'metadata':
        content = tryParseJson(entry.metadata);
        title = `Metadata for Entry #${entry.id}`;
        break;
    }

    setDialogContent(content);
    setDialogTitle(title);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedEntry(null);
    setDialogContent(null);
    setDialogTitle('');
  };

  const handleOpenConfirmDialog = () => {
    setConfirmDialogOpen(true);
  };

  const handleCloseConfirmDialog = () => {
    setConfirmDialogOpen(false);
  };

  const handleSnackbarClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  const handleCreateWorkoutTemplate = async (publish: boolean) => {
    handleCloseConfirmDialog();
    if (!selectedEntry || !dialogContent || !isWorkoutData(dialogContent)) {
      setSnackbarMessage('Invalid workout data.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    try {
      // 1. Map AI response exercises and fetch integer IDs using UUIDs
      const correctedExercises = await Promise.all(
        dialogContent.exercises.map(async (aiEx: any): Promise<WorkoutExerciseCreate | null> => {
          if (!aiEx.exercise_id || typeof aiEx.exercise_id !== 'string') {
            console.warn('Skipping exercise due to missing or invalid string exercise_id:', aiEx);
            return null; // Skip if UUID is missing or not a string
          }

          try {
            // Fetch exercise details using the string UUID
            const searchResult: Exercise[] = await exerciseAPI.getExercises({ exercise_uuid: aiEx.exercise_id });
            
            if (searchResult && searchResult.length > 0) {
              const matchedExercise = searchResult[0];
              // Return the exercise data with the correct integer ID
              return {
                exercise_id: matchedExercise.id, // Use the integer ID from the fetched exercise
                sets: aiEx.sets,
                reps: aiEx.reps,
                weight: aiEx.weight,
                rest_time_seconds: aiEx.rest_time_seconds,
                notes: aiEx.notes,
                // set_details are not handled here, backend manages this
              };
            } else {
              console.warn(`Exercise with UUID ${aiEx.exercise_id} not found in DB. Skipping.`);
              return null; // Skip if no matching exercise found in DB
            }
          } catch (err) {
            console.error(`Error fetching exercise details for UUID ${aiEx.exercise_id}:`, err);
            return null; // Skip on error during fetch
          }
        })
      );

      // Filter out any nulls (skipped exercises)
      const validExercises = correctedExercises.filter((ex): ex is WorkoutExerciseCreate => ex !== null);

      if (validExercises.length === 0) {
        setSnackbarMessage('Could not find any valid exercises from the AI response in the database.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }
      
       if (validExercises.length < dialogContent.exercises.length) {
        setSnackbarMessage('Warning: Some exercises could not be found and were skipped.');
        setSnackbarSeverity('error'); // Keep severity as error to indicate potential issue
        setSnackbarOpen(true);
        // Continue with the valid exercises found
      }

      // 2. Map AI response to WorkoutCreate format using corrected exercises
      const workoutData: WorkoutCreate = {
        title: dialogContent.title,
        description: dialogContent.description || dialogContent.ai_notes || '',
        duration_minutes: dialogContent.duration_minutes,
        is_template: true, 
        is_published: publish,
        exercises: validExercises, // Use the list with integer IDs
      };

      // 3. Call API to create workout
      await workoutAPI.createWorkout(workoutData);
      setSnackbarMessage('Workout template created successfully!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      handleCloseDialog(); // Close the main details dialog on success

    } catch (err: any) {
      console.error("Failed to create workout template:", err);
      // Extract backend validation errors if available
      let errorDetail = 'Unknown error';
      if (err.response?.data?.detail) {
          if (Array.isArray(err.response.data.detail)) {
              // Format Pydantic validation errors
              errorDetail = err.response.data.detail.map((e: any) => `${e.loc?.join('.')} - ${e.msg}`).join('; ');
          } else if (typeof err.response.data.detail === 'string') {
              errorDetail = err.response.data.detail;
          }
      } else if (err.message) {
          errorDetail = err.message;
      }
      setSnackbarMessage(`Failed to create template: ${errorDetail}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const showCreateTemplateButton = dialogOpen && dialogTitle.includes('Response Data') && isWorkoutData(dialogContent);

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        My AI Interaction History
      </Typography>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && history.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          You haven't generated any workouts or used AI features yet.
        </Alert>
      )}

      {!loading && !error && history.length > 0 && (
        <Paper sx={{ mt: 2 }}>
          <TableContainer>
            <Table stickyHeader aria-label="ai history table">
              <TableHead>
                <TableRow>
                  <TableCell>Timestamp</TableCell>
                  <TableCell>Operation</TableCell>
                  <TableCell>Prompt</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Duration (ms)</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((entry) => (
                  <TableRow hover key={entry.id}>
                    <TableCell>
                      {format(new Date(entry.created_at), 'Pp')}
                    </TableCell>
                    <TableCell>
                      {formatOperationType(entry.operation_type)}
                    </TableCell>
                    <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <Tooltip title={entry.user_prompt || ''}>
                         <span>{entry.user_prompt || '-'}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={entry.status}
                        color={entry.status === 'completed' ? 'success' : entry.status === 'failed' ? 'error' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{entry.duration_ms ?? '-'}</TableCell>
                    <TableCell>
                      {entry.input_data && (
                        <Tooltip title="View Input Data">
                          <IconButton size="small" onClick={() => handleViewDetails(entry, 'input')}>
                            <VisibilityIcon fontSize="inherit" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {entry.response_data && (
                        <Tooltip title="View Response Data">
                          <IconButton size="small" onClick={() => handleViewDetails(entry, 'response')}>
                            <VisibilityIcon fontSize="inherit" color="primary"/>
                          </IconButton>
                        </Tooltip>
                      )}
                      {entry.metadata && (
                        <Tooltip title="View Metadata">
                          <IconButton size="small" onClick={() => handleViewDetails(entry, 'metadata')}>
                            <VisibilityIcon fontSize="inherit" color="info"/>
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{dialogTitle}</DialogTitle>
        <DialogContent>
          {dialogContent ? (
            <Box sx={{ maxHeight: '60vh', overflowY: 'auto', whiteSpace: 'pre-wrap', bgcolor: 'grey.100', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: '0.8rem' }}>
              {JSON.stringify(dialogContent, null, 2)}
            </Box>
          ) : (
            <Typography>No data available.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          {showCreateTemplateButton && (
            <Button
              onClick={handleOpenConfirmDialog}
              color="primary"
              startIcon={<AddIcon />}
            >
              Create Workout Template
            </Button>
          )}
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmDialogOpen}
        onClose={handleCloseConfirmDialog}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">{"Publish Workout Template?"}</DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            Would you like to make this workout template public and available for others to use?
            If not, it will be saved privately to your account.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCreateWorkoutTemplate(false)} color="primary">
            Save Privately
          </Button>
          <Button onClick={() => handleCreateWorkoutTemplate(true)} color="primary" autoFocus>
            Publish Publicly
          </Button>
           <Button onClick={handleCloseConfirmDialog} color="inherit">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AiHistoryPage; 