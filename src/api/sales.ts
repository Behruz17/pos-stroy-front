import { apiClient } from './client';

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  stock_item_id?: number | null;
  style_id?: number | null;
  style_name?: string;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  unit_value?: number;
  total_price: number;
}

export type SaleStage = 'ordered' | 'ready' | 'delivered';

export interface Sale {
  id: number;
  customer_id: number;
  customer_name: string;
  total_amount: string;
  cash_amount: string;
  electronic_amount: string;
  payment_status: 'PAID' | 'DEBT' | 'PARTIAL';
  stage: SaleStage;
  debt_deadline?: string;
  created_by: number;
  created_at: string;
  items?: SaleItem[];
}

export interface CreateSaleItem {
  product_id: number;
  stock_item_id?: number;
  style_id?: number;
  quantity: number;
  unit_price: number;
  unit_value?: number;
}

export interface CreateSaleRequest {
  customer_id: number;
  payment_status: 'PAID' | 'DEBT' | 'PARTIAL';
  cash_amount?: number;
  electronic_amount?: number;
  stage?: SaleStage;
  debt_deadline?: string;
  account_id?: number;
  items: CreateSaleItem[];
}

export interface UpdateSaleItem {
  product_id: number;
  stock_item_id?: number;
  style_id?: number;
  quantity: number;
  unit_price: number;
  unit_value: number;
}

export interface DeleteSaleResponse {
  message: string;
}

export interface OverdueSale {
  id: number;
  customer_id: number;
  customer_name: string;
  total_amount: number;
  payment_status: 'DEBT';
  debt_deadline: string;
  created_at: string;
}

export interface OverdueSalesSummary {
  total_overdue_sales: number;
  total_overdue_amount: number;
  customers_with_debt: number;
  avg_days_overdue: number;
}

export interface OverdueSaleByCustomer {
  customer_id: number;
  customer_name: string;
  phone?: string;
  overdue_sales_count: number;
  total_overdue_amount: number;
  earliest_deadline: string;
  latest_deadline: string;
  avg_days_overdue: number;
}

export interface StageHistoryEntry {
  id: number;
  sale_id: number;
  from_stage: SaleStage;
  to_stage: SaleStage;
  changed_by: number;
  changed_by_username: string;
  created_at: string;
}

export interface UpdateStageRequest {
  stage: SaleStage;
}

export interface UpdateStageResponse {
  success: boolean;
  sale_id: number;
  from_stage: SaleStage;
  to_stage: SaleStage;
  message: string;
}

export interface AddPaymentRequest {
  amount: number;
  account_id?: number;
}

export interface AddPaymentResponse {
  success: boolean;
  sale_id: number;
  previous_paid: number;
  new_paid: number;
  total_amount: number;
  remaining: number;
  payment_status: 'PAID' | 'DEBT' | 'PARTIAL';
  message: string;
}

export interface UpdateSaleRequest {
  customer_id?: number;
  payment_status?: 'PAID' | 'DEBT' | 'PARTIAL';
  items?: UpdateSaleItem[];
}

export const salesApi = {
  // GET /sales - Getting list of all sales with date filtering
  getAll: async (params?: { date?: string; month?: number; year?: number }): Promise<Sale[]> => {
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
    
    const url = queryParams.toString() ? `/sales?${queryParams.toString()}` : '/sales';
    console.log('Fetching sales from URL:', url);
    const response = await apiClient.get<Sale[]>(url);
    return response.data;
  },

  // GET /sales/:id - Getting one sale by ID with items
  getById: async (id: number): Promise<Sale> => {
    const response = await apiClient.get<Sale>(`/sales/${id}`);
    return response.data;
  },

  // POST /sales - Creating a new sale
  create: async (data: CreateSaleRequest): Promise<Sale> => {
    const response = await apiClient.post<Sale>('/sales', data);
    return response.data;
  },

  // PUT /sales/:id - Updating a sale
  update: async (id: number, data: UpdateSaleRequest): Promise<Sale> => {
    const response = await apiClient.put<Sale>(`/sales/${id}`, data);
    return response.data;
  },

  // DELETE /sales/:id - Deleting sale
  delete: async (id: number): Promise<DeleteSaleResponse> => {
    const response = await apiClient.delete<DeleteSaleResponse>(`/sales/${id}`);
    return response.data;
  },

  // GET /overdue-sales - Getting all overdue sales
  getOverdueSales: async (): Promise<OverdueSale[]> => {
    const response = await apiClient.get<OverdueSale[]>('/overdue-sales');
    return response.data;
  },

  // GET /overdue-sales/summary - Getting overdue sales summary
  getOverdueSalesSummary: async (): Promise<OverdueSalesSummary> => {
    const response = await apiClient.get<OverdueSalesSummary>('/overdue-sales/summary');
    return response.data;
  },

  // GET /overdue-sales/by-customer - Getting overdue sales by customer
  getOverdueSalesByCustomer: async (): Promise<OverdueSaleByCustomer[]> => {
    const response = await apiClient.get<OverdueSaleByCustomer[]>('/overdue-sales/by-customer');
    return response.data;
  },

  // GET /overdue-sales/:id - Getting overdue sale by ID with items
  getOverdueSaleById: async (id: number): Promise<Sale> => {
    const response = await apiClient.get<Sale>(`/overdue-sales/${id}`);
    return response.data;
  },

  // PUT /sales/:id/stage - Update sale stage
  updateStage: async (id: number, data: UpdateStageRequest): Promise<UpdateStageResponse> => {
    const response = await apiClient.put<UpdateStageResponse>(`/sales/${id}/stage`, data);
    return response.data;
  },

  // GET /sales/:id/stage-history - Get stage history
  getStageHistory: async (id: number): Promise<StageHistoryEntry[]> => {
    const response = await apiClient.get<StageHistoryEntry[]>(`/sales/${id}/stage-history`);
    return response.data;
  },

  // POST /sales/:id/payment - Add partial payment
  addPayment: async (id: number, data: AddPaymentRequest): Promise<AddPaymentResponse> => {
    const response = await apiClient.post<AddPaymentResponse>(`/sales/${id}/payment`, data);
    return response.data;
  },
};
