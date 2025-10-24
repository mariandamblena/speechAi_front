import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { ApiError } from '@/types';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    // Better error logging for debugging
    console.group('🔴 API Error Details:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.message);
    console.log('Response Data:', error.response?.data);
    console.log('Request URL:', error.config?.url);
    console.log('Request Method:', error.config?.method?.toUpperCase());
    console.log('Request Body:', error.config?.data ? JSON.parse(error.config.data) : undefined);
    console.log('Base URL:', error.config?.baseURL);
    console.log('Full URL:', `${error.config?.baseURL}${error.config?.url}`);
    console.log('Request Params:', error.config?.params);
    console.groupEnd();
    
    // Transform to ApiError for consistency
    const responseData = error.response?.data as any;
    const apiError: ApiError = {
      message: responseData?.message || error.message || 'An error occurred',
      code: responseData?.code || 'API_ERROR',
      status: error.response?.status || 500,
    };

    return Promise.reject(apiError);
  }
);

export { api };