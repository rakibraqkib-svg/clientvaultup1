import React from 'react';
import {
  Files,
  FolderKanban,
  Link2,
  HardDrive,
  Star,
  Share2,
  Eye,
  Edit3,
  Trash2,
  Plus,
  UploadCloud,
  ArrowUpRight,
} from 'lucide-react';
import type { ActivityItem, DashboardTab, Project, ShareLink, VaultFile } from '../../types/vault';
import { calculateStorageStats, countProjectFiles, formatBytes } from '../../utils/vaultLogic';
import { FileThumbnail } from '../FileThumbnail';
import { useLanguage } from '../../i18n/LanguageContext';

interface OverviewViewProps {
  projects: Project[];
  files: VaultFile[];
  shares: ShareLink[];
  activity: ActivityItem[];
  quotaBytes: number;
  onNavigateTab: (tab: DashboardTab) => void;
  onOpenProject: (projectId: string) => void;
  onPreviewFile: (file: VaultFile) => void;
  onEditFile: (file: VaultFile) => void;
  onShareFile: (file: VaultFile) => void;
  onToggleFavorite: (file: VaultFile) => void;
  onMoveToTrash: (file: VaultFile) => void;
  onOpenNewProject: () => void;
  onOpenUpload: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  projects,
  files,
  shares,
  activity,
  quotaBytes,
  onNavigateTab,
  onOpenProject,
  onPreviewFile,
  onEditFile,
  onShareFile,
  onToggleFavorite,
  onMoveToTrash,
  onOpenNewProject,
  onOpenUpload,
}) => {
  const { t } = useLanguage();
  const storage = calculateStorageStats(files, quotaBytes);
  const projectCounts = countProjectFiles(files, projects);
  const activeFiles = files.filter((f) => !f.isTrashed);
  const activeShares = shares.filter((s) => !s.isRevoked);

  const recentFiles = activeFiles.slice(0, 5);
  const recentProjects = projects.slice(0, 3);

  return (
    <div className="space-y-7">
      {/* 4 Floating Glass Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="ocean-glass neon-cyan-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#B9D8EB]">{t.overview.activeFiles}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00D9FF]/15 text-[#00D9FF]">
              <Files className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-display font-bold text-white tabular-nums">
            {storage.activeCount}
          </div>
          <p className="mt-1 text-xs text-[#22E6D0] tabular-nums">
            {files.filter((f) => f.isFavorite && !f.isTrashed).length} {t.overview.starredSuffix}
          </p>
        </div>

        <div className="ocean-glass neon-purple-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#B9D8EB]">{t.overview.clientProjects}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#8B3DFF]/20 text-[#C39CFF]">
              <FolderKanban className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-display font-bold text-white tabular-nums">
            {projects.length}
          </div>
          <p className="mt-1 text-xs text-[#B9D8EB] tabular-nums">
            {projects.filter((p) => p.status === 'active').length} {t.overview.activeSuffix}
          </p>
        </div>

        <div className="ocean-glass neon-cyan-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#B9D8EB]">{t.overview.sharedPortals}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#22E6D0]/15 text-[#22E6D0]">
              <Link2 className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-display font-bold text-white tabular-nums">
            {activeShares.length}
          </div>
          <p className="mt-1 text-xs text-[#B9D8EB] tabular-nums">
            {shares.reduce((sum, s) => sum + s.downloadsCount, 0)} {t.overview.downloadsSuffix}
          </p>
        </div>

        <div className="ocean-glass neon-purple-border rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-[#B9D8EB]">{t.overview.storageUsed}</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0879B9]/25 text-[#00D9FF]">
              <HardDrive className="h-4 w-4" />
            </span>
          </div>
          <div className="mt-3 text-3xl font-display font-bold text-white tabular-nums">
            {formatBytes(storage.usedBytes)}
          </div>
          <p className="mt-1 text-xs text-[#B9D8EB] tabular-nums">
            {t.common.of} {formatBytes(storage.quotaBytes)} ({storage.percentUsed}%)
          </p>
        </div>
      </div>

      {/* Storage Overview + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7 ocean-glass rounded-2xl p-6 border border-white/18">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-display font-bold text-white">{t.overview.storageOverview}</h2>
              <p className="text-xs text-[#B9D8EB]">{t.overview.storageSub}</p>
            </div>
            <span className="text-sm font-mono font-semibold text-[#00D9FF] tabular-nums">
              {formatBytes(storage.usedBytes)} / {formatBytes(storage.quotaBytes)}
            </span>
          </div>

          <div className="mt-5 h-3 w-full overflow-hidden rounded-full bg-white/10 flex">
            <div
              className="h-full bg-[#00D9FF]"
              style={{
                width: `${Math.max(storage.byCategory.image > 0 ? 4 : 0, (storage.byCategory.image / Math.max(storage.usedBytes, 1)) * 100)}%`,
              }}
              title={t.overview.catImages}
            />
            <div
              className="h-full bg-[#8B3DFF]"
              style={{
                width: `${Math.max(storage.byCategory.archive > 0 ? 4 : 0, (storage.byCategory.archive / Math.max(storage.usedBytes, 1)) * 100)}%`,
              }}
              title={t.overview.catArchives}
            />
            <div
              className="h-full bg-[#22E6D0]"
              style={{
                width: `${Math.max(
                  storage.byCategory.document + storage.byCategory.design > 0 ? 4 : 0,
                  ((storage.byCategory.document + storage.byCategory.design) / Math.max(storage.usedBytes, 1)) * 100
                )}%`,
              }}
              title={t.overview.catDocs}
            />
          </div>

          <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              [t.overview.catImages, storage.byCategory.image, 'bg-[#00D9FF]'],
              [t.overview.catDocs, storage.byCategory.document, 'bg-[#22E6D0]'],
              [t.overview.catDesign, storage.byCategory.design, 'bg-[#0879B9]'],
              [t.overview.catArchives, storage.byCategory.archive, 'bg-[#8B3DFF]'],
            ].map(([label, bytes, dotClass]) => (
              <div key={String(label)} className="rounded-xl border border-white/18 bg-white/[0.08] p-3">
                <div className="flex items-center gap-2 text-xs text-[#B9D8EB]">
                  <span className={`h-2 w-2 rounded-full ${dotClass}`} />
                  <span>{label}</span>
                </div>
                <div className="mt-1.5 text-sm font-mono font-semibold text-white tabular-nums">
                  {formatBytes(Number(bytes))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 ocean-glass rounded-2xl p-6 border border-white/18">
          <h2 className="text-lg font-display font-bold text-white">{t.overview.recentActivity}</h2>
          <p className="text-xs text-[#B9D8EB]">{t.overview.recentActivitySub}</p>

          <div className="mt-4 space-y-3">
            {activity.slice(0, 4).map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-xl border border-white/16 bg-white/[0.08] px-3.5 py-2.5"
              >
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[#22E6D0]">{item.action}</div>
                  <div className="truncate text-sm text-white mt-0.5">{item.subject}</div>
                </div>
                <span className="shrink-0 text-[11px] font-mono text-[#B9D8EB] tabular-nums">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <section>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-white">{t.overview.recentProjects}</h2>
            <p className="text-xs text-[#B9D8EB]">{t.overview.recentProjectsSub}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenNewProject}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#00D9FF]/45 bg-[#00D9FF]/12 px-4 py-2 text-xs font-semibold text-[#00D9FF] hover:bg-[#00D9FF]/22 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t.overview.newProject}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('projects')}
              className="text-xs font-semibold text-[#B9D8EB] hover:text-white"
            >
              {t.overview.viewAll}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recentProjects.map((proj) => {
            const stats = projectCounts[proj.id] || { count: 0, bytes: 0 };
            return (
              <button
                key={proj.id}
                type="button"
                onClick={() => onOpenProject(proj.id)}
                className="ocean-glass neon-cyan-border group text-left rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-xs font-medium text-[#22E6D0]">{proj.clientName}</div>
                    <h3 className="mt-1 text-base font-display font-bold text-white group-hover:text-[#00D9FF] transition-colors">
                      {proj.name}
                    </h3>
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[#B9D8EB] group-hover:text-[#00D9FF]" />
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-[#B9D8EB]">{proj.description}</p>
                <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3 text-xs text-[#B9D8EB] tabular-nums">
                  <span>
                    {stats.count} {stats.count === 1 ? t.common.fileCountSuffix : t.common.filesCountSuffix} · {formatBytes(stats.bytes)}
                  </span>
                  <span className="text-white">{t.projectsView.statusLabels[proj.status]}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Files */}
      <section className="ocean-glass rounded-2xl p-6 border border-white/18">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-display font-bold text-white">{t.overview.recentFiles}</h2>
            <p className="text-xs text-[#B9D8EB]">{t.overview.recentFilesSub}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onOpenUpload}
              className="cta-ocean-gradient inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>{t.overview.uploadFile}</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigateTab('files')}
              className="text-xs font-semibold text-[#B9D8EB] hover:text-white"
            >
              {t.overview.allFilesLink}
            </button>
          </div>
        </div>

        {recentFiles.length === 0 ? (
          <div className="rounded-xl border border-white/16 bg-white/[0.08] p-8 text-center text-sm text-[#D4ECFA]">
            {t.overview.emptyFiles}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/12 text-xs text-[#B9D8EB]">
                  <th className="pb-3 font-medium">{t.overview.thFileName}</th>
                  <th className="pb-3 font-medium">{t.overview.thCategory}</th>
                  <th className="pb-3 font-medium text-right">{t.overview.thSize}</th>
                  <th className="pb-3 font-medium text-right">{t.overview.thActions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {recentFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 pr-4 font-medium text-white">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileThumbnail
                          file={file}
                          size="sm"
                          onClick={() => onPreviewFile(file)}
                        />
                        <button
                          type="button"
                          onClick={() => onPreviewFile(file)}
                          title={file.name}
                          className="max-w-[220px] sm:max-w-[340px] truncate text-left hover:text-[#00D9FF] transition-colors"
                        >
                          {file.name}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs uppercase text-[#B9D8EB]">{file.category}</td>
                    <td className="py-3 pr-4 text-right font-mono text-xs text-[#B9D8EB] tabular-nums">
                      {formatBytes(file.size)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onPreviewFile(file)}
                          aria-label={`${t.common.preview} ${file.name}`}
                          title={t.common.preview}
                          className="rounded-lg p-1.5 text-[#B9D8EB] hover:bg-white/10 hover:text-white"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onEditFile(file)}
                          aria-label={`${t.common.edit} ${file.name}`}
                          title={t.common.edit}
                          className="rounded-lg p-1.5 text-[#B9D8EB] hover:bg-white/10 hover:text-white"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleFavorite(file)}
                          aria-label={`Favorite ${file.name}`}
                          className={`rounded-lg p-1.5 hover:bg-white/10 ${
                            file.isFavorite ? 'text-amber-300' : 'text-[#B9D8EB] hover:text-white'
                          }`}
                        >
                          <Star className={`h-4 w-4 ${file.isFavorite ? 'fill-amber-300' : ''}`} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onShareFile(file)}
                          aria-label={`${t.common.share} ${file.name}`}
                          title={t.common.share}
                          className="rounded-lg p-1.5 text-[#00D9FF] hover:bg-[#00D9FF]/15"
                        >
                          <Share2 className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onMoveToTrash(file)}
                          aria-label={`${t.common.delete} ${file.name}`}
                          title={t.common.delete}
                          className="rounded-lg p-1.5 text-[#B9D8EB] hover:bg-rose-500/20 hover:text-rose-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

