const API_BASE_URL = '/api';

interface ApiResponse<T> {
  status: string;
  data: T;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  const result: ApiResponse<T> = await response.json();
  return result.data;
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
};
