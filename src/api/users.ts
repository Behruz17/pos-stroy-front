import { apiClient } from './client';

export interface UserWithCreated {
  id: number;
  login: string;
  name: string;
  role: string;
  created_at: string;
}

export interface UpdateUserRequest {
  login?: string;
  name?: string;
  role?: string;
}

export interface UpdateUserResponse extends UserWithCreated {
  message: string;
}

export interface DeleteUserResponse {
  message: string;
}

export const usersApi = {
  // GET /users - Получение списка всех пользователей
  getAll: async (): Promise<UserWithCreated[]> => {
    const response = await apiClient.get<UserWithCreated[]>('/users');
    return response.data;
  },

  // GET /users/:id - Получение одного пользователя по ID
  getById: async (id: number): Promise<UserWithCreated> => {
    const response = await apiClient.get<UserWithCreated>(`/users/${id}`);
    return response.data;
  },

  // PUT /users/:id - Обновление пользователя
  update: async (id: number, data: UpdateUserRequest): Promise<UpdateUserResponse> => {
    const response = await apiClient.put<UpdateUserResponse>(`/users/${id}`, data);
    return response.data;
  },

  // DELETE /users/:id - Удаление пользователя
  delete: async (id: number): Promise<DeleteUserResponse> => {
    const response = await apiClient.delete<DeleteUserResponse>(`/users/${id}`);
    return response.data;
  },
};
