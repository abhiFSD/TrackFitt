import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { useWorkoutTracking } from './context/WorkoutTrackingContext';
import { Box, CircularProgress } from '@mui/material';

// Layout
import MainLayout from './components/Layout/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage'; 
import DashboardPage from './pages/DashboardPage';
import TokensPage from './pages/TokensPage';
import ProfilePage from './pages/ProfilePage';
import ExercisesPage from './pages/ExercisesPage';
import CreateWorkoutPage from './pages/CreateWorkoutPage';
import WorkoutsPage from './pages/WorkoutsPage';
import WorkoutDetailPage from './pages/WorkoutDetailPage';
import ScheduledWorkoutsPage from './pages/ScheduledWorkoutsPage';
import WorkoutTrackerPage from './pages/WorkoutTrackerPage';
import WorkoutHistoryPage from './pages/WorkoutHistoryPage';
import WorkoutHistoryDetailPage from './pages/WorkoutHistoryDetailPage';
import AdminExercisesPage from './pages/AdminExercisesPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AiHistoryPage from './pages/AiHistoryPage';
import UnifiedWorkoutsPage from './pages/UnifiedWorkoutsPage';
import AdminTokensPage from './pages/AdminTokensPage';

// Simple components for old route redirects
const CreateWorkoutHistoryPage = () => {
  // Check if we have a workout in progress
  const { activeWorkout } = useWorkoutTracking();
  
  // If there's an active workout, go to the tracker
  if (activeWorkout) {
    return <Navigate to="/workout-tracker" replace />;
  }
  
  // Otherwise go to workouts list
  return <Navigate to="/workouts" replace />;
};

// Temporary Admin placeholders 
// const AdminTokensPage = () => <Box p={3}>Admin Tokens Page</Box>;

// Auth wrapper components
interface AuthRouteProps {
  children: React.ReactNode;
}

const AuthRoute: React.FC<AuthRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

// Admin wrapper component
const AdminRoute: React.FC<AuthRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, currentUser } = useAuth();

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

// Route declarations
const routes = [
  {
    path: '/',
    element: (
      <AuthRoute>
        <MainLayout>
          <DashboardPage />
        </MainLayout>
      </AuthRoute>
    ),
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/profile',
    element: (
      <AuthRoute>
        <MainLayout>
          <ProfilePage />
        </MainLayout>
      </AuthRoute>
    ),
  },
  {
    path: '/profile/ai-history',
    element: (
      <AuthRoute>
        <MainLayout>
          <AiHistoryPage />
        </MainLayout>
      </AuthRoute>
    ),
  },
  {
    path: '/tokens',
    element: (
      <AuthRoute>
        <MainLayout>
          <TokensPage />
        </MainLayout>
      </AuthRoute>
    ),
  },
  {
    path: '/admin/tokens',
    element: (
      <AdminRoute>
        <MainLayout>
          <AdminTokensPage />
        </MainLayout>
      </AdminRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <AdminRoute>
        <MainLayout>
          <AdminUsersPage />
        </MainLayout>
      </AdminRoute>
    ),
  },
  {
    path: '/admin/exercises',
    element: (
      <AdminRoute>
        <MainLayout>
          <AdminExercisesPage />
        </MainLayout>
      </AdminRoute>
    ),
  },
  {
    path: '/exercises',
    element: (
      <AuthRoute>
        <MainLayout>
          <ExercisesPage />
        </MainLayout>
      </AuthRoute>
    ),
  },
  {
    path: '/workouts',
    element: (
      <AuthRoute>
        <MainLayout>
          <UnifiedWorkoutsPage />
        </MainLayout>
      </AuthRoute>
    ),
  },
  {
    path: '/workouts/create',
    element: <Navigate to="/workouts" state={{ initialTab: 2 }} replace />,
  },
  {
    path: '/scheduled-workouts',
    element: <Navigate to="/workouts" state={{ initialTab: 1 }} replace />,
  },
  {
    path: '/workouts/:id',
    element: (
      <AuthRoute>
        <MainLayout>
          <WorkoutDetailPage />
        </MainLayout>
      </AuthRoute>
    ),
  },
  {
    path: '/workout-tracker',
    element: (
      <AuthRoute>
        <MainLayout>
          <WorkoutTrackerPage />
        </MainLayout>
      </AuthRoute>
    ),
  },

  {
    path: '/history',
    element: (
      <AuthRoute>
        <MainLayout>
          <WorkoutHistoryPage />
        </MainLayout>
      </AuthRoute>
    ),
  },
  {
    path: '/workout-history/new',
    element: (
      <AuthRoute>
        <MainLayout>
          <CreateWorkoutHistoryPage />
        </MainLayout>
      </AuthRoute>
    ),
  },
  {
    path: '/history/:id',
    element: (
      <AuthRoute>
        <MainLayout>
          <WorkoutHistoryDetailPage />
        </MainLayout>
      </AuthRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" />,
  },
];

export default routes; 