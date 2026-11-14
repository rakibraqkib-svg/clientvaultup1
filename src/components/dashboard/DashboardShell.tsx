import React, { useState } from 'react';
import {
  LayoutDashboard,
  FolderKanban,
  Files,
  Share2,
  Globe,
  Star,
  Trash2,
  Settings,
  HelpCircle,
  UploadCloud,
  Search,
  LogOut,
  Menu,
  X,
  ArrowLeft,
} from 'lucide-react';
import { ClientVaultLogo } from '../ClientVaultLogo';
import type {
  DashboardTab,
  Project,
  ProjectStatus,
  ShareLink,
  VaultFile,
  VaultStatePayload,
  WorkspaceSettings,
} from '../../types/vault';
import {
  createProject,
  createShareLink,
  deleteProject,
  deleteShareLink,
  permanentlyDeleteFile,
  updateProject,
  updateShareLink,
  updateVaultFile,
  updateWorkspaceSettings,
  uploadVaultFile,
} from '../../services/api';
import { calculateStorageStats, formatBytes } from '../../utils/vaultLogic';
import { LanguageToggle, useLanguage } from '../../i18n/LanguageContext';
import { OverviewView } from './OverviewView';
import { ProjectsView } from './ProjectsView';
import { FilesView } from './FilesView';
import { SharedFilesView } from './SharedFilesView';
import { SettingsView } from './SettingsView';
import { HelpView } from './HelpView';
import { NewProjectModal } from '../modals/NewProjectModal';
import { UploadModal } from '../modals/UploadModal';
import { FilePreviewModal } from '../modals/FilePreviewModal';
import { ShareModal } from '../modals/ShareModal';
import { EditFileModal } from '../modals/EditFileModal';
import { EditShareModal } from '../modals/EditShareModal';

interface DashboardShellProps {
  vault: VaultStatePayload;
  onVaultChange: (next: VaultStatePayload) => void;
  onRefreshVault: () => Promise<void>;
  onOpenPortal: (token: string) => void;
  onReturnLanding: () => void;
  onSignOut: () => void;
}

type SidebarNavTab = Exclude<DashboardTab, 'project-detail'>;

const NAV_ITEMS: Array<{ id: SidebarNavTab; icon: React.ComponentType<{ className?: string }> }> = [
  { id: 'overview', icon: LayoutDashboard },
  { id: 'projects', icon: FolderKanban },
  { id: 'files', icon: Files },
  { id: 'shared', icon: Share2 },
  { id: 'portal', icon: Globe },
  { id: 'favorites', icon: Star },
  { id: 'trash', icon: Trash2 },
  { id: 'settings', icon: Settings },
  { id: 'help', icon: HelpCircle },
];

export const DashboardShell: React.FC<DashboardShellProps> = ({
  vault,
  onVaultChange,
  onRefreshVault,
  onOpenPortal,
  onReturnLanding,
  onSignOut,
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadDefaultProjectId, setUploadDefaultProjectId] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [editingFile, setEditingFile] = useState<VaultFile | null>(null);
  const [editingShare, setEditingShare] = useState<ShareLink | null>(null);
  const [shareTarget, setShareTarget] = useState<{
    type: 'file' | 'project';
    id: string;
    name: string;
    clientEmail?: string;
  } | null>(null);

  const storage = calculateStorageStats(vault.files, vault.user.settings.storageQuotaBytes);
  const projectMap = new Map<string, string>(vault.projects.map((p) => [p.id, p.name]));

  const handleSaveProject = async (payload: {
    name: string;
    clientName: string;
    clientEmail: string;
    description: string;
    accentColor: Project['accentColor'];
    status: ProjectStatus;
  }) => {
    if (editingProject) {
      await updateProject(editingProject.id, payload);
    } else {
      await createProject(payload);
    }
    setEditingProject(null);
    await onRefreshVault();
  };

  const handleDeleteProject = async (project: Project) => {
    await deleteProject(project.id);
    if (selectedProjectId === project.id) setSelectedProjectId(null);
    await onRefreshVault();
  };

  const handleUploadFile = async (payload: {
    name: string;
    mimeType: string;
    size: number;
    projectId: string | null;
    description: string;
    contentBase64?: string;
    textPreview?: string;
  }) => {
    await uploadVaultFile(payload);
    await onRefreshVault();
  };

  const handleSaveFileEdit = async (
    id: string,
    payload: { name: string; projectId: string | null; description: string }
  ) => {
    const res = await updateVaultFile(id, payload);
    if (previewFile?.id === id) {
      setPreviewFile(res.file);
    }
    await onRefreshVault();
  };

  const handleToggleFavorite = async (file: VaultFile) => {
    const res = await updateVaultFile(file.id, { isFavorite: !file.isFavorite });
    onVaultChange({
      ...vault,
      files: vault.files.map((f) => (f.id === file.id ? res.file : f)),
    });
    if (previewFile?.id === file.id) {
      setPreviewFile(res.file);
    }
  };

  const handleMoveToTrash = async (file: VaultFile) => {
    await updateVaultFile(file.id, { isTrashed: true });
    await onRefreshVault();
  };

  const handleRestoreFile = async (file: VaultFile) => {
    await updateVaultFile(file.id, { isTrashed: false });
    await onRefreshVault();
  };

  const handlePermanentDelete = async (file: VaultFile) => {
    await permanentlyDeleteFile(file.id);
    await onRefreshVault();
  };

  const handleCreateShare = async (payload: {
    title: string;
    targetType: 'file' | 'project';
    targetId: string;
    clientEmail: string;
    password: string;
    expiresAt: string | null;
    allowDownload: boolean;
  }) => {
    const res = await createShareLink(payload);
    await onRefreshVault();
    return res.share;
  };

  const handleSaveShareEdit = async (
    id: string,
    payload: { title?: string; password?: string; expiresAt?: string | null; allowDownload?: boolean }
  ) => {
    await updateShareLink(id, payload);
    await onRefreshVault();
  };

  const handleToggleRevoke = async (share: ShareLink) => {
    await updateShareLink(share.id, { isRevoked: !share.isRevoked });
    await onRefreshVault();
  };

  const handleDeleteShare = async (share: ShareLink) => {
    await deleteShareLink(share.id);
    await onRefreshVault();
  };

  const handleSaveSettings = async (payload: {
    name: string;
    role: string;
    settings: Partial<WorkspaceSettings>;
  }) => {
    const res = await updateWorkspaceSettings(payload);
    onVaultChange({ ...vault, user: res.user });
  };

  const navigateTab = (tab: DashboardTab) => {
    setActiveTab(tab);
    if (tab !== 'projects') setSelectedProjectId(null);
    setMobileNavOpen(false);
  };

  const currentTabLabel =
    activeTab === 'project-detail'
      ? t.dashboard.nav.projects
      : t.dashboard.nav[activeTab] || t.dashboard.nav.overview;

  const SidebarContent = (
    <div className="flex h-full flex-col justify-between p-5">
      <div>
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onReturnLanding}
            className="text-left"
            aria-label="Return to ClientVault home page"
          >
            <ClientVaultLogo size="sm" />
          </button>
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            aria-label="Close sidebar"
            className="lg:hidden rounded-lg p-1.5 text-[#B9D8EB] hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5">
          <div className="truncate text-xs font-semibold text-white">
            {vault.user.settings.workspaceName}
          </div>
          <div className="truncate text-[11px] text-[#22E6D0]">{vault.user.email}</div>
        </div>

        <nav aria-label="Dashboard navigation" className="mt-5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#00D9FF]/22 to-[#8B3DFF]/18 text-white border border-[#00D9FF]/45 shadow-[0_0_20px_rgba(0,217,255,0.14)]'
                    : 'text-[#B9D8EB] hover:bg-white/8 hover:text-white border border-transparent'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-[#00D9FF]' : ''}`} />
                <span className="truncate">{t.dashboard.nav[item.id]}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="space-y-4 pt-5 border-t border-white/12">
        <div className="rounded-2xl border border-white/20 bg-white/[0.08] p-3.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-[#B9D8EB]">{t.dashboard.vaultStorage}</span>
            <span className="font-mono text-[#00D9FF] tabular-nums">{storage.percentUsed}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00D9FF] to-[#8B3DFF]"
              style={{ width: `${Math.max(4, storage.percentUsed)}%` }}
            />
          </div>
          <div className="mt-2 text-[11px] text-[#B9D8EB] tabular-nums">
            {formatBytes(storage.usedBytes)} {t.common.of} {formatBytes(storage.quotaBytes)}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReturnLanding}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 py-2 text-xs font-medium text-[#B9D8EB] hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>{t.dashboard.landingBtn}</span>
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-[#B9D8EB] hover:bg-rose-500/20 hover:text-rose-200"
            aria-label={t.dashboard.signOut}
            title={t.dashboard.signOut}
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative z-10 min-h-screen flex text-white">
      {/* Desktop Glass Sidebar */}
      <aside className="hidden lg:block w-68 shrink-0 border-r border-white/18 bg-[#051B44]/55 backdrop-blur-2xl">
        <div className="sticky top-0 h-screen overflow-y-auto">{SidebarContent}</div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-[#041536]/65 backdrop-blur-md"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[85vw] border-r border-white/22 bg-[#061E4D]/92 backdrop-blur-2xl">
            {SidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Dashboard Navbar */}
        <header className="sticky top-0 z-30 border-b border-white/18 bg-[#051B44]/50 backdrop-blur-2xl px-4 sm:px-8 py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileNavOpen(true)}
                aria-label="Open dashboard menu"
                className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/8 text-white"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <div className="text-xs text-[#B9D8EB] truncate">
                  {vault.user.settings.workspaceName} / <span className="text-[#00D9FF]">{currentTabLabel}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <LanguageToggle compact />

              <div className="relative hidden md:block w-56 xl:w-64">
                <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B9D8EB]" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (activeTab === 'overview' && e.target.value.trim().length > 0) {
                      setActiveTab('files');
                    }
                  }}
                  placeholder={t.dashboard.searchPlaceholder}
                  aria-label={t.dashboard.searchPlaceholder}
                  className="w-full rounded-xl border border-white/22 bg-white/[0.09] pl-9 pr-3 py-2 text-xs text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setUploadDefaultProjectId(selectedProjectId);
                  setUploadModalOpen(true);
                }}
                className="cta-ocean-gradient inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold text-white whitespace-nowrap shrink-0"
              >
                <UploadCloud className="h-4 w-4" />
                <span>{t.dashboard.uploadFilesBtn}</span>
              </button>

              <div
                title={`${vault.user.name} (${vault.user.role})`}
                className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full border border-[#00D9FF]/45 bg-gradient-to-br from-[#00D9FF]/25 to-[#8B3DFF]/30 text-xs font-bold text-white"
              >
                {vault.user.avatarInitials}
              </div>
            </div>
          </div>
        </header>

        {/* Active View Canvas */}
        <main className="flex-1 p-4 sm:p-8 max-w-[1400px] w-full mx-auto">
          {activeTab === 'overview' && (
            <OverviewView
              projects={vault.projects}
              files={vault.files}
              shares={vault.shares}
              activity={vault.activity}
              quotaBytes={vault.user.settings.storageQuotaBytes}
              onNavigateTab={navigateTab}
              onOpenProject={(projId) => {
                setSelectedProjectId(projId);
                setActiveTab('projects');
              }}
              onPreviewFile={setPreviewFile}
              onEditFile={setEditingFile}
              onShareFile={(file) =>
                setShareTarget({ type: 'file', id: file.id, name: file.name })
              }
              onToggleFavorite={handleToggleFavorite}
              onMoveToTrash={handleMoveToTrash}
              onOpenNewProject={() => {
                setEditingProject(null);
                setNewProjectOpen(true);
              }}
              onOpenUpload={() => {
                setUploadDefaultProjectId(null);
                setUploadModalOpen(true);
              }}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              projects={vault.projects}
              files={vault.files}
              selectedProjectId={selectedProjectId}
              onSelectProject={setSelectedProjectId}
              onOpenNewProject={() => {
                setEditingProject(null);
                setNewProjectOpen(true);
              }}
              onEditProject={(proj) => {
                setEditingProject(proj);
                setNewProjectOpen(true);
              }}
              onDeleteProject={handleDeleteProject}
              onShareProject={(proj) =>
                setShareTarget({
                  type: 'project',
                  id: proj.id,
                  name: proj.name,
                  clientEmail: proj.clientEmail,
                })
              }
              onUploadToProject={(projId) => {
                setUploadDefaultProjectId(projId);
                setUploadModalOpen(true);
              }}
              onPreviewFile={setPreviewFile}
              onEditFile={setEditingFile}
              onShareFile={(file) =>
                setShareTarget({ type: 'file', id: file.id, name: file.name })
              }
              onToggleFavorite={handleToggleFavorite}
              onMoveToTrash={handleMoveToTrash}
            />
          )}

          {(activeTab === 'files' || activeTab === 'favorites' || activeTab === 'trash') && (
            <FilesView
              mode={activeTab === 'favorites' ? 'favorites' : activeTab === 'trash' ? 'trash' : 'all'}
              files={vault.files}
              projects={vault.projects}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenUpload={() => {
                setUploadDefaultProjectId(null);
                setUploadModalOpen(true);
              }}
              onPreviewFile={setPreviewFile}
              onEditFile={setEditingFile}
              onShareFile={(file) =>
                setShareTarget({ type: 'file', id: file.id, name: file.name })
              }
              onToggleFavorite={handleToggleFavorite}
              onMoveToTrash={handleMoveToTrash}
              onRestoreFile={handleRestoreFile}
              onPermanentDelete={handlePermanentDelete}
            />
          )}

          {activeTab === 'shared' && (
            <SharedFilesView
              shares={vault.shares}
              onOpenPortal={onOpenPortal}
              onEditShare={setEditingShare}
              onToggleRevoke={handleToggleRevoke}
              onDeleteShare={handleDeleteShare}
            />
          )}

          {activeTab === 'portal' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-white">{t.dashboard.portalDirTitle}</h2>
                <p className="text-xs text-[#B9D8EB]">{t.dashboard.portalDirSub}</p>
              </div>
              <SharedFilesView
                shares={vault.shares}
                onOpenPortal={onOpenPortal}
                onEditShare={setEditingShare}
                onToggleRevoke={handleToggleRevoke}
                onDeleteShare={handleDeleteShare}
              />
            </div>
          )}

          {activeTab === 'settings' && (
            <SettingsView user={vault.user} onSaveSettings={handleSaveSettings} />
          )}

          {activeTab === 'help' && (
            <HelpView userName={vault.user.name} userEmail={vault.user.email} />
          )}
        </main>
      </div>

      {/* Modals */}
      <NewProjectModal
        isOpen={newProjectOpen}
        editingProject={editingProject}
        onClose={() => {
          setNewProjectOpen(false);
          setEditingProject(null);
        }}
        onSubmit={handleSaveProject}
      />

      <UploadModal
        isOpen={uploadModalOpen}
        projects={vault.projects}
        defaultProjectId={uploadDefaultProjectId}
        onClose={() => setUploadModalOpen(false)}
        onUploadFile={handleUploadFile}
      />

      <FilePreviewModal
        file={previewFile}
        projectName={previewFile?.projectId ? projectMap.get(previewFile.projectId) : undefined}
        onClose={() => setPreviewFile(null)}
        onToggleFavorite={handleToggleFavorite}
        onShare={(file) => setShareTarget({ type: 'file', id: file.id, name: file.name })}
      />

      <EditFileModal
        file={editingFile}
        projects={vault.projects}
        onClose={() => setEditingFile(null)}
        onSave={handleSaveFileEdit}
      />

      <EditShareModal
        share={editingShare}
        onClose={() => setEditingShare(null)}
        onSave={handleSaveShareEdit}
      />

      {shareTarget && (
        <ShareModal
          isOpen={Boolean(shareTarget)}
          targetType={shareTarget.type}
          targetId={shareTarget.id}
          targetName={shareTarget.name}
          defaultClientEmail={shareTarget.clientEmail}
          onClose={() => setShareTarget(null)}
          onCreateShare={handleCreateShare}
          onOpenPortal={onOpenPortal}
        />
      )}
    </div>
  );
};

