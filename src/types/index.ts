// Core types for the SpeechAI Campaign Management system - Updated for Real API

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'operator';
  permissions: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// API Models - Matching Backend Schema
export interface AccountModel {
  _id: string;
  account_id: string;
  account_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE';
  plan_type: 'minutes_based' | 'credit_based';
  balance: {
    minutes: number;
    credits: number;
    total_spent?: number;
  };
  features: {
    max_concurrent_calls: number;
    voice_cloning: boolean;
    advanced_analytics: boolean;
    custom_integration: boolean;
    priority_support: boolean;
  };
  settings: {
    timezone: string;
  };
  api_token: string;
  created_at: string;
  updated_at: string;
}

export interface ContactModel {
  name: string;
  dni?: string;
  phones: string[];
  next_phone_index: number;
}

export interface JobPayload {
  company_name: string;
  debt_amount?: number;
  due_date?: string;
  reference_number?: string;
  additional_info?: {
    cantidad_cupones?: number;
    fecha_maxima?: string;
    [key: string]: any;
  };
}

export interface JobModel {
  _id: string;
  job_id: string;
  account_id: string;
  batch_id: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'done';
  contact: ContactModel;
  payload: JobPayload;
  mode: 'CONTINUOUS' | 'SINGLE' | 'single';
  attempts: number;
  max_attempts: number;
  estimated_cost: number;
  created_at: string;
  started_at?: string;
  updated_at?: string;
  call_result?: {
    success: boolean;
    status: string;
    summary?: {
      call_status: string;
      disconnection_reason?: string;
      duration_ms: number;
      call_cost?: {
        total_duration_seconds: number;
        combined_cost: number;
      };
      call_analysis?: {
        call_summary: string;
        user_sentiment: string;
        call_successful: boolean;
      };
      recording_url?: string;
      public_log_url?: string;
    };
  };
  call_id?: string;
  call_duration_seconds?: number;
  last_error?: string;
}

export type JobStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled' | 'done';

export interface BatchStats {
  total_jobs: number;
  pending: number;
  in_progress: number;
  completed: number;
  failed: number;
}

export interface BatchModel {
  _id: string;
  batch_id: string;
  account_id: string;
  name: string;
  description?: string;
  status: 'PENDING' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'ERROR';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  script_content: string;
  voice_settings: {
    voice_id: string;
    speed: number;
    pitch: number;
    volume: number;
    language: string;
  };
  call_settings: {
    max_call_duration: number;
    ring_timeout: number;
    max_attempts: number;
    retry_delay_hours: number;
    allowed_hours: {
      start: string;
      end: string;
    };
    days_of_week: number[];
    timezone: string;
  };
  schedule_type: 'immediate' | 'scheduled' | 'recurring';
  scheduled_start?: string;
  recurring_config?: any;
  created_at: string;
  updated_at: string;
  stats: {
    total_contacts: number;
    calls_completed: number;
    calls_failed: number;
    calls_pending: number;
    avg_call_duration?: number;
    total_cost?: number;
    total_duration?: number;
  };
}

export interface BatchSummary {
  batch: BatchModel;
  stats: BatchStats;
  jobs_sample: JobModel[];
}

export interface BatchStatus {
  status: 'active' | 'paused' | 'completed';
  progress: {
    completed_percentage: number;
    estimated_completion?: string;
  };
  metrics: {
    success_rate: number;
    average_call_duration?: number;
    cost_per_call?: number;
  };
}

// Request Models
export interface CreateAccountRequest {
  account_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  plan_type: 'minutes_based' | 'credit_based';
  initial_minutes?: number;
  initial_credits?: number;
  features: {
    max_concurrent_calls: number;
    voice_cloning: boolean;
    advanced_analytics: boolean;
    custom_integration: boolean;
    priority_support: boolean;
  };
  settings: {
    timezone: string;
  };
}

export interface CreateBatchRequest {
  account_id: string;
  name: string;
  description?: string;
  script_content: string;
  voice_settings: {
    voice_id: string;
    speed: number;
    pitch: number;
    volume: number;
    language: string;
  };
  call_settings: {
    max_call_duration: number;
    ring_timeout: number;
    max_attempts: number;
    retry_delay_hours: number;
    allowed_hours: {
      start: string;
      end: string;
    };
    days_of_week: number[];
    timezone: string;
  };
  contacts_data: any[];
  excel_file?: File | null;
  schedule_type: 'immediate' | 'scheduled' | 'recurring';
  scheduled_start?: string | null;
  recurring_config?: any | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface TopupRequest {
  minutes?: number;
  credits?: number;
}

export interface ExcelPreviewResponse {
  success: boolean;
  preview: {
    total_rows: number;
    sample_rows: any[];
    detected_columns: string[];
    country_format: string;
  };
}

export interface ExcelCreateResponse {
  success: boolean;
  batch_id: string;
  jobs_created: number;
  errors: Array<{
    rowIndex: number;
    errors: Array<{
      field: string;
      message: string;
    }>;
  }>;
  warnings?: Array<{
    rowIndex: number;
    warnings: string[];
  }>;
}

// Dashboard Stats
export interface DashboardStats {
  total_accounts: number;
  active_batches: number;
  total_jobs_today: number;
  success_rate: number;
  total_minutes_used: number;
  revenue_today: number;
  pending_jobs: number;
  in_progress_jobs: number;
  completed_jobs_today: number;
  failed_jobs_today: number;
}

// Call History
export interface CallHistoryItem {
  job_id: string;
  batch_id: string;
  contact_name: string;
  phone: string;
  status: 'completed' | 'failed' | 'no_answer' | 'busy';
  duration?: number;
  cost: number;
  timestamp: string;
  call_result?: any;
}

// Use Cases
export interface UseCase {
  id: string;
  name: string;
  description: string;
  country: 'chile' | 'argentina';
  required_fields: string[];
  optional_fields: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  pages: number;
}

export interface ApiError {
  message: string;
  code: string;
  status: number;
}

export interface HealthResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  database: 'connected' | 'disconnected';
}

// WebSocket Event Types (for future implementation)
export interface WebSocketEvent {
  type: 'job_status_update' | 'batch_progress' | 'call_completed';
  data: any;
}

// Notification system types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Form validation types
export interface UploadResponse {
  success: boolean;
  batch_id?: string;
  message: string;
  errors?: string[];
}

export interface ReportRequest {
  account_id?: string;
  batch_id?: string;
  start_date?: string;
  end_date?: string;
  format: 'csv' | 'excel';
}