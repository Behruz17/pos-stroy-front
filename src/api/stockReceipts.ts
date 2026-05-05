import { apiClient } from './client';

export interface StockReceiptItem {
  id: number;
  stock_receipt_id: number;
  product_id: number;
  quantity: number;
  purchase_cost: string;
  selling_price: string;
  purchase_cost_converted: string;
  actual_cost: string;
  actual_cost_converted: string;
  tonnage?: string | null;
  price_per_ton?: string | null;
  batch_code?: string | null;
  created_at: string;
  updated_at: string;
}

export interface StockReceipt {
  id: number;
  created_by: number;
  created_at: string;
  total_amount: string;
  supplier_id: number;
  supplier_name: string;
  currency: string;
  rate: string;
  total_amount_converted?: string | null;
  delivery_cost?: string | null;
  items?: StockReceiptItem[];
}

export interface CreateStockReceiptItem {
  product_id: number;
  quantity: number;
  purchase_cost: number;
  actual_cost: number;
  selling_price: number;
  tonnage?: number | null;
  price_per_ton?: number | null;
  batch_code?: string;
}

export interface CreateStockReceiptRequest {
  supplier_id: number;
  currency?: string;
  rate?: number;
  delivery_cost?: number;
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
