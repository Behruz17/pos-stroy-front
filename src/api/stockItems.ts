import { apiClient } from './client';

export interface StockItem {
  id: number;
  product_id?: number;
  product_name?: string;
  batch_code: string;
  quantity: number;
  purchase_cost?: number;
  selling_price?: number;
  receipt_id?: number;
  created_at?: string;
  status?: number; // 1 = active
}

export interface StockItemsByProductResponse {
  product_id: number;
  product_type: 'simple' | 'batch';
  product_name: string;
  currency: string; // Currency inherited from product
  total_quantity: number;
  batches?: StockItem[];
  message?: string; // for simple products
}

export const stockItemsApi = {
  // GET /products/:id/stock-items - Get stock items (batches) by product id
  getByProductId: async (productId: number): Promise<StockItemsByProductResponse> => {
    const response = await apiClient.get<StockItemsByProductResponse>(`/products/${productId}/stock-items`);
    return response.data;
  },

  // GET /stock-items/:id - Get single batch details
  getById: async (id: number): Promise<StockItem> => {
    const response = await apiClient.get<StockItem>(`/stock-items/${id}`);
    return response.data;
  },
};
