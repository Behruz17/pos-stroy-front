import { apiClient } from './client';

export interface CustomerOperation {
  id: number;
  customer_id: number;
  sale_id: number | null;
  customer_name: string;
  sum: number;
  type: 'DEBT' | 'PAID' | 'PARTIAL' | 'PAYMENT' | 'RETURN';
  date: string;
  status: number;
}

export interface CustomerOperationFilters {
  date?: string;
  month?: number;
  year?: number;
  type?: 'DEBT' | 'PAID' | 'PAYMENT' | 'RETURN';
  customer_id?: number;
}

export const customerOperationsApi = {
  getAll: async (filters?: CustomerOperationFilters): Promise<CustomerOperation[]> => {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.customer_id) params.append('customer_id', filters.customer_id.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/customer-operations?${queryString}` : '/customer-operations';
    
    const response = await apiClient.get(url);
    return response.data;
  },

  getById: async (id: number): Promise<CustomerOperation> => {
    const response = await apiClient.get(`/customer-operations/${id}`);
    return response.data;
  }
};
