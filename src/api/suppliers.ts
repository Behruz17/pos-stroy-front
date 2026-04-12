import { apiClient } from './client';

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  balance: number;
  status: number;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSupplierRequest {
  name: string;
  phone?: string;
  currency?: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  phone?: string;
  status?: number;
  currency?: string;
}

export interface DeleteSupplierResponse {
  message: string;
}

export const suppliersApi = {
  // GET /suppliers - Получение списка всех поставщиков
  getAll: async (): Promise<Supplier[]> => {
    const response = await apiClient.get<Supplier[]>('/suppliers');
    return response.data;
  },

  // GET /suppliers/:id - Получение одного поставщика по ID
  getById: async (id: number): Promise<Supplier> => {
    const response = await apiClient.get<Supplier>(`/suppliers/${id}`);
    return response.data;
  },

  // POST /suppliers - Создание нового поставщика
  create: async (data: CreateSupplierRequest): Promise<Supplier> => {
    const response = await apiClient.post<Supplier>('/suppliers', data);
    return response.data;
  },

  // PUT /suppliers/:id - Обновление поставщика
  update: async (id: number, data: UpdateSupplierRequest): Promise<Supplier> => {
    const response = await apiClient.put<Supplier>(`/suppliers/${id}`, data);
    return response.data;
  },

  // DELETE /suppliers/:id - Удаление поставщика
  delete: async (id: number): Promise<DeleteSupplierResponse> => {
    const response = await apiClient.delete<DeleteSupplierResponse>(`/suppliers/${id}`);
    return response.data;
  },
};
