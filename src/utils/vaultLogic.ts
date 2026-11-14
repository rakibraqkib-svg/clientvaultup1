import type { ExpiryPreset, FileCategory, Project, ShareLink, VaultFile } from '../types/vault';

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[exponent]}`;
}

export function classifyMimeType(mimeType: string, fileName: string): FileCategory {
  const lowerMime = (mimeType || '').toLowerCase();
  const lowerName = (fileName || '').toLowerCase();

  if (lowerMime.startsWith('image/') || /\.(png|jpe?g|webp|gif|svg|avif)$/.test(lowerName)) {
    return 'image';
  }
  if (
    lowerName.endsWith('.fig') ||
    lowerName.endsWith('.sketch') ||
    lowerName.endsWith('.xd') ||
    lowerName.endsWith('.psd') ||
    lowerName.endsWith('.ai') ||
    lowerName.endsWith('.blend')
  ) {
    return 'design';
  }
  if (
    lowerMime.startsWith('video/') ||
    lowerMime.startsWith('audio/') ||
    /\.(mp4|mov|webm|mp3|wav|m4a)$/.test(lowerName)
  ) {
    return 'media';
  }
  if (
    lowerMime === 'application/zip' ||
    lowerMime === 'application/x-zip-compressed' ||
    /\.(zip|tar|gz|rar|7z)$/.test(lowerName)
  ) {
    return 'archive';
  }
  if (
    lowerMime === 'application/pdf' ||
    lowerMime.startsWith('text/') ||
    lowerMime.includes('json') ||
    lowerMime.includes('document') ||
    /\.(pdf|docx?|xlsx?|pptx?|txt|md|csv|json|ts|tsx)$/.test(lowerName)
  ) {
    return 'document';
  }
  return 'other';
}

export interface StorageBreakdown {
  usedBytes: number;
  quotaBytes: number;
  percentUsed: number;
  activeCount: number;
  trashedCount: number;
  byCategory: Record<FileCategory, number>;
}

export function calculateStorageStats(
  files: VaultFile[],
  quotaBytes: number
): StorageBreakdown {
  const safeQuota = Math.max(quotaBytes, 1);
  const byCategory: Record<FileCategory, number> = {
    image: 0,
    document: 0,
    design: 0,
    media: 0,
    archive: 0,
    other: 0,
  };

  let usedBytes = 0;
  let activeCount = 0;
  let trashedCount = 0;

  for (const file of files) {
    const safeSize = Math.max(0, file.size || 0);
    usedBytes += safeSize;
    byCategory[file.category] = (byCategory[file.category] || 0) + safeSize;
    if (file.isTrashed) {
      trashedCount += 1;
    } else {
      activeCount += 1;
    }
  }

  const percentUsed = Math.min(100, Math.round((usedBytes / safeQuota) * 1000) / 10);

  return {
    usedBytes,
    quotaBytes: safeQuota,
    percentUsed,
    activeCount,
    trashedCount,
    byCategory,
  };
}

export function isShareExpired(expiresAt: string | null, nowMs = Date.now()): boolean {
  if (!expiresAt) return false;
  const parsed = Date.parse(expiresAt);
  if (Number.isNaN(parsed)) return false;
  return parsed <= nowMs;
}

export function getExpiryDateFromPreset(
  preset: ExpiryPreset,
  customDateIso?: string,
  nowMs = Date.now()
): string | null {
  if (preset === 'never') return null;
  if (preset === '24h') return new Date(nowMs + 24 * 60 * 60 * 1000).toISOString();
  if (preset === '7d') return new Date(nowMs + 7 * 24 * 60 * 60 * 1000).toISOString();
  if (preset === '30d') return new Date(nowMs + 30 * 24 * 60 * 60 * 1000).toISOString();
  if (preset === 'custom' && customDateIso) {
    const parsed = Date.parse(customDateIso);
    if (!Number.isNaN(parsed)) {
      return new Date(parsed).toISOString();
    }
  }
  return new Date(nowMs + 7 * 24 * 60 * 60 * 1000).toISOString();
}

export function validateShareAvailability(
  share: Pick<ShareLink, 'isRevoked' | 'expiresAt'>,
  nowMs = Date.now()
): { valid: boolean; reason?: 'revoked' | 'expired' } {
  if (share.isRevoked) {
    return { valid: false, reason: 'revoked' };
  }
  if (isShareExpired(share.expiresAt, nowMs)) {
    return { valid: false, reason: 'expired' };
  }
  return { valid: true };
}

export interface FileFilterOptions {
  query?: string;
  category?: FileCategory | 'all';
  projectId?: string | null;
  view: 'all' | 'favorites' | 'trash';
}

export function filterVaultFiles(files: VaultFile[], options: FileFilterOptions): VaultFile[] {
  const normalizedQuery = (options.query || '').trim().toLowerCase();
  const category = options.category || 'all';

  return files.filter((file) => {
    if (options.view === 'trash') {
      if (!file.isTrashed) return false;
    } else {
      if (file.isTrashed) return false;
      if (options.view === 'favorites' && !file.isFavorite) return false;
    }

    if (options.projectId && file.projectId !== options.projectId) {
      return false;
    }

    if (category !== 'all' && file.category !== category) {
      return false;
    }

    if (normalizedQuery) {
      const matchesName = file.name.toLowerCase().includes(normalizedQuery);
      const matchesDesc = (file.description || '').toLowerCase().includes(normalizedQuery);
      if (!matchesName && !matchesDesc) return false;
    }

    return true;
  });
}

export function countProjectFiles(files: VaultFile[], projects: Project[]): Record<string, { count: number; bytes: number }> {
  const counts: Record<string, { count: number; bytes: number }> = {};
  for (const project of projects) {
    counts[project.id] = { count: 0, bytes: 0 };
  }
  for (const file of files) {
    if (!file.isTrashed && file.projectId && counts[file.projectId]) {
      counts[file.projectId].count += 1;
      counts[file.projectId].bytes += Math.max(0, file.size || 0);
    }
  }
  return counts;
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateProjectInput(input: {
  name: string;
  clientName: string;
  clientEmail?: string;
}): string | null {
  if (input.name.trim().length < 2) {
    return 'Project name must be at least 2 characters.';
  }
  if (input.clientName.trim().length < 2) {
    return 'Client name must be at least 2 characters.';
  }
  if (input.clientEmail && input.clientEmail.trim().length > 0 && !validateEmail(input.clientEmail)) {
    return 'Please enter a valid client email address.';
  }
  return null;
}
