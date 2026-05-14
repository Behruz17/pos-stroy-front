import { apiClient } from './client';

export interface Expense {
  id: number;
  description: string;
  amount: string;
  account_id?: number;
  expense_date: string;
  recipient_id?: number;
  recipient_name?: string;
  display_name?: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
  status: number;
}

export interface CreateExpenseRequest {
  description: string;
  account_id?: number;
  amount: number;
  expense_date: string;
  recipient_id?: number;
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  expense_date?: string;
  recipient_id?: number;
}

export interface ExpenseFilters {
  date?: string;
  month?: number;
  year?: number;
  recipient_id?: number;
  created_by?: number;
}

export interface ExpenseRecipient {
  id: number;
  name: string;
  type: 'employee' | 'other';
  reference_id?: number;
  display_name: string;
  status: number;
  created_at: string;
}

export interface CreateExpenseRecipientRequest {
  name: string;
  type: 'employee' | 'other';
  reference_id?: number;
}

export interface UpdateExpenseRecipientRequest {
  name?: string;
  type?: 'employee' | 'other';
  reference_id?: number;
}

export interface SyncRecipientsResponse {
  success: boolean;
  synced_count: number;
}

export const expensesApi = {
  getAll: async (filters?: ExpenseFilters): Promise<Expense[]> => {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    if (filters?.recipient_id) params.append('recipient_id', filters.recipient_id.toString());
    if (filters?.created_by) params.append('created_by', filters.created_by.toString());
    
    const queryString = params.toString();
    const url = queryString ? `/expenses?${queryString}` : '/expenses';
    
    const response = await apiClient.get(url);
    return response.data;
  },

  getById: async (id: number): Promise<Expense> => {
    const response = await apiClient.get(`/expenses/${id}`);
    return response.data;
  },

  create: async (data: CreateExpenseRequest): Promise<Expense> => {
    const response = await apiClient.post('/expenses', data);
    return response.data;
  },

  update: async (id: number, data: UpdateExpenseRequest): Promise<{ message: string }> => {
    const response = await apiClient.put(`/expenses/${id}`, data);
    return response.data;
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/expenses/${id}`);
    return response.data;
  },

  // Expense Recipients API
  getRecipients: async (): Promise<ExpenseRecipient[]> => {
    const response = await apiClient.get('/expense-recipients');
    return response.data;
  },

  syncRecipients: async (): Promise<SyncRecipientsResponse> => {
    const response = await apiClient.get('/expense-recipients/sync');
    return response.data;
  },

  createRecipient: async (data: CreateExpenseRecipientRequest): Promise<ExpenseRecipient> => {
    const response = await apiClient.post('/expense-recipients', data);
    return response.data;
  },

  updateRecipient: async (id: number, data: UpdateExpenseRecipientRequest): Promise<ExpenseRecipient> => {
    const response = await apiClient.put(`/expense-recipients/${id}`, data);
    return response.data;
  },

  deleteRecipient: async (id: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/expense-recipients/${id}`);
    return response.data;
  }
};
