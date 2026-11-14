export type FileCategory = 'image' | 'document' | 'design' | 'media' | 'archive' | 'other';

export type ProjectStatus = 'active' | 'review' | 'delivered' | 'archived';

export type ExpiryPreset = '24h' | '7d' | '30d' | 'custom' | 'never';

export type DashboardTab =
  | 'overview'
  | 'projects'
  | 'project-detail'
  | 'files'
  | 'shared'
  | 'portal'
  | 'favorites'
  | 'trash'
  | 'settings'
  | 'help';

export interface WorkspaceSettings {
  workspaceName: string;
  brandAccent: 'cyan' | 'turquoise' | 'purple';
  defaultShareExpiry: ExpiryPreset;
  requirePasswordByDefault: boolean;
  emailNotifications: boolean;
  twoFactorEnabled: boolean;
  storageQuotaBytes: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarInitials: string;
  isDemo?: boolean;
  settings: WorkspaceSettings;
}

export interface Project {
  id: string;
  ownerId: string;
  name: string;
  clientName: string;
  clientEmail: string;
  description: string;
  status: ProjectStatus;
  accentColor: 'cyan' | 'turquoise' | 'purple' | 'blue';
  createdAt: string;
  updatedAt: string;
}

export interface VaultFile {
  id: string;
  ownerId: string;
  projectId: string | null;
  name: string;
  mimeType: string;
  size: number;
  category: FileCategory;
  isFavorite: boolean;
  isTrashed: boolean;
  trashedAt: string | null;
  description: string;
  previewUrl: string | null;
  textPreview?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShareLink {
  id: string;
  token: string;
  ownerId: string;
  title: string;
  targetType: 'file' | 'project';
  targetId: string;
  clientEmail: string;
  hasPassword: boolean;
  passwordHint?: string;
  expiresAt: string | null;
  allowDownload: boolean;
  isRevoked: boolean;
  viewsCount: number;
  downloadsCount: number;
  createdAt: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  subject: string;
  timestamp: string;
  tone: 'cyan' | 'turquoise' | 'purple';
}

export interface VaultStatePayload {
  user: UserProfile;
  projects: Project[];
  files: VaultFile[];
  shares: ShareLink[];
  activity: ActivityItem[];
}

export interface PublicPortalPayload {
  share: {
    id: string;
    token: string;
    title: string;
    targetType: 'file' | 'project';
    hasPassword: boolean;
    passwordHint?: string;
    expiresAt: string | null;
    allowDownload: boolean;
    isRevoked: boolean;
    isExpired: boolean;
    viewsCount: number;
    downloadsCount: number;
    workspaceName: string;
  };
  unlocked: boolean;
  project: Pick<Project, 'id' | 'name' | 'clientName' | 'description' | 'status'> | null;
  files: Array<{
    id: string;
    name: string;
    mimeType: string;
    size: number;
    category: FileCategory;
    description: string;
    previewUrl: string | null;
    textPreview?: string | null;
    createdAt: string;
  }>;
}
