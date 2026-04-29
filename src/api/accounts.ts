import { apiClient } from './client';

export interface AccountTransaction {
  id: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  reference_type: string | null;
  reference_id: number | null;
  description: string | null;
  created_at: string;
}

export interface Account {
  id: number;
  name: string;
  type: 'CASH' | 'ELECTRONIC';
  currency: 'TJS' | 'USD' | 'RUB';
  initial_balance: number;
  transaction_balance: number;
  current_balance: number;
  balance_usd: number;
  usd_rate: number;
  status: number;
  created_at: string;
  updated_at: string;
  recent_transactions?: AccountTransaction[];
  transactions?: AccountTransaction[];
}

export interface CreateTransactionRequest {
  account_id: number;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  reference_type?: string;
  reference_id?: number;
  description?: string;
}

export interface CreateTransactionResponse {
  id: number;
}

export const accountsApi = {
  getAll: async (): Promise<Account[]> => {
    const response = await apiClient.get('/accounts');
    return response.data;
  },

  getById: async (id: number): Promise<Account> => {
    const response = await apiClient.get(`/accounts/${id}`);
    return response.data;
  },

  createTransaction: async (data: CreateTransactionRequest): Promise<CreateTransactionResponse> => {
    const response = await apiClient.post('/accounts/transactions', data);
    return response.data;
  }
};
