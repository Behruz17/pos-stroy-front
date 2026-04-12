import { apiClient } from './client';

export interface ReturnItem {
  id: number;
  return_id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Return {
  id: number;
  customer_id: number;
  customer_name: string;
  total_amount: number;
  created_by: number;
  created_at: string;
  items?: ReturnItem[];
}

export interface CreateReturnItem {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface CreateReturnRequest {
  customer_id: number;
  items: CreateReturnItem[];
}

export interface DeleteReturnResponse {
  message: string;
}

export const returnsApi = {
  // GET /returns - Getting list of all returns
  getAll: async (params?: { date?: string; month?: number; year?: number }): Promise<Return[]> => {
    const response = await apiClient.get<Return[]>('/returns', { params });
    return response.data;
  },

  // GET /returns/:id - Getting one return by ID with items
  getById: async (id: number): Promise<Return> => {
    const response = await apiClient.get<Return>(`/returns/${id}`);
    return response.data;
  },

  // POST /returns - Creating a new return
  create: async (data: CreateReturnRequest): Promise<Return> => {
    const response = await apiClient.post<Return>('/returns', data);
    return response.data;
  },

  // DELETE /returns/:id - Deleting return
  delete: async (id: number): Promise<DeleteReturnResponse> => {
    const response = await apiClient.delete<DeleteReturnResponse>(`/returns/${id}`);
    return response.data;
  },
};
