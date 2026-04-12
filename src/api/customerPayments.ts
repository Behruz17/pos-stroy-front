import { apiClient } from './client';

export interface CustomerPayment {
  id: number;
  customer_id: number;
  customer_name: string;
  sum: number;
  type: 'PAYMENT';
  date: string;
  status: number;
}

export interface CreateCustomerPaymentRequest {
  customer_id: number;
  sum: number;
}

export interface CreateCustomerPaymentResponse {
  id: number;
  customer_id: number;
  sum: string;
  type: 'PAYMENT';
}

export const customerPaymentsApi = {
  getAll: async (): Promise<CustomerPayment[]> => {
    const response = await apiClient.get('/customer-payments');
    return response.data;
  },

  create: async (data: CreateCustomerPaymentRequest): Promise<CreateCustomerPaymentResponse> => {
    const response = await apiClient.post('/customer-payments', data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/customer-payments/${id}`);
    return response.data;
  }
};
