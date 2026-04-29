import { apiClient } from './client';

export interface StockAdjustment {
  id: number;
  product_id: number;
  product_name: string;
  previous_quantity: number;
  new_quantity: number;
  adjustment: number;
  previous_price?: number;
  new_price?: number;
  price_adjustment?: number;
  reason: string;
  created_by: number;
  user_name: string;
  created_at: string;
  status: number;
}

export interface CreateStockAdjustment {
  product_id: number;
  new_quantity?: number;
  new_price?: number;
  reason: string;
}

export const stockAdjustmentsApi = {
  getAll: async (): Promise<StockAdjustment[]> => {
    const response = await apiClient.get('/stock-adjustments');
    return response.data;
  },

  getByProduct: async (productId: number): Promise<StockAdjustment[]> => {
    const response = await apiClient.get(`/stock-adjustments/product/${productId}`);
    return response.data;
  },

  create: async (data: CreateStockAdjustment): Promise<StockAdjustment> => {
    const response = await apiClient.post('/stock-adjustments', data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/stock-adjustments/${id}`);
    return response.data;
  },
};
