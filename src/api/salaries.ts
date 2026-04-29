import { apiClient } from './client';
import { type EmployeeWithSalaryHistory } from './employees';

export interface Salary {
  salary_id: number;
  employee_id: number;
  month: number;
  year: number;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  created_at: string;
}

export interface CreateSalaryRequest {
  employee_id: number;
  month: number;
  year: number;
  total_amount: number;
}

export interface CreateSalaryResponse {
  id: number;
}

export interface Payment {
  id: number;
  salary_id: number;
  amount: number;
  payment_date: string;
  created_by_name: string;
  created_at: string;
}

export interface CreatePaymentRequest {
  salary_id: number;
  amount: number;
  payment_date: string;
  account_id?: number;
}

export interface CreatePaymentResponse {
  id: number;
}

export interface UserSalaryHistory {
  user_id: number;
  user_name: string;
  login: string;
  total_remaining: number;
  salaries: (Salary & {
    payments: Payment[];
  })[];
}

export const salariesApi = {
  createSalary: async (data: CreateSalaryRequest): Promise<CreateSalaryResponse> => {
    const response = await apiClient.post('/salaries', data);
    return response.data;
  },

  createPayment: async (data: CreatePaymentRequest): Promise<CreatePaymentResponse> => {
    const response = await apiClient.post('/salaries/payments', data);
    return response.data;
  },

  getUsersHistory: async (): Promise<UserSalaryHistory[]> => {
    const response = await apiClient.get('/salaries/users-history');
    return response.data;
  },

  getEmployeesHistory: async (): Promise<EmployeeWithSalaryHistory[]> => {
    const response = await apiClient.get('/employees/salary-history');
    return response.data;
  }
};
