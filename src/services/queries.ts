import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { api } from './api';
import {
  AccountModel,
  BatchModel,
  JobModel,
  CreateAccountRequest,
  CreateBatchRequest,
  TopupRequest,
  DashboardStats,
  CallHistoryItem,
  UseCase,
  ExcelPreviewResponse,
  ExcelCreateResponse,
  BatchSummary,
  BatchStatus,
} from '@/types';

// Mappers para convertir respuestas del backend a modelos del frontend
const mapBackendBatchToFrontend = (backendBatch: any): BatchModel => {
  return {
    _id: backendBatch._id,
    batch_id: backendBatch.batch_id,
    account_id: backendBatch.account_id,
    name: backendBatch.name,
    description: backendBatch.description,
    status: backendBatch.is_active ? 'RUNNING' : 'PAUSED',
    priority: 'normal',
    script_content: '',
    voice_settings: {
      voice_id: 'default',
      speed: 1.0,
      pitch: 1.0,
      volume: 1.0,
      language: 'es-ES'
    },
    call_settings: {
      max_call_duration: 300,
      ring_timeout: 30,
      max_attempts: 3,
      retry_delay_hours: 1,
      allowed_hours: {
        start: '09:00',
        end: '18:00'
      },
      days_of_week: [1, 2, 3, 4, 5],
      timezone: 'America/Argentina/Buenos_Aires'
    },
    schedule_type: 'immediate',
    created_at: backendBatch.created_at,
    updated_at: backendBatch.created_at,
    stats: {
      total_contacts: backendBatch.total_jobs,
      calls_completed: backendBatch.completed_jobs,
      calls_failed: backendBatch.failed_jobs,
      calls_pending: backendBatch.pending_jobs,
      total_cost: backendBatch.total_cost,
      total_duration: backendBatch.total_minutes
    }
  };
};

const mapBackendAccountToFrontend = (backendAccount: any): AccountModel => {
  return {
    _id: backendAccount._id,
    account_id: backendAccount.account_id,
    account_name: backendAccount.account_name,
    contact_name: backendAccount.account_name, // Usar account_name como contact_name
    contact_email: `${backendAccount.account_id}@company.com`, // Email por defecto
    contact_phone: backendAccount.contact_phone || 'No especificado',
    status: backendAccount.status?.toUpperCase() as 'ACTIVE' | 'SUSPENDED' | 'INACTIVE',
    plan_type: backendAccount.plan_type,
    balance: {
      minutes: backendAccount.minutes_purchased - backendAccount.minutes_used,
      credits: backendAccount.credit_balance - backendAccount.credit_used,
      total_spent: (backendAccount.minutes_used * backendAccount.cost_per_minute) + 
                   (backendAccount.credit_used * backendAccount.cost_per_minute)
    },
    features: {
      max_concurrent_calls: backendAccount.max_concurrent_calls,
      voice_cloning: false, // No está en backend, usar default
      advanced_analytics: false,
      custom_integration: false,
      priority_support: false
    },
    settings: {
      allowed_call_hours: {
        start: '09:00',
        end: '18:00'
      },
      timezone: 'America/Argentina/Buenos_Aires',
      retry_settings: {
        max_attempts: 3,
        retry_delay_hours: 1
      }
    },
    api_token: 'token_placeholder',
    created_at: backendAccount.created_at,
    updated_at: backendAccount.updated_at
  };
};

const mapBackendTransactionToFrontend = (backendTransaction: any) => {
  return {
    _id: backendTransaction._id || backendTransaction.transaction_id,
    account_id: backendTransaction.account_id,
    type: backendTransaction.type,
    amount: backendTransaction.amount,
    cost: backendTransaction.cost,
    description: backendTransaction.description,
    created_at: backendTransaction.created_at
  };
};

// Health check (special endpoint without /api/v1 prefix)
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await axios.get(`${import.meta.env.VITE_API_BASE || 'http://localhost:8000'}/health`);
      return response.data;
    },
    staleTime: 30000, // 30 seconds
  });
};

// Account Management
export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (accountData: CreateAccountRequest) => {
      const response = await api.post('/accounts', accountData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

export const useAccount = (accountId: string) => {
  return useQuery({
    queryKey: ['accounts', accountId],
    queryFn: async (): Promise<AccountModel> => {
      const response = await api.get(`/accounts/${accountId}`);
      return response.data;
    },
    enabled: !!accountId,
  });
};

export const useAccountBalance = (accountId: string) => {
  return useQuery({
    queryKey: ['accounts', accountId, 'balance'],
    queryFn: async () => {
      const response = await api.get(`/accounts/${accountId}/balance`);
      return response.data;
    },
    enabled: !!accountId,
  });
};

export const useAccountStats = (accountId: string) => {
  return useQuery({
    queryKey: ['accounts', accountId, 'stats'],
    queryFn: async () => {
      const response = await api.get(`/accounts/${accountId}/stats`);
      return response.data;
    },
    enabled: !!accountId,
  });
};

export const useTopupAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ accountId, topupData }: { accountId: string; topupData: TopupRequest }) => {
      const response = await api.post(`/accounts/${accountId}/topup`, topupData);
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts', variables.accountId, 'balance'] });
    },
  });
};

export const useSuspendAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ accountId, reason }: { accountId: string; reason: string }) => {
      const response = await api.put(`/accounts/${accountId}/suspend`, { reason });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['accounts', variables.accountId] });
    },
  });
};

export const useActivateAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (accountId: string) => {
      const response = await api.put(`/accounts/${accountId}/activate`);
      return response.data;
    },
    onSuccess: (_, accountId) => {
      queryClient.invalidateQueries({ queryKey: ['accounts', accountId] });
    },
  });
};

// Get all accounts
export const useAccounts = () => {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async (): Promise<AccountModel[]> => {
      const response = await api.get('/accounts');
      // Mapear respuesta del backend al modelo frontend
      return response.data.map(mapBackendAccountToFrontend);
    },
  });
};

// Update account
export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ accountId, data }: { accountId: string; data: Partial<AccountModel> }) => {
      const response = await api.put(`/accounts/${accountId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
    },
  });
};

// Get account batches
export const useAccountBatches = (accountId: string, options?: any) => {
  return useQuery({
    queryKey: ['account-batches', accountId],
    queryFn: async (): Promise<BatchModel[]> => {
      const response = await api.get(`/accounts/${accountId}/batches`);
      // Mapear respuesta del backend al modelo frontend
      return response.data.map(mapBackendBatchToFrontend);
    },
    ...options,
  });
};

// Get account transactions
export const useAccountTransactions = (accountId: string, options?: any) => {
  return useQuery({
    queryKey: ['account-transactions', accountId],
    queryFn: async () => {
      const response = await api.get(`/accounts/${accountId}/transactions`);
      // Mapear respuesta del backend al modelo frontend
      return response.data.map(mapBackendTransactionToFrontend);
    },
    ...options,
  });
};

// Batch Management
export const useCreateBatch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (batchData: CreateBatchRequest) => {
      // Eliminar excel_file del payload JSON (se maneja por separado)
      const { excel_file, ...jsonData } = batchData;
      const response = await api.post('/batches', jsonData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
};

export const useBatches = (params: {
  account_id?: string;
  status?: string;
  is_active?: boolean;
  limit?: number;
  skip?: number;
} = {}) => {
  return useQuery({
    queryKey: ['batches', params],
    queryFn: async (): Promise<BatchModel[]> => {
      const response = await api.get('/batches', { params });
      // Mapear respuesta del backend al modelo frontend
      return response.data.map(mapBackendBatchToFrontend);
    },
  });
};

export const useBatch = (batchId: string) => {
  return useQuery({
    queryKey: ['batches', batchId],
    queryFn: async (): Promise<BatchModel> => {
      const response = await api.get(`/batches/${batchId}`);
      return response.data;
    },
    enabled: !!batchId,
  });
};

export const useBatchSummary = (batchId: string) => {
  return useQuery({
    queryKey: ['batches', batchId, 'summary'],
    queryFn: async (): Promise<BatchSummary> => {
      const response = await api.get(`/batches/${batchId}/summary`);
      return response.data;
    },
    enabled: !!batchId,
  });
};

export const useBatchStatus = (batchId: string) => {
  return useQuery({
    queryKey: ['batches', batchId, 'status'],
    queryFn: async (): Promise<BatchStatus> => {
      const response = await api.get(`/batches/${batchId}/status`);
      return response.data;
    },
    enabled: !!batchId,
    refetchInterval: 5000, // Poll every 5 seconds
  });
};

export const useUploadCSVToBatch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ batchId, file }: { batchId: string; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await api.post(`/batches/${batchId}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['batches', variables.batchId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const usePauseBatch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (batchId: string) => {
      const response = await api.put(`/batches/${batchId}/pause`);
      return response.data;
    },
    onSuccess: (_, batchId) => {
      queryClient.invalidateQueries({ queryKey: ['batches', batchId] });
    },
  });
};

export const useResumeBatch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (batchId: string) => {
      const response = await api.put(`/batches/${batchId}/resume`);
      return response.data;
    },
    onSuccess: (_, batchId) => {
      queryClient.invalidateQueries({ queryKey: ['batches', batchId] });
    },
  });
};

export const useDeleteBatch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ batchId, deleteJobs = false }: { batchId: string; deleteJobs?: boolean }) => {
      const response = await api.delete(`/batches/${batchId}`, {
        params: { delete_jobs: deleteJobs },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
};

// Get batch jobs
export const useBatchJobs = (batchId: string, options?: any) => {
  return useQuery({
    queryKey: ['batch-jobs', batchId],
    queryFn: async (): Promise<JobModel[]> => {
      const response = await api.get(`/batches/${batchId}/jobs`);
      return response.data;
    },
    ...options,
  });
};

// Cancel batch
export const useCancelBatch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (batchId: string) => {
      const response = await api.post(`/batches/${batchId}/cancel`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
};

// Excel Processing
export const useExcelPreview = () => {
  return useMutation({
    mutationFn: async ({ file, accountId }: { file: File; accountId: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('account_id', accountId);
      
      const response = await api.post('/batches/excel/preview', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data as ExcelPreviewResponse;
    },
  });
};

export const useCreateBatchFromExcel = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      file,
      accountId,
      batchName,
      batchDescription,
      allowDuplicates = false,
      callSettings,
      processingType = 'basic',
      diasFechaLimite,
      diasFechaMaxima
    }: {
      file: File;
      accountId: string;
      batchName?: string;
      batchDescription?: string;
      allowDuplicates?: boolean;
      callSettings?: any; // CallSettings interface
      processingType?: 'basic' | 'acquisition';
      diasFechaLimite?: number;
      diasFechaMaxima?: number;
    }) => {
      console.group('🔧 useCreateBatchFromExcel - Construyendo FormData:');
      console.log('Parámetros recibidos:');
      console.log('  - file:', file?.name);
      console.log('  - accountId:', accountId);
      console.log('  - accountId tipo:', typeof accountId);
      console.log('  - batchName:', batchName);
      console.log('  - callSettings:', callSettings);
      
      const formData = new FormData();
      
      // Required fields
      formData.append('file', file);
      formData.append('account_id', accountId);
      
      // Optional fields
      if (batchName) formData.append('batch_name', batchName);
      if (batchDescription) formData.append('batch_description', batchDescription);
      formData.append('allow_duplicates', allowDuplicates.toString());
      
      // ⚠️ IMPORTANTE: call_settings debe enviarse como JSON STRING
      if (callSettings) {
        const callSettingsJson = JSON.stringify(callSettings);
        console.log('  - call_settings_json:', callSettingsJson.substring(0, 100) + '...');
        formData.append('call_settings_json', callSettingsJson);
      }
      
      // Processing type and date limits
      if (processingType) formData.append('processing_type', processingType);
      if (diasFechaLimite !== undefined) formData.append('dias_fecha_limite', diasFechaLimite.toString());
      if (diasFechaMaxima !== undefined) formData.append('dias_fecha_maxima', diasFechaMaxima.toString());
      
      // Log FormData contents
      console.log('📋 FormData final:');
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: [File] ${value.name}`);
        } else {
          console.log(`  ${key}:`, value);
        }
      }
      console.groupEnd();
      
      const response = await api.post('/batches/excel/create', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data as ExcelCreateResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
};

// Country-specific batch creation
export const useCreateChileBatch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      file,
      accountId,
      useCase,
      companyName,
      batchName,
    }: {
      file: File;
      accountId: string;
      useCase: 'debt_collection' | 'marketing';
      companyName: string;
      batchName?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('account_id', accountId);
      formData.append('company_name', companyName);
      if (batchName) formData.append('batch_name', batchName);
      
      const response = await api.post(`/batches/chile/${useCase}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
};

export const useCreateArgentinaBatch = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      file,
      accountId,
      useCase,
      companyName,
      batchName,
    }: {
      file: File;
      accountId: string;
      useCase: 'debt_collection' | 'marketing';
      companyName: string;
      batchName?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('account_id', accountId);
      formData.append('company_name', companyName);
      if (batchName) formData.append('batch_name', batchName);
      
      const response = await api.post(`/batches/argentina/${useCase}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
    },
  });
};

// Job Management
export const useJobs = (params: {
  account_id?: string;
  batch_id?: string;
  status?: string;
  limit?: number;
  skip?: number;
} = {}) => {
  return useQuery({
    queryKey: ['jobs', params],
    queryFn: async (): Promise<JobModel[]> => {
      const response = await api.get('/jobs', { params });
      return response.data;
    },
  });
};

export const useJob = (jobId: string) => {
  return useQuery({
    queryKey: ['jobs', jobId],
    queryFn: async (): Promise<JobModel> => {
      const response = await api.get(`/jobs/${jobId}`);
      return response.data;
    },
    enabled: !!jobId,
  });
};

export const useRetryJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await api.put(`/jobs/${jobId}/retry`);
      return response.data;
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ['jobs', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

export const useCancelJob = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await api.delete(`/jobs/${jobId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
};

// Dashboard and Statistics
export const useDashboardStats = (accountId?: string) => {
  return useQuery({
    queryKey: ['dashboard', 'stats', accountId],
    queryFn: async (): Promise<DashboardStats> => {
      const params = accountId ? { account_id: accountId } : {};
      const response = await api.get('/dashboard/stats', { params });
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const useCallHistory = (params: {
  account_id?: string;
  batch_id?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
  skip?: number;
} = {}) => {
  return useQuery({
    queryKey: ['calls', 'history', params],
    queryFn: async (): Promise<CallHistoryItem[]> => {
      const response = await api.get('/calls/history', { params });
      return response.data;
    },
  });
};

// Use Cases
export const useUseCases = () => {
  return useQuery({
    queryKey: ['use-cases'],
    queryFn: async (): Promise<UseCase[]> => {
      const response = await api.get('/use-cases');
      return response.data;
    },
  });
};

// Reports (placeholder - these endpoints don't exist yet)
export const useReports = () => {
  return useQuery({
    queryKey: ['reports'],
    queryFn: async () => {
      // This endpoint doesn't exist yet, return mock data
      return {
        reports: [],
        message: 'Reports endpoint not implemented yet',
      };
    },
  });
};

export const useGenerateReport = () => {
  return useMutation({
    mutationFn: async (params: any) => {
      // This endpoint doesn't exist yet
      console.log('Generate report called with:', params);
      return { success: true, message: 'Report endpoint not implemented yet' };
    },
  });
};