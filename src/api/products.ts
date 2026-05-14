import { apiClient } from './client';

export type ProductType = 'simple' | 'batch';

export interface Product {
  id: number;
  name: string;
  manufacturer: string | null;
  product_code: string | null;
  type: ProductType;
  image: string;
  notification_threshold: number;
  stock_quantity: number;
  purchase_cost: number | null;
  selling_price: number | null;
  purchase_cost_converted: number | null;
  currency: string; // TJS, USD, RUB
  receipt_currency: string; // Currency of last receipt
  rate: number; // Exchange rate
  status: number;
  created_at: string;
}

export interface CreateProductRequest {
  name: string;
  manufacturer?: string;
  product_code?: string;
  type?: ProductType;
  currency?: string; // TJS, USD, RUB - defaults to TJS
  image?: File;
  notification_threshold?: number;
}

export interface UpdateProductRequest {
  name?: string;
  manufacturer?: string;
  product_code?: string;
  type?: ProductType;
  currency?: string; // Can change currency
  image?: File;
  notification_threshold?: number;
}

export interface DeleteProductResponse {
  message: string;
}

const extractImageFile = (data: any): File | null => {
  if (!data?.image) return null;
  if (data.image instanceof File) return data.image;

  // antd Upload value (common patterns)
  const fileList = data.image.fileList;
  if (Array.isArray(fileList) && fileList.length > 0) {
    const origin = fileList[0]?.originFileObj;
    if (origin instanceof File) return origin;
  }

  const maybeFile = data.image.originFileObj;
  if (maybeFile instanceof File) return maybeFile;

  return null;
};

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
    if (data.type) formData.append('type', data.type);
    if (data.currency) formData.append('currency', data.currency);
    
    const imageFile = extractImageFile(data);
    if (imageFile) formData.append('image', imageFile);
    
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
    if (data.type) formData.append('type', data.type);
    if (data.currency) formData.append('currency', data.currency);

    const imageFile = extractImageFile(data);
    if (imageFile) formData.append('image', imageFile);

    if (data.notification_threshold !== undefined) formData.append('notification_threshold', data.notification_threshold.toString());

    console.log('API update - FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }

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
