// Dashboard-1/src/Services/productService.ts
import { getAuthHeader } from '../auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/';

export interface ProductData {
  id?: string;
  name: string;
  slug?: string;
  sku?: string;
  short_description?: string;
  full_description?: string;
  category: string;
  vehicle_type: 'bike' | 'car' | 'both';
  price: number;
  mrp?: number;
  discount_percentage?: number;
  badge?: string;
  images: string[];
  features: string[];
  specs?: Record<string, string>;
  includes?: string[];
  compatibility?: string;
  rating?: number;
  reviews?: number;
  stock?: number;
  status: 'draft' | 'published' | 'archived';
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ProductFilterParams {
  search?: string;
  category?: string;
  vehicle_type?: string;
  status?: string;
  stock_status?: string;
}

// Clean helper to construct endpoint URL
function getUrl(path: string): string {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}

export const productService = {
  // Fetch products with optional filtering for Admin List
  getAll: async (params: ProductFilterParams = {}): Promise<ProductData[]> => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.vehicle_type && params.vehicle_type !== 'all') query.append('vehicle_type', params.vehicle_type);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.stock_status && params.stock_status !== 'all') query.append('stock_status', params.stock_status);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(getUrl(`api/admin/products${queryString}`), {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch products' }));
      throw new Error(err.error || 'Failed to fetch products');
    }
    return res.json();
  },

  // Get single product by ID
  getById: async (id: string): Promise<ProductData> => {
    const res = await fetch(getUrl(`api/admin/products/${id}`), {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch product' }));
      throw new Error(err.error || 'Failed to fetch product');
    }
    return res.json();
  },

  // Create new product
  create: async (product: Partial<ProductData>): Promise<{ message: string; product: ProductData }> => {
    const res = await fetch(getUrl('api/admin/products'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(product)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create product' }));
      throw new Error(err.error || 'Failed to create product');
    }
    return res.json();
  },

  // Update product
  update: async (id: string, product: Partial<ProductData>): Promise<{ message: string; product: ProductData }> => {
    const res = await fetch(getUrl(`api/admin/products/${id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(product)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update product' }));
      throw new Error(err.error || 'Failed to update product');
    }
    return res.json();
  },

  // Update status (published / draft / archived)
  updateStatus: async (id: string, status: 'draft' | 'published' | 'archived'): Promise<{ message: string; product: ProductData }> => {
    const res = await fetch(getUrl(`api/admin/products/${id}/status`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ status })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update status' }));
      throw new Error(err.error || 'Failed to update status');
    }
    return res.json();
  },

  // Archive / Delete product
  archive: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(getUrl(`api/admin/products/${id}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to archive product' }));
      throw new Error(err.error || 'Failed to archive product');
    }
    return res.json();
  },

  // Upload product image
  uploadImage: async (file: File): Promise<{ message: string; imageUrl: string; filename: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(getUrl('api/admin/products/upload-image'), {
      method: 'POST',
      headers: {
        ...getAuthHeader()
      },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to upload image' }));
      throw new Error(err.error || 'Failed to upload image');
    }
    return res.json();
  }
};
