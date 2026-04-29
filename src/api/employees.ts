import { apiClient } from './client';

export interface Employee {
  id: number;
  full_name: string;
  status: number;
}

export interface CreateEmployeeRequest {
  full_name: string;
}

export interface UpdateEmployeeRequest {
  full_name: string;
}

export interface EmployeeWithSalaryHistory {
  id: number;
  full_name: string;
  status: number;
  salaries: Array<{
    salary_id: number;
    month: number;
    year: number;
    total_amount: number;
    paid_amount: number;
    remaining_amount: number;
    payments: Array<{
      id: number;
      amount: number;
      payment_date: string;
      created_by_name: string;
    }>;
  }>;
  total_remaining: number;
}

export interface DeleteEmployeeResponse {
  message: string;
}

export const employeesApi = {
  // GET /employees - Get all employees
  getAll: async (): Promise<Employee[]> => {
    const response = await apiClient.get<Employee[]>('/employees');
    return response.data;
  },

  // GET /employees/:id - Get employee by ID
  getById: async (id: number): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  // POST /employees - Create new employee
  create: async (data: CreateEmployeeRequest): Promise<Employee> => {
    const response = await apiClient.post<Employee>('/employees', data);
    return response.data;
  },

  // PUT /employees/:id - Update employee
  update: async (id: number, data: UpdateEmployeeRequest): Promise<Employee> => {
    const response = await apiClient.put<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  // DELETE /employees/:id - Delete employee
  delete: async (id: number): Promise<DeleteEmployeeResponse> => {
    const response = await apiClient.delete<DeleteEmployeeResponse>(`/employees/${id}`);
    return response.data;
  },

  // GET /employees/salary-history - Get employees with salary history
  getAllWithSalaryHistory: async (): Promise<EmployeeWithSalaryHistory[]> => {
    const response = await apiClient.get<EmployeeWithSalaryHistory[]>('/employees/salary-history');
    return response.data;
  },
};
