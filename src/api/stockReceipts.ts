import { apiClient } from './client';

export interface StockReceiptItem {
  id: number;
  receipt_id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  purchase_cost: number;
  selling_price: number;
}

export interface StockReceipt {
  id: number;
  created_by: number;
  created_at: string;
  total_amount: number;
  supplier_id: number;
  supplier_name: string;
  items?: StockReceiptItem[];
}

export interface CreateStockReceiptItem {
  product_id: number;
  quantity: number;
  purchase_cost: number;
  selling_price: number;
}

export interface CreateStockReceiptRequest {
  supplier_id: number;
  items: CreateStockReceiptItem[];
}

export interface DeleteStockReceiptResponse {
  message: string;
}

export const stockReceiptsApi = {
  // GET /stock-receipts - Getting list of all stock receipts with date filtering
  getAll: async (params?: { date?: string; month?: number; year?: number }): Promise<StockReceipt[]> => {
    const queryParams = new URLSearchParams();
    
    if (params?.date) {
      queryParams.append('date', params.date);
    }
    if (params?.month !== undefined) {
      queryParams.append('month', params.month.toString());
    }
    if (params?.year !== undefined) {
      queryParams.append('year', params.year.toString());
    }
    
    const url = queryParams.toString() ? `/stock-receipts?${queryParams.toString()}` : '/stock-receipts';
    const response = await apiClient.get<StockReceipt[]>(url);
    return response.data;
  },

  // GET /stock-receipts/:id - Getting one stock receipt by ID with items
  getById: async (id: number): Promise<StockReceipt> => {
    const response = await apiClient.get<StockReceipt>(`/stock-receipts/${id}`);
    return response.data;
  },

  // POST /stock-receipts - Creating a new stock receipt
  create: async (data: CreateStockReceiptRequest): Promise<StockReceipt> => {
    const response = await apiClient.post<StockReceipt>('/stock-receipts', data);
    return response.data;
  },

  // DELETE /stock-receipts/:id - Deleting stock receipt
  delete: async (id: number): Promise<DeleteStockReceiptResponse> => {
    const response = await apiClient.delete<DeleteStockReceiptResponse>(`/stock-receipts/${id}`);
    return response.data;
  },
};
