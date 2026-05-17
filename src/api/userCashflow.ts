import { apiClient } from './client';

export interface CashflowOperation {
  type:
    | 'sale'
    | 'customer_payment'
    | 'debtor_returned'
    | 'return'
    | 'expense'
    | 'supplier_payment'
    | 'debtor_borrowed'
    | 'salary_payment';
  id: number;
  amount: number | string; // Backend may return string
  counterpart_id: number | null;
  counterpart_name: string | null;
  description: string;
  created_at: string;
  flow_type: 'income' | 'expense';
}

export interface CashflowSummary {
  total_income: number | string; // Backend may return string
  total_expenses: number | string; // Backend may return string
  net_cashflow: number | string; // Backend may return string
  operations_count: number;
}

export interface UserCashflowSummary {
  id: number;
  name: string;
  total_income: number | string; // Backend may return string
  total_expenses: number | string; // Backend may return string
  net_cashflow: number | string; // Backend may return string
}

export interface CashflowFilters {
  start_date: string | null;
  end_date: string | null;
  created_by: number | null;
}

export interface UserCashflowResponse {
  operations: CashflowOperation[];
  summary: CashflowSummary;
  users_summary: UserCashflowSummary[] | null;
  filters: CashflowFilters;
}

export interface UserCashflowFilters {
  start_date?: string;
  end_date?: string;
  created_by?: number;
}

export const userCashflowApi = {
  getUserCashflow: async (filters?: UserCashflowFilters): Promise<UserCashflowResponse> => {
    const params = new URLSearchParams();
    
    if (filters?.start_date) {
      params.append('start_date', filters.start_date);
    }
    if (filters?.end_date) {
      params.append('end_date', filters.end_date);
    }
    if (filters?.created_by) {
      params.append('created_by', filters.created_by.toString());
    }
    
    const queryString = params.toString();
    const url = queryString ? `/user-cashflow?${queryString}` : '/user-cashflow';
    const response = await apiClient.get<UserCashflowResponse>(url);
    return response.data;
  }
};
