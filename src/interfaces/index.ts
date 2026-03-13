export enum UserRole {
  ADMIN = "admin",
  USER = "user"
}

export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  role: UserRole;
  created_at: string;
  profile?: UserProfile;
}

export interface AuthToken {
  access_token: string;
  token_type: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  confirmPassword?: string; // Added for frontend validation
}

export interface Exercise {
  id: number;
  exercise_id?: string;
  name: string;
  description?: string;
  category?: string;
  category_id?: number;
  muscle_groups?: string;
  difficulty?: string;
  equipment?: string;
  instructions?: string;
  image_url?: string;
  video_url?: string;
  form_tips?: string;
  common_mistakes?: string;
  variations?: string;
  created_at?: string;
  updated_at?: string;
  category_relation?: ExerciseCategory;
}

export interface ExerciseCreate {
  name: string;
  exercise_id?: string;
  description?: string;
  category?: string;
  category_id?: number;
  muscle_groups?: string;
  difficulty?: string;
  equipment?: string;
  instructions?: string;
  image_url?: string;
  video_url?: string;
  form_tips?: string;
  common_mistakes?: string;
  variations?: string;
}

export interface ExerciseCategory {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface ExerciseCategoryCreate {
  name: string;
  description?: string;
}

export interface WorkoutExerciseSet {
  id: number;
  workout_exercise_id: number;
  set_number: number;
  reps: number;
  weight?: number;
  rest_time_seconds?: number;
}

export interface WorkoutExerciseSetCreate {
  set_number: number;
  reps: number;
  weight?: number;
  rest_time_seconds?: number;
}

export interface WorkoutExercise {
  id: number;
  workout_id: number;
  exercise_id: number;
  sets: number;
  reps: number;
  weight?: number;
  rest_time_seconds?: number;
  notes?: string;
  exercise: Exercise;
  set_details?: WorkoutExerciseSet[];
}

export interface WorkoutExerciseCreate {
  exercise_id: number;
  sets: number;
  reps: number;
  weight?: number;
  rest_time_seconds?: number;
  notes?: string;
  set_details?: WorkoutExerciseSetCreate[];
}

export interface Workout {
  id: number;
  title: string;
  description?: string;
  date: string;
  duration_minutes: number;
  user_id: number;
  is_template: boolean;
  is_published: boolean;
  exercises: WorkoutExercise[];
}

export interface WorkoutCreate {
  title: string;
  description?: string;
  duration_minutes: number;
  is_template: boolean;
  is_published?: boolean;
  exercises: WorkoutExerciseCreate[];
}

export interface WorkoutHistoryExerciseSet {
  id: number;
  workout_history_exercise_id: number;
  set_number: number;
  planned_reps: number;
  planned_weight?: number;
  actual_reps?: number;
  actual_weight?: number;
  rest_time_seconds?: number;
  completion_time?: string;
  duration_seconds?: number;
}

export interface WorkoutHistoryExerciseSetCreate {
  set_number: number;
  planned_reps: number;
  planned_weight?: number;
  rest_time_seconds?: number;
}

export interface WorkoutHistoryExercise {
  id: number;
  workout_history_id: number;
  exercise_id: number;
  sets: number;
  reps: number;
  weight?: number;
  rest_time_seconds?: number;
  notes?: string;
  exercise: Exercise;
  set_details?: WorkoutHistoryExerciseSet[];
}

export interface WorkoutHistoryExerciseCreate {
  exercise_id: number;
  sets: number;
  reps: number;
  weight?: number;
  rest_time_seconds?: number;
  notes?: string;
  set_details?: WorkoutHistoryExerciseSetCreate[];
}

export interface WorkoutHistory {
  id: number;
  user_id: number;
  workout_template_id?: number;
  title: string;
  date_completed: string;
  duration_minutes: number;
  notes?: string;
  rating?: number;
  exercises: WorkoutHistoryExercise[];
}

export interface WorkoutHistoryCreate {
  workout_template_id?: number;
  title: string;
  duration_minutes: number;
  notes?: string;
  rating?: number;
  exercises: WorkoutHistoryExerciseCreate[];
}

// Scheduled Workout interfaces
export interface ScheduledWorkoutExerciseSet {
  id: number;
  scheduled_workout_exercise_id: number;
  set_number: number;
  reps: number;
  weight?: number;
  rest_time_seconds?: number;
}

export interface ScheduledWorkoutExerciseSetCreate {
  set_number: number;
  reps: number;
  weight?: number;
  rest_time_seconds?: number;
}

export interface ScheduledWorkoutExercise {
  id: number;
  scheduled_workout_id: number;
  exercise_id: number;
  sets: number;
  reps: number;
  weight?: number;
  rest_time_seconds?: number;
  notes?: string;
  exercise: Exercise;
  set_details?: ScheduledWorkoutExerciseSet[];
}

export interface ScheduledWorkoutExerciseCreate {
  exercise_id: number;
  sets: number;
  reps: number;
  weight?: number;
  rest_time_seconds?: number;
  notes?: string;
  set_details?: ScheduledWorkoutExerciseSetCreate[];
}

export interface ScheduledWorkout {
  id: number;
  user_id: number;
  workout_template_id: number;
  title: string;
  description?: string;
  scheduled_date: string;
  duration_minutes: number;
  is_completed: boolean;
  created_at: string;
  exercises: ScheduledWorkoutExercise[];
}

export interface ScheduledWorkoutCreate {
  workout_template_id: number;
  title: string;
  description?: string;
  scheduled_date: string;
  duration_minutes: number;
  exercises?: ScheduledWorkoutExerciseCreate[];
}

export enum TokenRequestStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected"
}

export interface TokenRequest {
  id: number;
  user_id: number;
  amount: number;
  reason?: string;
  status: TokenRequestStatus;
  request_date: string;
  response_date?: string;
  approved_by_id?: number;
}

export interface TokenRequestCreate {
  amount: number;
  reason?: string;
}

export enum TokenTransactionType {
  EARN = "earn",
  SPEND = "spend",
  ADMIN_ADJUSTMENT = "admin_adjustment"
}

export interface Token {
  id: number;
  user_id: number;
  amount: number;
  transaction_type: TokenTransactionType;
  description?: string;
  request_id?: number;
  workout_history_id?: number;
  timestamp: string;
}

export interface TokenCreate {
  amount: number;
  description?: string;
}

export interface UserTokenBalance {
  user_id: number;
  balance: number;
}

// User Profile
export enum FitnessLevel {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced"
}

export enum ActivityLevel {
  SEDENTARY = "sedentary",
  LIGHTLY_ACTIVE = "lightly_active",
  MODERATELY_ACTIVE = "moderately_active",
  VERY_ACTIVE = "very_active",
  EXTREMELY_ACTIVE = "extremely_active"
}

export interface UserProfile {
  id: number;
  user_id: number;
  
  // Basic Information
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  gender?: string;
  profile_image_url?: string;
  
  // Physical Metrics
  height_cm?: number;
  weight_kg?: number;
  body_fat_percentage?: number;
  
  // Fitness Data
  fitness_level?: FitnessLevel;
  activity_level?: ActivityLevel;
  
  // Goals
  weight_goal_kg?: number;
  weekly_workout_goal?: number;
  
  // Preferences
  preferred_workout_duration?: number;
  preferred_workout_days?: string[];
  favorite_muscle_groups?: string[];
  
  // Health Data
  has_injuries?: boolean;
  injury_notes?: string;
  has_medical_conditions?: boolean;
  medical_notes?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface UserProfileCreate {
  // Basic Information
  first_name?: string;
  last_name?: string;
  birth_date?: string;
  gender?: string;
  profile_image_url?: string;
  
  // Physical Metrics
  height_cm?: number;
  weight_kg?: number;
  body_fat_percentage?: number;
  
  // Fitness Data
  fitness_level?: FitnessLevel;
  activity_level?: ActivityLevel;
  
  // Goals
  weight_goal_kg?: number;
  weekly_workout_goal?: number;
  
  // Preferences
  preferred_workout_duration?: number;
  preferred_workout_days?: string[];
  favorite_muscle_groups?: string[];
  
  // Health Data
  has_injuries?: boolean;
  injury_notes?: string;
  has_medical_conditions?: boolean;
  medical_notes?: string;
}

export interface ProfileCompletion {
  is_complete: boolean;
  completion_percentage: number;
  sections: {
    basic_information: {
      is_complete: boolean;
      missing_fields: string[];
    };
    physical_metrics: {
      is_complete: boolean;
      missing_fields: string[];
    };
    fitness_data: {
      is_complete: boolean;
      missing_fields: string[];
    };
    goals: {
      is_complete: boolean;
      missing_fields: string[];
    };
    preferences: {
      is_complete: boolean;
      missing_fields: string[];
    };
  };
}

export interface Notification {
  id: number;
  user_id: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: string;
  is_read: boolean;
  created_at: string;
}

export interface WebSocketMessage {
  type: string;
  notification_id?: number;
  notification_type?: string;
  title?: string;
  message?: string;
  data?: any;
  timestamp?: string;
}

// ---> ADD AI Workout Interfaces <---

// Matches the 'WorkoutAIExercise' schema from the backend response
export interface WorkoutAIExerciseResponse {
  exercise_id: string; // Note: Backend schema used 'str', typically exercise PK is int, verify actual backend return type
  sets: number;
  reps: number;
  weight?: number | null;
  rest_time_seconds: number;
  notes?: string | null;
}

// Matches the 'WorkoutAIResponse' schema from the backend
export interface WorkoutAIResponse {
  title: string;
  description: string;
  duration_minutes: number;
  difficulty_level: string;
  exercises: WorkoutAIExerciseResponse[];
  ai_notes?: string | null;
}

// Matches the 'WorkoutAIRequest' schema sent from the frontend
// (user_id is added by backend, available_exercises are optional/fetched by backend)
export interface WorkoutAIFrontendRequest {
  user_id: number;
  user_prompt: string;
  fitness_level?: string | null;
  preferred_duration?: number | null;
  preferred_equipment?: string[] | null;
  target_muscle_groups?: string[] | null;
  shared_profile_data?: { [key: string]: any } | null;
}

// ---> END AI Workout Interfaces <---

// ---> ADD AI History Interface <---
// Matches the AITrackingResponse schema from the backend
export enum AIOperationType {
  WORKOUT_CREATION = 'workout_creation',
  // Add other types if they exist in the backend model
}

export interface AITrackingEntry {
  id: number;
  user_id: number;
  operation_type: AIOperationType;
  created_at: string; // Match backend response schema
  user_prompt?: string | null;
  input_data?: string | null; // Received as JSON string
  response_data?: string | null; // Received as JSON string
  status: string;
  duration_ms?: number | null;
  metadata?: string | null; // Received as JSON string
}
// ---> END AI History Interface <---

// Notification types (Remove this duplicated enum)
/*
export enum NotificationType {
  TOKEN_REQUEST = "token_request",
  TOKEN_APPROVED = "token_approved",
  TOKEN_REJECTED = "token_rejected",
  WORKOUT_COMPLETED = "workout_completed",
  NEW_EXERCISE = "new_exercise",
  ADMIN_NOTIFICATION = "admin_notification",
  SYSTEM_NOTIFICATION = "system_notification"
}
*/

// --- Existing Notification Interfaces --- 
// (Keep the original NotificationType enum and related interfaces below this point)

export enum NotificationType {
  TOKEN_REQUEST = "token_request",
  TOKEN_APPROVED = "token_approved",
  TOKEN_REJECTED = "token_rejected",
  WORKOUT_COMPLETED = "workout_completed",
  NEW_EXERCISE = "new_exercise",
  ADMIN_NOTIFICATION = "admin_notification",
  SYSTEM_NOTIFICATION = "system_notification"
} 