import { apiClient } from './client';

export interface Product {
  id: number;
  name: string;
  manufacturer: string;
  product_code: string;
  image?: string;
  notification_threshold: number;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductRequest {
  name: string;
  manufacturer?: string;
  product_code?: string;
  image?: File;
  notification_threshold?: number;
}

export interface UpdateProductRequest {
  name?: string;
  manufacturer?: string;
  product_code?: string;
  image?: File;
  notification_threshold?: number;
}

export interface DeleteProductResponse {
  message: string;
}

export const productsApi = {
  // GET /products - Получение списка всех товаров
  getAll: async (): Promise<Product[]> => {
    const response = await apiClient.get<Product[]>('/products');
    return response.data;
  },

  // GET /products/:id - Получение одного товара по ID
  getById: async (id: number): Promise<Product> => {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  // POST /products - Creating a new product with image upload
  create: async (data: any): Promise<Product> => {
    const formData = new FormData();
    formData.append('name', data.name);
    if (data.manufacturer) formData.append('manufacturer', data.manufacturer);
    if (data.product_code) formData.append('product_code', data.product_code);
    
    // Handle image file from form
    if (data.image && data.image.fileList && data.image.fileList.length > 0) {
      formData.append('image', data.image.fileList[0].originFileObj);
    }
    
    if (data.notification_threshold !== undefined) formData.append('notification_threshold', data.notification_threshold.toString());
    
    const response = await apiClient.post<Product>('/products', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // PUT /products/:id - Updating product with possible new image upload
  update: async (id: number, data: any): Promise<Product> => {
    const formData = new FormData();
    if (data.name) formData.append('name', data.name);
    if (data.manufacturer) formData.append('manufacturer', data.manufacturer);
    if (data.product_code) formData.append('product_code', data.product_code);
    
    // Handle image file from form
    if (data.image && data.image.fileList && data.image.fileList.length > 0) {
      formData.append('image', data.image.fileList[0].originFileObj);
    }
    
    if (data.notification_threshold !== undefined) formData.append('notification_threshold', data.notification_threshold.toString());
    
    const response = await apiClient.put<Product>(`/products/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // DELETE /products/:id - Удаление товара
  delete: async (id: number): Promise<DeleteProductResponse> => {
    const response = await apiClient.delete<DeleteProductResponse>(`/products/${id}`);
    return response.data;
  },
};
