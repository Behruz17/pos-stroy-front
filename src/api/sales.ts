import { apiClient } from './client';

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number;
  product_name: string;
  product_code: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Sale {
  id: number;
  customer_id: number;
  customer_name: string;
  total_amount: number;
  payment_status: 'PAID' | 'DEBT';
  created_by: number;
  created_at: string;
  items?: SaleItem[];
}

export interface CreateSaleItem {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface CreateSaleRequest {
  customer_id: number;
  payment_status: 'PAID' | 'DEBT';
  items: CreateSaleItem[];
}

export interface UpdateSaleItem {
  product_id: number;
  quantity: number;
  unit_price: number;
}

export interface DeleteSaleResponse {
  message: string;
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
  update: async (id: number, data: { customer_id?: number; payment_status?: 'PAID' | 'DEBT'; items?: UpdateSaleItem[] }): Promise<Sale> => {
    const response = await apiClient.put<Sale>(`/sales/${id}`, data);
    return response.data;
  },

  // DELETE /sales/:id - Deleting sale
  delete: async (id: number): Promise<DeleteSaleResponse> => {
    const response = await apiClient.delete<DeleteSaleResponse>(`/sales/${id}`);
    return response.data;
  },
};
