import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Storage keys
export const TOKEN_KEY = 'token';
export const USER_KEY = 'user';

// Token management
export const getToken = (): string | null => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string): void => localStorage.setItem(TOKEN_KEY, token);
export const removeToken = (): void => localStorage.removeItem(TOKEN_KEY);

// User management
export const getUser = (): { id: number; login: string; name: string; role: string } | null => {
  const userStr = localStorage.getItem(USER_KEY);
  return userStr ? JSON.parse(userStr) : null;
};
export const setUser = (user: { id: number; login: string; name: string; role: string }): void => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};
export const removeUser = (): void => localStorage.removeItem(USER_KEY);

// Create axios instance
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Response interceptor - handle 401
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      removeToken();
      removeUser();
      if (!isLoginRequest) {
        message.error('Сессия истекла. Пожалуйста, войдите снова.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Check if authenticated
export const isAuthenticated = (): boolean => !!getToken();

// Re-export types from types.ts for convenience
export type { User, LoginRequest, LoginResponse, LogoutResponse } from './types';
