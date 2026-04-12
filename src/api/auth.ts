import { apiClient, setToken, setUser, removeToken, removeUser } from './client';
import type { User, LoginRequest, LoginResponse, LogoutResponse, RegisterRequest, RegisterResponse } from './types';

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    const { token, user } = response.data;
    setToken(token);
    setUser(user);
    return response.data;
  },

  logout: async (): Promise<LogoutResponse> => {
    const response = await apiClient.post<LogoutResponse>('/auth/logout');
    removeToken();
    removeUser();
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },
};
