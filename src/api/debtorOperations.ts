import { apiClient } from './client';

export interface DebtorOperation {
  id: number;
  debtor_id: number;
  debtor_name: string;
  amount: number;
  type: 'BORROWED' | 'RETURNED';
  description: string;
  date: string;
  status: number;
}

export interface CreateBorrowedRequest {
  debtor_id: number;
  account_id: number;
  amount: number;
  description: string;
  created_by: number;
}

export interface CreateReturnedRequest {
  debtor_id: number;
  account_id: number;
  amount: number;
  description: string;
  created_by: number;
}

export interface DebtorOperationFilters {
  date?: string;
  month?: number;
  year?: number;
  type?: 'BORROWED' | 'RETURNED';
  debtor_id?: number;
}

export const debtorOperationsApi = {
  // GET /debtor-operations - Getting list of all debtor operations with filtering
  getAll: async (filters?: DebtorOperationFilters): Promise<DebtorOperation[]> => {
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
    if (filters?.type) {
      params.append('type', filters.type);
    }
    if (filters?.debtor_id) {
      params.append('debtor_id', filters.debtor_id.toString());
    }
    
    const url = params.toString() ? `/debtor-operations?${params.toString()}` : '/debtor-operations';
    console.log('Fetching debtor operations from URL:', url);
    const response = await apiClient.get<DebtorOperation[]>(url);
    return response.data;
  },

  // GET /debtor-operations/:id - Getting one debtor operation by ID
  getById: async (id: number): Promise<DebtorOperation> => {
    const response = await apiClient.get<DebtorOperation>(`/debtor-operations/${id}`);
    return response.data;
  },

  // POST /debtor-operations/borrowed - Creating a borrowed operation
  createBorrowed: async (data: CreateBorrowedRequest): Promise<DebtorOperation> => {
    const response = await apiClient.post<DebtorOperation>('/debtor-operations/borrowed', data);
    return response.data;
  },

  // POST /debtor-operations/returned - Creating a returned operation
  createReturned: async (data: CreateReturnedRequest): Promise<DebtorOperation> => {
    const response = await apiClient.post<DebtorOperation>('/debtor-operations/returned', data);
    return response.data;
  },

  // DELETE /debtor-operations/:id - Deleting debtor operation
  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/debtor-operations/${id}`);
    return response.data;
  },
};
