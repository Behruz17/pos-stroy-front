import { apiClient } from './client';

export interface Debtor {
  id: number;
  full_name: string;
  phone: string;
  debt_amount: number;
  description: string;
  created_at: string;
  updated_at: string;
  status: number;
}

export interface CreateDebtorRequest {
  full_name: string;
  phone: string;
  debt_amount: number;
  description: string;
}

export interface UpdateDebtorRequest {
  full_name?: string;
  phone?: string;
  debt_amount?: number;
  description?: string;
}

export interface DebtorFilters {
  date?: string;
  month?: number;
  year?: number;
}

export const debtorsApi = {
  // GET /debtors - Getting list of all debtors with date filtering
  getAll: async (filters?: DebtorFilters): Promise<Debtor[]> => {
    const params = new URLSearchParams();
    
    if (filters?.date) {
      params.append('date', filters.date);
    }
    if (filters?.month !== undefined) {
      params.append('month', filters.month.toString());
    }
    if (filters?.year !== undefined) {
      params.append('year', filters.year.toString());
    }
    
    const url = params.toString() ? `/debtors?${params.toString()}` : '/debtors';
    console.log('Fetching debtors from URL:', url);
    const response = await apiClient.get<Debtor[]>(url);
    return response.data;
  },

  // GET /debtors/:id - Getting one debtor by ID
  getById: async (id: number): Promise<Debtor> => {
    const response = await apiClient.get<Debtor>(`/debtors/${id}`);
    return response.data;
  },

  // POST /debtors - Creating a new debtor
  create: async (data: CreateDebtorRequest): Promise<Debtor> => {
    const response = await apiClient.post<Debtor>('/debtors', data);
    return response.data;
  },

  // PUT /debtors/:id - Updating a debtor
  update: async (id: number, data: UpdateDebtorRequest): Promise<Debtor> => {
    const response = await apiClient.put<Debtor>(`/debtors/${id}`, data);
    return response.data;
  },

  // DELETE /debtors/:id - Deleting debtor
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/debtors/${id}`);
    return response.data;
  },
};
