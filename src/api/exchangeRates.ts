import { apiClient } from './client';

export interface ExchangeRate {
  id: number;
  currency: string;
  rate_to_tjs: number;
  created_at: string;
  updated_at: string;
  status: number;
}

export interface UpdateExchangeRateRequest {
  currency: string;
  rate_to_tjs: number;
}

export interface UpdateExchangeRateResponse {
  id: number;
  message: string;
}

export interface ExchangeRateFilters {
  currency?: string;
}

export const exchangeRatesApi = {
  // GET /exchange-rates - Получение списка всех курсов с фильтрацией
  getAll: async (filters?: ExchangeRateFilters): Promise<ExchangeRate[]> => {
    const params = new URLSearchParams();
    if (filters?.currency) params.append('currency', filters.currency);
    
    const queryString = params.toString();
    const url = queryString ? `/exchange-rates?${queryString}` : '/exchange-rates';
    
    const response = await apiClient.get<ExchangeRate[]>(url);
    return response.data;
  },

  // GET /exchange-rates/:id - Получение курса по ID
  getById: async (id: number): Promise<ExchangeRate> => {
    const response = await apiClient.get<ExchangeRate>(`/exchange-rates/${id}`);
    return response.data;
  },

  // PUT /exchange-rates/:currency - Обновление курса валюты
  // Некоторые бэкенды принимают PUT /exchange-rates с currency в body — делаем fallback на 404
  update: async (currency: string, rate_to_tjs: number): Promise<UpdateExchangeRateResponse> => {
    try {
      const response = await apiClient.put<UpdateExchangeRateResponse>(`/exchange-rates/${currency}`, { rate_to_tjs });
      return response.data;
    } catch (error: unknown) {
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        const response = await apiClient.put<UpdateExchangeRateResponse>(`/exchange-rates`, { currency, rate_to_tjs });
        return response.data;
      }
      throw error;
    }
  },
};
