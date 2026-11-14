import type {
  Project,
  PublicPortalPayload,
  ShareLink,
  UserProfile,
  VaultFile,
  VaultStatePayload,
  WorkspaceSettings,
} from '../types/vault';

const TOKEN_STORAGE_KEY = 'clientvault_session_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(path, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data as T;
}

export async function loginWithDemo(): Promise<{ token: string; user: UserProfile }> {
  const result = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/demo', {
    method: 'POST',
  });
  setStoredToken(result.token);
  return result;
}

export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ token: string; user: UserProfile }> {
  const result = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setStoredToken(result.token);
  return result;
}

export async function registerAccount(payload: {
  name: string;
  email: string;
  password: string;
  workspaceName?: string;
}): Promise<{ token: string; user: UserProfile }> {
  const result = await apiRequest<{ token: string; user: UserProfile }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredToken(result.token);
  return result;
}

export async function fetchVaultState(): Promise<VaultStatePayload> {
  return apiRequest<VaultStatePayload>('/api/vault');
}

export async function updateWorkspaceSettings(payload: {
  name?: string;
  role?: string;
  settings?: Partial<WorkspaceSettings>;
}): Promise<{ user: UserProfile }> {
  return apiRequest<{ user: UserProfile }>('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function createProject(payload: {
  name: string;
  clientName: string;
  clientEmail?: string;
  description?: string;
  accentColor?: Project['accentColor'];
  status?: Project['status'];
}): Promise<{ project: Project }> {
  return apiRequest<{ project: Project }>('/api/projects', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateProject(
  id: string,
  payload: Partial<Project>
): Promise<{ project: Project }> {
  return apiRequest<{ project: Project }>(`/api/projects/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteProject(id: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/projects/${id}`, {
    method: 'DELETE',
  });
}

export async function uploadVaultFile(payload: {
  name: string;
  mimeType: string;
  size: number;
  projectId: string | null;
  description?: string;
  contentBase64?: string;
  textPreview?: string;
}): Promise<{ file: VaultFile }> {
  return apiRequest<{ file: VaultFile }>('/api/files', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateVaultFile(
  id: string,
  payload: Partial<Pick<VaultFile, 'isFavorite' | 'isTrashed' | 'name' | 'projectId' | 'description'>>
): Promise<{ file: VaultFile }> {
  return apiRequest<{ file: VaultFile }>(`/api/files/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function permanentlyDeleteFile(id: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/files/${id}`, {
    method: 'DELETE',
  });
}

export function getAuthorizedFileUrl(fileId: string, download = false): string {
  const token = getStoredToken() || '';
  const params = new URLSearchParams();
  if (token) params.set('token', token);
  if (download) params.set('download', '1');
  return `/api/files/${fileId}/content?${params.toString()}`;
}

export async function createShareLink(payload: {
  title: string;
  targetType: 'file' | 'project';
  targetId: string;
  clientEmail?: string;
  password?: string;
  expiresAt: string | null;
  allowDownload: boolean;
}): Promise<{ share: ShareLink }> {
  return apiRequest<{ share: ShareLink }>('/api/shares', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateShareLink(
  id: string,
  payload: {
    title?: string;
    isRevoked?: boolean;
    allowDownload?: boolean;
    expiresAt?: string | null;
    password?: string;
  }
): Promise<{ share: ShareLink }> {
  return apiRequest<{ share: ShareLink }>(`/api/shares/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteShareLink(id: string): Promise<{ ok: boolean }> {
  return apiRequest<{ ok: boolean }>(`/api/shares/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchPublicPortal(token: string): Promise<PublicPortalPayload> {
  return apiRequest<PublicPortalPayload>(`/api/portal/${encodeURIComponent(token)}`);
}

export async function unlockPublicPortal(
  token: string,
  password: string
): Promise<PublicPortalPayload> {
  return apiRequest<PublicPortalPayload>(`/api/portal/${encodeURIComponent(token)}/unlock`, {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export async function submitContactForm(payload: {
  name: string;
  email: string;
  company?: string;
  message: string;
}): Promise<{ ok: boolean; id: string }> {
  return apiRequest<{ ok: boolean; id: string }>('/api/contact', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
