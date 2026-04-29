import { apiClient } from './client';

export interface Conversion {
  id: number;
  from_product_id: number;
  from_product_name: string;
  from_product_code: string;
  to_product_id: number;
  to_product_name: string;
  to_product_code: string;
  from_quantity: number;
  to_quantity: number;
  purchase_cost: number;
  selling_price: number;
  created_by: number;
  created_by_name: string;
  created_at: string;
}

export interface CreateConversionRequest {
  from_product_id: number;
  from_stock_item_id?: number;
  to_product_id: number;
  from_quantity: number;
  to_quantity: number;
  selling_price?: number;
}

export interface CreateConversionResponse {
  id: number;
  message: string;
}

export interface DeleteConversionResponse {
  message: string;
}

export const conversionsApi = {
  // GET /conversions - Get list of conversions with date filtering
  getAll: async (params?: { date?: string; month?: number; year?: number }): Promise<Conversion[]> => {
    const queryParams = new URLSearchParams();
    
    if (params?.date) {
      queryParams.append('date', params.date);
    }
    if (params?.month !== undefined) {
      queryParams.append('month', params.month.toString());
    }
    if (params?.year !== undefined) {
      queryParams.append('year', params.year.toString());
    }
    
    const url = queryParams.toString() ? `/conversions?${queryParams.toString()}` : '/conversions';
    const response = await apiClient.get<Conversion[]>(url);
    return response.data;
  },

  // GET /conversions/:id - Get conversion by ID
  getById: async (id: number): Promise<Conversion> => {
    const response = await apiClient.get<Conversion>(`/conversions/${id}`);
    return response.data;
  },

  // POST /conversions - Create new conversion
  create: async (data: CreateConversionRequest): Promise<CreateConversionResponse> => {
    const response = await apiClient.post<CreateConversionResponse>('/conversions', data);
    return response.data;
  },

  // DELETE /conversions/:id - Delete conversion
  delete: async (id: number): Promise<DeleteConversionResponse> => {
    const response = await apiClient.delete<DeleteConversionResponse>(`/conversions/${id}`);
    return response.data;
  },
};
