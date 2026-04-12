import { apiClient } from './client';

export interface SupplierOperation {
  id: number;
  supplier_id: number;
  receipt_id: number | null;
  supplier_name: string;
  sum: number;
  type: 'RECEIPT' | 'PAYMENT';
  date: string;
  status: number;
}

export interface SupplierOperationFilters {
  date?: string;
  month?: number;
  year?: number;
  type?: 'RECEIPT' | 'PAYMENT';
  supplier_id?: number;
}

export const supplierOperationsApi = {
  getAll: async (filters?: SupplierOperationFilters): Promise<SupplierOperation[]> => {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.type) params.append('type', filters.type);
    if (filters?.supplier_id) params.append('supplier_id', filters.supplier_id.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/supplier-operations?${queryString}` : '/supplier-operations';
    
    const response = await apiClient.get(url);
    return response.data;
  },

  getById: async (id: number): Promise<SupplierOperation> => {
    const response = await apiClient.get(`/supplier-operations/${id}`);
    return response.data;
  }
};
