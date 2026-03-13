import axios, { AxiosRequestConfig } from 'axios';
import { 
  User, AuthToken, LoginCredentials, RegisterCredentials, 
  Exercise, ExerciseCreate, Workout, WorkoutCreate,
  WorkoutHistory, WorkoutHistoryCreate, TokenRequest, 
  TokenRequestCreate, Token, TokenCreate, UserTokenBalance,
  UserProfile, UserProfileCreate, ProfileCompletion,
  TokenRequestStatus, UserRole, ScheduledWorkout, ScheduledWorkoutCreate,
  ExerciseCategory, ExerciseCategoryCreate,
  WorkoutAIFrontendRequest,
  WorkoutAIResponse,
  AITrackingEntry
} from '../interfaces';

// Base API URL
const API_URL = 'http://localhost:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true  // Include credentials in cross-origin requests
});

// Request interceptor for adding the auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API calls
export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthToken> => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);
    
    const response = await axios.post(`${API_URL}/token`, formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      withCredentials: true
    });
    return response.data;
  },
  
  register: async (userData: RegisterCredentials): Promise<User> => {
    const { confirmPassword, ...registerData } = userData;
    const response = await api.post('/users/', registerData);
    return response.data;
  },
  
  getUserProfile: async (): Promise<User> => {
    const response = await api.get('/users/me/');
    return response.data;
  },
};

// Exercise API calls
export const exerciseAPI = {
  getExercises: async (filters?: { 
    category?: string, 
    category_id?: number, 
    difficulty?: string, 
    equipment?: string,
    equipment_id?: number,
    search?: string,
    exercise_uuid?: string,
    muscle_group?: string
  }): Promise<Exercise[]> => {
    let url = '/exercises/';
    if (filters) {
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.category_id !== undefined) params.append('category_id', filters.category_id.toString());
      if (filters.difficulty) params.append('difficulty', filters.difficulty);
      if (filters.equipment) params.append('equipment', filters.equipment);
      if (filters.equipment_id !== undefined) params.append('equipment_id', filters.equipment_id.toString());
      if (filters.search) params.append('search', filters.search);
      if (filters.exercise_uuid) params.append('exercise_uuid', filters.exercise_uuid);
      if (filters.muscle_group) params.append('muscle_group', filters.muscle_group);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }
    const response = await api.get(url);
    return response.data;
  },
  
  getExercise: async (id: number): Promise<Exercise> => {
    const response = await api.get(`/exercises/${id}`);
    return response.data;
  },
  
  createExercise: async (exercise: ExerciseCreate): Promise<Exercise> => {
    const response = await api.post('/exercises/', exercise);
    return response.data;
  },
  
  updateExercise: async (id: number, exercise: ExerciseCreate): Promise<Exercise> => {
    const response = await api.put(`/exercises/${id}`, exercise);
    return response.data;
  },
  
  getExerciseCategories: async (): Promise<string[]> => {
    const response = await api.get('/exercises/categories');
    return response.data;
  },
  
  // New methods for managing exercise categories
  getAllExerciseCategories: async (): Promise<ExerciseCategory[]> => {
    const response = await api.get('/exercise-categories/');
    return response.data;
  },
  
  getExerciseCategory: async (id: number): Promise<ExerciseCategory> => {
    const response = await api.get(`/exercise-categories/${id}`);
    return response.data;
  },
  
  createExerciseCategory: async (category: ExerciseCategoryCreate): Promise<ExerciseCategory> => {
    const response = await api.post('/exercise-categories/', category);
    return response.data;
  },
  
  updateExerciseCategory: async (id: number, category: ExerciseCategoryCreate): Promise<ExerciseCategory> => {
    const response = await api.put(`/exercise-categories/${id}`, category);
    return response.data;
  },
  
  deleteExerciseCategory: async (id: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/exercise-categories/${id}`);
    return response.data;
  },
  
  // New method to get all muscle groups
  getMuscleGroups: async (): Promise<{ id: number, name: string, body_part: string, description: string }[]> => {
    const response = await api.get('/muscle-groups/');
    return response.data;
  },
  
  // New method to get all equipment
  getEquipment: async (): Promise<{ id: number, name: string, description: string, icon_url: string }[]> => {
    const response = await api.get('/equipment/');
    return response.data;
  }
};

// Workout API calls
export const workoutAPI = {
  getWorkouts: async (isTemplate?: boolean, isPublic?: boolean): Promise<Workout[]> => {
    const params = { 
      ...(isTemplate !== undefined && { is_template: isTemplate.toString() }),
      ...(isPublic !== undefined && { public: isPublic.toString() })
    };
    console.log('Workout API params:', params);
    const response = await api.get('/workouts/', { params });
    return response.data;
  },
  
  getWorkout: async (id: number): Promise<Workout> => {
    const response = await api.get(`/workouts/${id}`);
    return response.data;
  },
  
  createWorkout: async (workout: WorkoutCreate): Promise<Workout> => {
    const response = await api.post('/workouts/', workout);
    return response.data;
  },
  
  publishWorkout: async (id: number): Promise<Workout> => {
    const response = await api.patch(`/workouts/${id}/publish`);
    return response.data;
  }
};

// Workout History API calls
export const workoutHistoryAPI = {
  getWorkoutHistory: async (): Promise<WorkoutHistory[]> => {
    const response = await api.get('/workout-history/');
    return response.data;
  },
  
  getWorkoutHistoryEntry: async (id: number): Promise<WorkoutHistory> => {
    const response = await api.get(`/workout-history/${id}`);
    return response.data;
  },
  
  recordWorkout: async (workoutHistory: WorkoutHistoryCreate): Promise<WorkoutHistory> => {
    try {
      console.log('Sending workout history to API:', workoutHistory);
      const response = await api.post('/workout-history/', workoutHistory);
      console.log('API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error recording workout:', error);
      // Rethrow the error to let the caller handle it
      throw error;
    }
  },
  
  // New method to update workout history
  updateWorkoutHistory: async (
    historyId: number, 
    updateData: {
      title?: string;
      duration_minutes?: number;
      notes?: string;
      rating?: number | null;
    }
  ): Promise<WorkoutHistory> => {
    try {
      console.log('Updating workout history:', { historyId, updateData });
      const response = await api.patch(`/workout-history/${historyId}`, updateData);
      console.log('API response for workout history update:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating workout history:', error);
      throw error;
    }
  },
  
  // New endpoint to update a single set's completion data
  updateSetCompletion: async (
    workoutHistoryId: number,
    exerciseIndex: number,
    setData: {
      set_number: number,
      actual_reps?: number,
      actual_weight?: number,
      completion_time?: string,
      duration_seconds?: number
    }
  ): Promise<any> => {
    try {
      console.log('Updating set completion data:', { workoutHistoryId, exerciseIndex, setData });
      const response = await api.patch(`/workout-history/${workoutHistoryId}/exercise/${exerciseIndex}/set`, setData);
      console.log('API response for set update:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating set completion:', error);
      throw error;
    }
  }
};

// Scheduled Workout API calls
export const scheduledWorkoutAPI = {
  getScheduledWorkouts: async (params?: { 
    start_date?: string, 
    end_date?: string, 
    include_completed?: boolean 
  }): Promise<ScheduledWorkout[]> => {
    const response = await api.get('/scheduled-workouts/', { params });
    return response.data;
  },
  
  getScheduledWorkout: async (id: number): Promise<ScheduledWorkout> => {
    const response = await api.get(`/scheduled-workouts/${id}`);
    return response.data;
  },
  
  scheduleWorkout: async (scheduledWorkout: ScheduledWorkoutCreate): Promise<ScheduledWorkout> => {
    const response = await api.post('/scheduled-workouts/', scheduledWorkout);
    return response.data;
  },
  
  startWorkout: async (id: number): Promise<WorkoutHistory> => {
    const response = await api.post(`/scheduled-workouts/${id}/start`);
    return response.data;
  },
  
  deleteScheduledWorkout: async (id: number): Promise<void> => {
    await api.delete(`/scheduled-workouts/${id}`);
  }
};

// Token API calls
export const tokenAPI = {
  getBalance: async (): Promise<UserTokenBalance> => {
    const response = await api.get('/tokens/balance');
    return response.data;
  },
  
  getHistory: async (): Promise<Token[]> => {
    const response = await api.get('/tokens/history');
    return response.data;
  },
  
  spendTokens: async (tokenData: TokenCreate): Promise<Token> => {
    const response = await api.post('/tokens/spend', tokenData);
    return response.data;
  },
  
  createTokenRequest: async (request: TokenRequestCreate): Promise<TokenRequest> => {
    const response = await api.post('/token-requests/', request);
    return response.data;
  },
  
  getTokenRequests: async (): Promise<TokenRequest[]> => {
    const response = await api.get('/token-requests/');
    return response.data;
  },
  
  // Admin Token API functions
  getAllUsersTokenHistory: async (userId?: number): Promise<Token[]> => {
    const params = userId ? `?user_id=${userId}` : '';
    const response = await api.get(`/admin/tokens/history${params}`);
    return response.data;
  },
  
  getAllTokenRequests: async (status?: TokenRequestStatus): Promise<TokenRequest[]> => {
    const params = status ? `?status=${status}` : '';
    const response = await api.get(`/admin/tokens/requests${params}`);
    return response.data;
  },
  
  getAllUsersTokenBalance: async (): Promise<UserTokenBalance[]> => {
    const response = await api.get('/admin/users/token-balance');
    return response.data;
  },
  
  updateTokenRequest: async (requestId: number, status: TokenRequestStatus): Promise<TokenRequest> => {
    const response = await api.put(`/token-requests/${requestId}`, { status });
    return response.data;
  }
};

// User API calls for admin functionality
export const userAPI = {
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get('/users/');
    return response.data;
  },
  
  // Admin User Management
  getAdminUsers: async (params?: {
    username?: string;
    email?: string;
    is_active?: boolean;
    role?: UserRole;
    skip?: number;
    limit?: number;
  }): Promise<User[]> => {
    const response = await api.get('/admin/users/', { params });
    return response.data;
  },
  
  getAdminUser: async (userId: number): Promise<User> => {
    const response = await api.get(`/admin/users/${userId}`);
    return response.data;
  },
  
  updateUserStatus: async (userId: number, isActive: boolean): Promise<User> => {
    const response = await api.patch(`/admin/users/${userId}/status`, { is_active: isActive });
    return response.data;
  },
  
  updateUserRole: async (userId: number, role: UserRole): Promise<User> => {
    const response = await api.patch(`/admin/users/${userId}/role`, { role });
    return response.data;
  },
  
  deleteUser: async (userId: number): Promise<{ success: boolean }> => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
  }
};

// User Profile API calls
export const userProfileAPI = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get('/users/profile/');
    return response.data;
  },
  
  getUserProfile: async (): Promise<UserProfile> => {
    return await userProfileAPI.getProfile();
  },
  
  createOrUpdateProfile: async (profileData: UserProfileCreate): Promise<UserProfile> => {
    const response = await api.post('/users/profile/', profileData);
    return response.data;
  },
  
  updateProfile: async (profileData: Partial<UserProfileCreate>): Promise<UserProfile> => {
    const response = await api.put('/users/profile/', profileData);
    return response.data;
  },
  
  uploadProfileImage: async (file: File): Promise<{ success: boolean; message: string; url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/users/profile/upload-image/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
  
  getCompletion: async (): Promise<ProfileCompletion> => {
    const response = await api.get('/users/profile/completion');
    return response.data;
  },
  
  getProfileCompletion: async (): Promise<ProfileCompletion> => {
    return await userProfileAPI.getCompletion();
  }
};

// AI API calls
export const aiAPI = {
  createWorkout: async (requestData: WorkoutAIFrontendRequest): Promise<WorkoutAIResponse> => {
    try {
      console.log('Sending AI workout request to API:', requestData);
      const response = await api.post('/ai/workouts', requestData);
      console.log('AI API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating AI workout:', error);
      // Rethrow or handle specific errors (e.g., based on response status)
      throw error;
    }
  },

  getHistory: async (skip: number = 0, limit: number = 50): Promise<AITrackingEntry[]> => {
    try {
      const params = { skip, limit };
      console.log('Fetching AI history with params:', params);
      const response = await api.get('/ai/history', { params });
      console.log('AI History API response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching AI history:', error);
      throw error;
    }
  }
};

export default api;