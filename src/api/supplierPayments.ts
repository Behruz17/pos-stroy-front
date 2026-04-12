import { apiClient } from './client';

export interface SupplierPayment {
  id: number;
  supplier_id: number;
  supplier_name: string;
  sum: number;
  type: 'PAYMENT';
  date: string;
}

export interface CreateSupplierPaymentRequest {
  supplier_id: number;
  sum: number;
}

export interface CreateSupplierPaymentResponse {
  id: number;
  supplier_id: number;
  sum: string;
  type: 'PAYMENT';
}

export const supplierPaymentsApi = {
  getAll: async (): Promise<SupplierPayment[]> => {
    const response = await apiClient.get('/supplier-payments');
    return response.data;
  },

  create: async (data: CreateSupplierPaymentRequest): Promise<CreateSupplierPaymentResponse> => {
    const response = await apiClient.post('/supplier-payments', data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/supplier-payments/${id}`);
    return response.data;
  }
};
