// Dashboard-1/src/Services/blogService.ts
import { getAuthHeader } from '../auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/';

export interface BlogData {
  id?: string;
  title: string;
  slug?: string;
  category: string;
  excerpt?: string;
  content?: string;
  featured?: boolean;
  published?: boolean;
  status?: 'published' | 'draft';
  publishedDate?: string;
  readingTime?: string;
  featuredImage?: string;
  tags?: string[];
  author?: {
    name: string;
    role: string;
    avatar?: string;
  };
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface BlogFilterParams {
  search?: string;
  category?: string;
  published?: string;
  featured?: string;
}

// Clean helper to construct endpoint URL
function getUrl(path: string): string {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${base}${cleanPath}`;
}

export const blogService = {
  // Fetch blogs with optional filtering for Admin List
  getAll: async (params: BlogFilterParams = {}): Promise<BlogData[]> => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'all') query.append('category', params.category);
    if (params.published && params.published !== 'all') query.append('published', params.published);
    if (params.featured && params.featured !== 'all') query.append('featured', params.featured);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(getUrl(`api/admin/blogs${queryString}`), {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch blogs' }));
      throw new Error(err.error || 'Failed to fetch blogs');
    }
    return res.json();
  },

  // Get single blog by ID
  getById: async (id: string): Promise<BlogData> => {
    const res = await fetch(getUrl(`api/admin/blogs/${id}`), {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to fetch blog article' }));
      throw new Error(err.error || 'Failed to fetch blog article');
    }
    return res.json();
  },

  // Create new blog
  create: async (blog: Partial<BlogData>): Promise<{ message: string; blog: BlogData }> => {
    const res = await fetch(getUrl('api/admin/blogs'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(blog)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to create blog article' }));
      throw new Error(err.error || 'Failed to create blog article');
    }
    return res.json();
  },

  // Update existing blog
  update: async (id: string, blog: Partial<BlogData>): Promise<{ message: string; blog: BlogData }> => {
    const res = await fetch(getUrl(`api/admin/blogs/${id}`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify(blog)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update blog article' }));
      throw new Error(err.error || 'Failed to update blog article');
    }
    return res.json();
  },

  // Update publish status (published: true / false)
  updatePublishStatus: async (id: string, published: boolean): Promise<{ message: string; blog: BlogData }> => {
    const res = await fetch(getUrl(`api/admin/blogs/${id}/publish`), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ published })
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to update publish status' }));
      throw new Error(err.error || 'Failed to update publish status');
    }
    return res.json();
  },

  // Delete blog
  delete: async (id: string): Promise<{ message: string }> => {
    const res = await fetch(getUrl(`api/admin/blogs/${id}`), {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Failed to delete blog article' }));
      throw new Error(err.error || 'Failed to delete blog article');
    }
    return res.json();
  },

  // Upload blog image
  uploadImage: async (file: File): Promise<{ message: string; imageUrl: string; filename: string }> => {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(getUrl('api/admin/blogs/upload-image'), {
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
