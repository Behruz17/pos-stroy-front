import { apiClient } from './client';

// General Report Types
export interface GeneralReportSummary {
  totalSales: number;
  paidSales: number;
  debtSales: number;
  totalExpenses: number;
  totalStockReceipts: number;
  totalReturns: number;
  totalDebtorBorrowed: number;
  totalDebtorReturned: number;
  totalSalaryPayments: number;
  profit: number;
  salesCount: number;
  customersCount: number;
  suppliersCount: number;
  productsCount: number;
}

export interface GeneralReportPeriod {
  start_date: string | null;
  end_date: string | null;
}

export interface GeneralReportResponse {
  summary: GeneralReportSummary;
  period: GeneralReportPeriod;
}

// Sales Report Types
export interface ReportSaleItem {
  id: number;
  quantity: number;
  unit_price: string;
  total_price: string;
  stock_item_id: number | null;
  product_name: string;
  product_code: string;
  product_type: 'simple' | 'batch';
  product_purchase_cost: string;
  purchase_cost: string;
  currency: 'TJS' | 'USD' | 'RUB';
  exchange_rate: number;
  purchase_cost_original: number;
  purchase_cost_tjs: number;
  unit_profit: number;
  total_profit_before_discount: number;
  total_profit: number;
}

export interface ReportSale {
  id: number;
  total_amount: string;
  discount: string;
  payment_status: 'PAID' | 'DEBT' | 'PARTIAL';
  created_at: string;
  customer_name: string;
  customer_phone: string | null;
  created_by_name: string;
  total_profit: number;
  items: ReportSaleItem[];
}

export interface SalesReportSummary {
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  totalProfit: number;
}

export interface SalesReportFilters {
  start_date?: string;
  end_date?: string;
  customer_id?: number;
  payment_status?: 'PAID' | 'DEBT';
}

export interface SalesReportResponse {
  sales: ReportSale[];
  summary: SalesReportSummary;
  filters: SalesReportFilters & { start_date: string | null; end_date: string | null };
}

// Arrivals Report Types
export interface ReportArrivalItem {
  quantity: string;
  purchase_cost: string;
  selling_price: string;
  purchase_cost_converted: string | null;
  product_name: string;
  product_code: string;
}

export interface ReportArrival {
  id: number;
  total_amount: string;
  currency: string;
  rate: string;
  total_amount_converted: string | null;
  created_at: string;
  supplier_name: string;
  supplier_phone: string | null;
  created_by_name: string;
  items: ReportArrivalItem[];
}

export interface ArrivalsReportSummary {
  totalAmount: number;
  tjsAmount: number;
  usdAmount: number;
  rubAmount: number;
}

export interface ArrivalsReportFilters {
  start_date?: string;
  end_date?: string;
  supplier_id?: number;
}

export interface ArrivalsReportResponse {
  receipts: ReportArrival[];
  summary: ArrivalsReportSummary;
  filters: ArrivalsReportFilters & { start_date: string | null; end_date: string | null };
}

// Expenses Report Types
export interface ReportExpense {
  id: number;
  description: string;
  amount: string;
  expense_date: string;
  created_at: string;
  created_by_name: string;
}

export interface ExpensesReportSummary {
  totalAmount: number;
  count: number;
  monthlyTotals: Record<string, number>;
}

export interface ExpensesReportFilters {
  start_date?: string;
  end_date?: string;
  created_by?: number;
}

export interface ExpensesReportResponse {
  expenses: ReportExpense[];
  summary: ExpensesReportSummary;
  filters: ExpensesReportFilters & { start_date: string | null; end_date: string | null };
}

// Daily Summary Report Types
export interface DailySummary {
  date: string;
  income: number;
  expense: number;
  balance: number;
  balance_usd: number;
  usd_rate: number;
}

export interface DailyBalance extends DailySummary {
  from_cache?: boolean;
}

export interface SaveDailyBalanceRequest {
  date: string;
  usd_rate?: number;
  update_accounts?: boolean;
}

export interface SaveDailyBalanceResponse {
  success: boolean;
  message: string;
  data: DailyBalance & { accounts_updated?: boolean };
}

// Multi-currency Account Types
export interface AccountWithCurrency {
  id: number;
  name: string;
  type: 'CASH' | 'ELECTRONIC';
  currency: 'TJS' | 'USD' | 'RUB';
  balance: number;
  balance_usd: number;
  usd_rate: number;
  status: number;
  created_at: string;
  updated_at: string;
}

export interface UpdateAccountsBalancesRequest {
  date: string;
  usd_rate: number;
}

export interface UpdateAccountsBalancesResponse {
  success: boolean;
  message: string;
  accounts_updated: number;
  usd_rate: number;
  date: string;
}

// Currency Conversion Types
export interface ConvertCurrencyRequest {
  target_currency: 'TJS' | 'USD';
  usd_rate: number;
  amount?: number;
}

export interface ConvertCurrencyResponse {
  success: boolean;
  account_id: number;
  from_currency: string;
  to_currency: string;
  converted_amount: number;
  new_balance: number;
  new_balance_usd: number;
  usd_rate: number;
  message: string;
}

// Total Balance Types
export interface TotalBalanceAccount {
  id: number;
  name: string;
  type: 'CASH' | 'ELECTRONIC';
  currency: 'TJS' | 'USD' | 'RUB';
  balance: number;
  balance_usd: number;
  usd_rate: number;
}

export interface TotalBalanceResponse {
  total_tjs: number;
  total_usd: number;
  by_currency: {
    TJS?: number;
    USD?: number;
    RUB?: number;
  };
  accounts_breakdown: TotalBalanceAccount[];
  usd_rate: number;
  accounts_count: number;
}

// API Functions
export const reportsApi = {
  // GET /reports/general - General summary report
  getGeneral: async (params?: { start_date?: string; end_date?: string }): Promise<GeneralReportResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    const url = queryParams.toString() ? `/reports/general?${queryParams.toString()}` : '/reports/general';
    const response = await apiClient.get<GeneralReportResponse>(url);
    return response.data;
  },

  // GET /reports/sales - Sales report
  getSales: async (params?: SalesReportFilters): Promise<SalesReportResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    if (params?.customer_id) {
      queryParams.append('customer_id', params.customer_id.toString());
    }
    if (params?.payment_status) {
      queryParams.append('payment_status', params.payment_status);
    }
    const url = queryParams.toString() ? `/reports/sales?${queryParams.toString()}` : '/reports/sales';
    const response = await apiClient.get<SalesReportResponse>(url);
    return response.data;
  },

  // GET /reports/arrivals - Arrivals (stock receipts) report
  getArrivals: async (params?: ArrivalsReportFilters): Promise<ArrivalsReportResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    if (params?.supplier_id) {
      queryParams.append('supplier_id', params.supplier_id.toString());
    }
    const url = queryParams.toString() ? `/reports/arrivals?${queryParams.toString()}` : '/reports/arrivals';
    const response = await apiClient.get<ArrivalsReportResponse>(url);
    return response.data;
  },

  // GET /reports/expenses - Expenses report
  getExpenses: async (params?: ExpensesReportFilters): Promise<ExpensesReportResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.start_date) {
      queryParams.append('start_date', params.start_date);
    }
    if (params?.end_date) {
      queryParams.append('end_date', params.end_date);
    }
    if (params?.created_by) {
      queryParams.append('created_by', params.created_by.toString());
    }
    const url = queryParams.toString() ? `/reports/expenses?${queryParams.toString()}` : '/reports/expenses';
    const response = await apiClient.get<ExpensesReportResponse>(url);
    return response.data;
  },

  // GET /reports/daily-summary - Get daily summary (calculated from transactions)
  getDailySummary: async (date: string, usd_rate?: number): Promise<DailySummary> => {
    const queryParams = new URLSearchParams();
    queryParams.append('date', date);
    if (usd_rate !== undefined) {
      queryParams.append('usd_rate', usd_rate.toString());
    }
    const url = `/reports/daily-summary?${queryParams.toString()}`;
    const response = await apiClient.get<DailySummary>(url);
    return response.data;
  },

  // POST /reports/daily-balance - Save daily balance to cache
  saveDailyBalance: async (data: SaveDailyBalanceRequest): Promise<SaveDailyBalanceResponse> => {
    const response = await apiClient.post<SaveDailyBalanceResponse>('/reports/daily-balance', data);
    return response.data;
  },

  // GET /reports/daily-balance - Get daily balance (from cache or calculate)
  getDailyBalance: async (date: string, usd_rate?: number, force_recalculate?: boolean): Promise<DailyBalance> => {
    const queryParams = new URLSearchParams();
    queryParams.append('date', date);
    if (usd_rate !== undefined) {
      queryParams.append('usd_rate', usd_rate.toString());
    }
    if (force_recalculate !== undefined) {
      queryParams.append('force_recalculate', force_recalculate.toString());
    }
    const url = `/reports/daily-balance?${queryParams.toString()}`;
    const response = await apiClient.get<DailyBalance>(url);
    return response.data;
  },

  // POST /reports/accounts/update-balances - Update account balances with currency conversion
  updateAccountsBalances: async (data: UpdateAccountsBalancesRequest): Promise<UpdateAccountsBalancesResponse> => {
    const response = await apiClient.post<UpdateAccountsBalancesResponse>('/reports/accounts/update-balances', data);
    return response.data;
  },

  // GET /reports/accounts - Get all accounts with currency info
  getAccountsWithCurrency: async (): Promise<AccountWithCurrency[]> => {
    const response = await apiClient.get<AccountWithCurrency[]>('/reports/accounts');
    return response.data;
  },

  // GET /reports/accounts/:id - Get specific account with currency info
  getAccountWithCurrencyById: async (id: number): Promise<AccountWithCurrency> => {
    const response = await apiClient.get<AccountWithCurrency>(`/reports/accounts/${id}`);
    return response.data;
  },

  // PUT /reports/accounts/:id/convert-currency - Convert account currency
  convertCurrency: async (accountId: number, data: ConvertCurrencyRequest): Promise<ConvertCurrencyResponse> => {
    const response = await apiClient.put<ConvertCurrencyResponse>(`/reports/accounts/${accountId}/convert-currency`, data);
    return response.data;
  },

  // GET /reports/total-balance - Get total balance across all accounts
  getTotalBalance: async (usd_rate?: number): Promise<TotalBalanceResponse> => {
    const queryParams = new URLSearchParams();
    if (usd_rate !== undefined) {
      queryParams.append('usd_rate', usd_rate.toString());
    }
    const url = queryParams.toString() ? `/reports/total-balance?${queryParams.toString()}` : '/reports/total-balance';
    const response = await apiClient.get<TotalBalanceResponse>(url);
    return response.data;
  },
};
