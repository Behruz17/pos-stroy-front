import { apiClient } from './client';

export interface Customer {
  id: number;
  full_name: string;
  phone: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomerRequest {
  full_name: string;
  phone?: string;
}

export interface UpdateCustomerRequest {
  full_name?: string;
  phone?: string;
}

export interface DeleteCustomerResponse {
  message: string;
}

export const customersApi = {
  // GET /customers - Getting list of all customers
  getAll: async (): Promise<Customer[]> => {
    const response = await apiClient.get<Customer[]>('/customers');
    return response.data;
  },

  // GET /customers/:id - Getting one customer by ID
  getById: async (id: number): Promise<Customer> => {
    const response = await apiClient.get<Customer>(`/customers/${id}`);
    return response.data;
  },

  // POST /customers - Creating a new customer
  create: async (data: CreateCustomerRequest): Promise<Customer> => {
    const response = await apiClient.post<Customer>('/customers', data);
    return response.data;
  },

  // PUT /customers/:id - Updating customer
  update: async (id: number, data: UpdateCustomerRequest): Promise<Customer> => {
    const response = await apiClient.put<Customer>(`/customers/${id}`, data);
    return response.data;
  },

  // DELETE /customers/:id - Deleting customer
  delete: async (id: number): Promise<DeleteCustomerResponse> => {
    const response = await apiClient.delete<DeleteCustomerResponse>(`/customers/${id}`);
    return response.data;
  },
};
