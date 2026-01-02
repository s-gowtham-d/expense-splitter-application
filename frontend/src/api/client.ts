import { AuthResponse, LoginRequest, RegisterRequest, User } from '@/types';

const API_BASE_URL = '/api';
const TOKEN_KEY = 'auth_token';

// Token management
export const tokenManager = {
  getToken: (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
  },
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
};

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const token = tokenManager.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || error.error || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const result = await response.json();
  return result.data || result;
}

export const api = {
  // Groups
  groups: {
    getAll: () => fetchApi<{ groups: any[] }>('/groups'),
    getById: (id: string) => fetchApi<any>(`/groups/${id}`),
    create: (data: { name: string; description?: string }) =>
      fetchApi<{ group: any }>('/groups', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: { name?: string; description?: string }) =>
      fetchApi<{ group: any }>(`/groups/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<void>(`/groups/${id}`, {
        method: 'DELETE',
      }),
    getBalances: (id: string) => fetchApi<{ balances: any[] }>(`/groups/${id}/balances`),
    getSettlements: (id: string) => fetchApi<{ settlements: any[] }>(`/groups/${id}/settlements`),
  },

  // Members
  members: {
    addToGroup: (groupId: string, data: { name: string; email?: string }) =>
      fetchApi<{ member: any; group: any }>(`/groups/${groupId}/members`, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    removeFromGroup: (groupId: string, memberId: string) =>
      fetchApi<{ group: any }>(`/groups/${groupId}/members/${memberId}`, {
        method: 'DELETE',
      }),
  },

  // Expenses
  expenses: {
    getAll: (groupId?: string) => {
      const query = groupId ? `?groupId=${groupId}` : '';
      return fetchApi<{ expenses: any[] }>(`/expenses${query}`);
    },
    getById: (id: string) => fetchApi<{ expense: any }>(`/expenses/${id}`),
    create: (data: any) =>
      fetchApi<{ expense: any }>('/expenses', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchApi<{ expense: any }>(`/expenses/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchApi<void>(`/expenses/${id}`, {
        method: 'DELETE',
      }),
  },

  // Authentication
  auth: {
    register: (data: RegisterRequest) =>
      fetchApi<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    login: (data: LoginRequest) =>
      fetchApi<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    getMe: () =>
      fetchApi<{ user: User }>('/auth/me'),
    logout: () => {
      tokenManager.removeToken();
    },
  },
};
