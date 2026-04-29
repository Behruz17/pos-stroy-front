import { apiClient } from './client';

export interface Style {
  id: number;
  name: string;
  description: string;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface CreateStyleRequest {
  name: string;
  description?: string;
}

export interface UpdateStyleRequest {
  name?: string;
  description?: string;
}

export const stylesApi = {
  // GET /styles - Получение списка всех активных стилей
  getAll: async (): Promise<Style[]> => {
    const response = await apiClient.get<Style[]>('/styles');
    return response.data;
  },

  // GET /styles/:id - Получение стиля по ID
  getById: async (id: number): Promise<Style> => {
    const response = await apiClient.get<Style>(`/styles/${id}`);
    return response.data;
  },

  // POST /styles - Создание нового стиля
  create: async (data: CreateStyleRequest): Promise<Style> => {
    const response = await apiClient.post<Style>('/styles', data);
    return response.data;
  },

  // PUT /styles/:id - Обновление стиля
  update: async (id: number, data: UpdateStyleRequest): Promise<{ message: string }> => {
    const response = await apiClient.put<{ message: string }>(`/styles/${id}`, data);
    return response.data;
  },

  // DELETE /styles/:id - Удаление стиля (soft delete)
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/styles/${id}`);
    return response.data;
  }
};
