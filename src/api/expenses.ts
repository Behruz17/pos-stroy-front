import { apiClient } from './client';

export interface Expense {
  id: number;
  description: string;
  amount: number;
  expense_date: string;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export interface CreateExpenseRequest {
  description: string;
  amount: number;
  expense_date: string;
}

export interface UpdateExpenseRequest {
  description?: string;
  amount?: number;
  expense_date?: string;
}

export interface ExpenseFilters {
  date?: string;
  month?: number;
  year?: number;
}

export const expensesApi = {
  getAll: async (filters?: ExpenseFilters): Promise<Expense[]> => {
    const params = new URLSearchParams();
    if (filters?.date) params.append('date', filters.date);
    if (filters?.month) params.append('month', filters.month.toString());
    if (filters?.year) params.append('year', filters.year.toString());
    
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
  }
};
