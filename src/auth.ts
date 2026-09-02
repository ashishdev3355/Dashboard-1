// src/api/auth.ts
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL 

// -------------------------
// Types
// -------------------------
export interface User {
  id: number;
  email: string;
  role?: string;
  role_id?: string;
  must_change_password?: boolean;
}

export interface AuthResponse {
  message: string;
  user?: User;
  token?: string;
  error?: string;
}

// -------------------------
// Signup
// -------------------------
export async function signup(email: string, password: string): Promise<AuthResponse> {
  const url = `${API_BASE_URL?.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`}api/signup`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const text = await res.text();
  let data: AuthResponse;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: '', error: `Request failed with status ${res.status}` };
  }

  if (res.ok && data.token) {
    localStorage.setItem("token", data.token);
  }
  return data;
}

// -------------------------
// Login
// -------------------------
export async function login(email: string, password: string): Promise<AuthResponse> {
  const url = `${API_BASE_URL?.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`}api/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const text = await res.text();
  let data: AuthResponse;
  try {
    data = JSON.parse(text);
  } catch {
    data = { message: '', error: `Request failed with status ${res.status}` };
  }

  if (res.ok && data.token) {
    localStorage.setItem("token", data.token);
    if (data.user && data.user.role_id) {
       localStorage.setItem("role_id", String(data.user.role_id));
    }
  }
  return data;
}

// -------------------------
// Logout
// -------------------------
export function logout(): void {
  localStorage.removeItem("token");
  localStorage.removeItem("role_id");
}

// -------------------------
// Get Auth Header for APIs
// -------------------------
export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}
