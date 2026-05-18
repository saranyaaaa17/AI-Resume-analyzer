import type { DemoDashboardResponse, ResumeAnalysisResponse } from '@/types/resume';

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000';

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  const headers = new Headers(init?.headers as Record<string, string> | undefined);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const merged: RequestInit = { ...(init || {}), headers, credentials: 'include' };

  let response = await fetch(`${API_BASE_URL}${path}`, merged);

  if (response.status === 401) {
    // try to refresh the access token using HttpOnly refresh cookie
    const refresh = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST', credentials: 'include' });
    if (refresh.ok) {
      const body = (await refresh.json().catch(() => null)) as { access_token?: string } | null;
      if (body?.access_token) {
        localStorage.setItem('auth_token', body.access_token);
        headers.set('Authorization', `Bearer ${body.access_token}`);
        const retryMerged: RequestInit = { ...(init || {}), headers, credentials: 'include' };
        response = await fetch(`${API_BASE_URL}${path}`, retryMerged);
      }
    }
  }

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as { detail?: string } | null;
    throw new Error(errorBody?.detail ?? 'Request failed.');
  }

  return (await response.json()) as T;
}

export async function fetchDemoDashboard(): Promise<DemoDashboardResponse> {
  return requestJson<DemoDashboardResponse>('/insights/demo');
}

export async function analyzeResume(file: File): Promise<ResumeAnalysisResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return requestJson<ResumeAnalysisResponse>('/analysis/full', {
    method: 'POST',
    body: formData,
  });
}

export async function enqueueAnalyze(file: File): Promise<{ task_id: string }> {
  const formData = new FormData();
  formData.append('file', file);

  return requestJson<{ task_id: string }>('/tasks/analyze', {
    method: 'POST',
    body: formData,
  });
}

export async function getTaskStatus(taskId: string): Promise<{ task_id: string; status: string; result?: any }> {
  return requestJson(`/tasks/${taskId}`);
}

export async function vectorQuery(text: string, n = 5): Promise<{ results: any[] }> {
  return requestJson<{ results: any[] }>('/vectors/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, n }),
  });
}

export async function reindexVectors(): Promise<{ reindexed: number }> {
  return requestJson<{ reindexed: number }>('/vectors/reindex', { method: 'POST' });
}

export async function fetchSearchHistory(limit = 20): Promise<{ history: any[] }> {
  return requestJson<{ history: any[] }>(`/vectors/history?limit=${limit}`);
}

export async function getAuthToken(email: string): Promise<{ access_token: string }> {
  const res = await requestJson<{ access_token: string }>(`/auth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (res?.access_token) {
    localStorage.setItem('auth_token', res.access_token);
  }
  return res;
}

export async function logout(): Promise<void> {
  try {
    await requestJson('/auth/logout', { method: 'POST' });
  } catch (e) {
    // ignore
  }
  localStorage.removeItem('auth_token');
}

export async function fetchCurrentUser(): Promise<{ id: string; email: string; full_name: string | null; role: string }> {
  return requestJson<{ id: string; email: string; full_name: string | null; role: string }>('/auth/me');
}

export async function listRefreshTokens(limit = 100, offset = 0): Promise<{ tokens: { id: string; user_id: string | null; revoked: boolean; expires_at: string | null }[]; total: number }> {
  return requestJson<{ tokens: { id: string; user_id: string | null; revoked: boolean; expires_at: string | null }[]; total: number }>(`/admin/refresh-tokens?limit=${limit}&offset=${offset}`);
}

export async function revokeRefreshToken(tokenId: string): Promise<{ status: string; id: string }> {
  return requestJson<{ status: string; id: string }>(`/admin/refresh-tokens/${tokenId}/revoke`, { method: 'POST' });
}

export async function submitFeedback(text: string): Promise<{ feedback: string }> {
  return requestJson<{ feedback: string }>('/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
}