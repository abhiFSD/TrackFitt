import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline, LinearProgress, Box } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { AuthProvider } from './context/AuthContext';
import { TokenProvider } from './context/TokenContext';
import { NotificationProvider } from './context/NotificationContext';
import { WorkoutTrackingProvider } from './context/WorkoutTrackingContext';
import theme from './utils/theme';
import routes from './routes';

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('App initializing...');
    
    // Check for existing workout in localStorage
    const savedWorkout = localStorage.getItem('activeWorkout');
    if (savedWorkout) {
      console.log('Found active workout in localStorage on app startup');
    }
    
    // Simulate loading resources/assets
    const timer = setTimeout(() => {
      setIsLoading(false);
      console.log('App initialized');
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {isLoading ? (
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100vh',
            bgcolor: 'background.default'
          }}
        >
          <Box sx={{ width: '80%', maxWidth: 400 }}>
            <LinearProgress color="primary" />
          </Box>
        </Box>
      ) : (
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <AuthProvider>
            <TokenProvider>
              <NotificationProvider>
                <WorkoutTrackingProvider>
                  <WorkoutInitializer />
                  <Router>
                    <Routes>
                      {routes.map((route) => (
                        <Route
                          key={route.path}
                          path={route.path}
                          element={route.element}
                        />
                      ))}
                    </Routes>
                  </Router>
                </WorkoutTrackingProvider>
              </NotificationProvider>
            </TokenProvider>
          </AuthProvider>
        </LocalizationProvider>
      )}
    </ThemeProvider>
  );
};

// Component to initialize workout context and handle errors
const WorkoutInitializer: React.FC = () => {
  const handleError = (error: ErrorEvent) => {
    console.error('Unhandled error in app:', error);
  };

  useEffect(() => {
    // Add global error handler
    window.addEventListener('error', handleError);
    
    console.log('WorkoutInitializer mounted');
    
    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);
  
  return null;
};

export default App;
