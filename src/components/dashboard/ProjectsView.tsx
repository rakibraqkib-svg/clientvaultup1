import React from 'react';
import {
  FolderPlus,
  Share2,
  Trash2,
  Edit3,
  ArrowLeft,
  UploadCloud,
  Eye,
  Download,
  Star,
} from 'lucide-react';
import type { Project, VaultFile } from '../../types/vault';
import { countProjectFiles, formatBytes } from '../../utils/vaultLogic';
import { getAuthorizedFileUrl } from '../../services/api';
import { FileThumbnail } from '../FileThumbnail';
import { useLanguage } from '../../i18n/LanguageContext';

interface ProjectsViewProps {
  projects: Project[];
  files: VaultFile[];
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onOpenNewProject: () => void;
  onEditProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onShareProject: (project: Project) => void;
  onUploadToProject: (projectId: string) => void;
  onPreviewFile: (file: VaultFile) => void;
  onEditFile: (file: VaultFile) => void;
  onShareFile: (file: VaultFile) => void;
  onToggleFavorite: (file: VaultFile) => void;
  onMoveToTrash: (file: VaultFile) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  projects,
  files,
  selectedProjectId,
  onSelectProject,
  onOpenNewProject,
  onEditProject,
  onDeleteProject,
  onShareProject,
  onUploadToProject,
  onPreviewFile,
  onEditFile,
  onShareFile,
  onToggleFavorite,
  onMoveToTrash,
}) => {
  const { t } = useLanguage();
  const counts = countProjectFiles(files, projects);
  const activeProject = selectedProjectId
    ? projects.find((p) => p.id === selectedProjectId) || null
    : null;

  if (activeProject) {
    const projectFiles = files.filter((f) => f.projectId === activeProject.id && !f.isTrashed);
    const stats = counts[activeProject.id] || { count: 0, bytes: 0 };

    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => onSelectProject(null)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00D9FF] hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{t.projectsView.backToAll}</span>
        </button>

        <div className="ocean-glass neon-cyan-border rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="text-xs font-semibold text-[#22E6D0]">{activeProject.clientName}</div>
            <h2 className="mt-1 text-2xl sm:text-3xl font-display font-bold text-white">
              {activeProject.name}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[#B9D8EB]">
              {activeProject.description || t.projectsView.noDescription}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#B9D8EB] tabular-nums">
              <span>
                {t.projectsView.statusPrefix} {t.projectsView.statusLabels[activeProject.status]}
              </span>
              <span>·</span>
              <span>
                {stats.count} {t.projectsView.filesLabel} ({formatBytes(stats.bytes)})
              </span>
              {activeProject.clientEmail && (
                <>
                  <span>·</span>
                  <span>{activeProject.clientEmail}</span>
                </>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => onEditProject(activeProject)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/8 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{t.projectsView.edit}</span>
            </button>
            <button
              type="button"
              onClick={() => onDeleteProject(activeProject)}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/35 bg-rose-500/12 px-4 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-500/22"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>{t.common.deleteProject}</span>
            </button>
            <button
              type="button"
              onClick={() => onShareProject(activeProject)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#00D9FF]/45 bg-[#00D9FF]/12 px-4 py-2 text-xs font-semibold text-[#00D9FF] hover:bg-[#00D9FF]/22"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>{t.projectsView.sharePortal}</span>
            </button>
            <button
              type="button"
              onClick={() => onUploadToProject(activeProject.id)}
              className="cta-ocean-gradient inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-semibold text-white"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>{t.projectsView.uploadDeliverable}</span>
            </button>
          </div>
        </div>

        {projectFiles.length === 0 ? (
          <div className="ocean-glass rounded-3xl p-12 text-center">
            <p className="text-base font-display font-semibold text-white">
              {t.projectsView.emptyProjectFiles}
            </p>
            <p className="mt-1 text-xs text-[#B9D8EB]">
              {t.projectsView.emptyProjectFilesSub} {activeProject.clientName}.
            </p>
            <button
              type="button"
              onClick={() => onUploadToProject(activeProject.id)}
              className="cta-ocean-gradient mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white"
            >
              <UploadCloud className="h-4 w-4" />
              <span>{t.projectsView.uploadFirstFile}</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projectFiles.map((file) => (
              <div
                key={file.id}
                className="ocean-glass rounded-2xl p-5 border border-white/18 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileThumbnail
                        file={file}
                        size="md"
                        onClick={() => onPreviewFile(file)}
                      />
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onPreviewFile(file)}
                          title={file.name}
                          className="block w-full text-left font-display font-bold text-white hover:text-[#00D9FF] truncate"
                        >
                          {file.name}
                        </button>
                        <p className="mt-0.5 truncate text-xs text-[#B9D8EB] tabular-nums">
                          {formatBytes(file.size)} · {file.category.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onToggleFavorite(file)}
                      aria-label={`Favorite ${file.name}`}
                      className={file.isFavorite ? 'text-amber-300' : 'text-[#B9D8EB] hover:text-white'}
                    >
                      <Star className={`h-4 w-4 ${file.isFavorite ? 'fill-amber-300' : ''}`} />
                    </button>
                  </div>
                  <p className="mt-2.5 text-xs text-[#B9D8EB] line-clamp-2">{file.description}</p>
                </div>

                <div className="flex items-center justify-between border-t border-white/10 pt-3">
                  <div className="flex items-center gap-1">
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
                    <a
                      href={getAuthorizedFileUrl(file.id, true)}
                      download={file.name}
                      aria-label={`${t.common.download} ${file.name}`}
                      title={t.common.download}
                      className="rounded-lg p-1.5 text-[#B9D8EB] hover:bg-white/10 hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <button
                      type="button"
                      onClick={() => onShareFile(file)}
                      aria-label={`${t.common.share} ${file.name}`}
                      title={t.common.share}
                      className="rounded-lg p-1.5 text-[#00D9FF] hover:bg-[#00D9FF]/15"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                  </div>
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
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">{t.projectsView.title}</h2>
          <p className="text-xs text-[#B9D8EB]">{t.projectsView.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={onOpenNewProject}
          className="cta-ocean-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
        >
          <FolderPlus className="h-4 w-4" />
          <span>{t.projectsView.newProject}</span>
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="ocean-glass rounded-3xl p-12 text-center">
          <p className="text-base font-display font-semibold text-white">
            {t.projectsView.emptyProjects}
          </p>
          <p className="mt-1 text-xs text-[#B9D8EB]">{t.projectsView.emptyProjectsSub}</p>
          <button
            type="button"
            onClick={onOpenNewProject}
            className="cta-ocean-gradient mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white"
          >
            <FolderPlus className="h-4 w-4" />
            <span>{t.projectsView.createProject}</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((proj) => {
            const stats = counts[proj.id] || { count: 0, bytes: 0 };
            return (
              <div
                key={proj.id}
                className={`ocean-glass rounded-2xl p-6 flex flex-col justify-between gap-4 ${
                  proj.accentColor === 'purple' ? 'neon-purple-border' : 'neon-cyan-border'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-[#22E6D0]">{proj.clientName}</span>
                      <h3 className="mt-1 truncate text-lg font-display font-bold text-white">{proj.name}</h3>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-[#B9D8EB]">
                      {t.projectsView.statusLabels[proj.status]}
                    </span>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-[#B9D8EB] line-clamp-2">
                    {proj.description || t.projectsView.noDescription}
                  </p>
                </div>

                <div className="space-y-3 border-t border-white/10 pt-3">
                  <div className="flex items-center justify-between text-xs text-[#B9D8EB] tabular-nums">
                    <span>
                      {stats.count} {t.projectsView.deliverablesLabel}
                    </span>
                    <span>{formatBytes(stats.bytes)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => onSelectProject(proj.id)}
                      className="flex-1 rounded-xl border border-[#00D9FF]/40 bg-[#00D9FF]/10 py-2 text-xs font-semibold text-[#00D9FF] hover:bg-[#00D9FF]/20 transition-colors"
                    >
                      {t.projectsView.openProject}
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditProject(proj)}
                      aria-label={`${t.common.edit} ${proj.name}`}
                      title={t.common.edit}
                      className="rounded-xl border border-white/15 bg-white/5 p-2 text-[#B9D8EB] hover:bg-white/15 hover:text-white"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onShareProject(proj)}
                      aria-label={`${t.common.share} ${proj.name}`}
                      title={t.common.share}
                      className="rounded-xl border border-white/15 bg-white/5 p-2 text-[#B9D8EB] hover:bg-white/15 hover:text-white"
                    >
                      <Share2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteProject(proj)}
                      aria-label={`${t.common.delete} ${proj.name}`}
                      title={t.common.delete}
                      className="rounded-xl border border-white/15 bg-white/5 p-2 text-[#B9D8EB] hover:bg-rose-500/20 hover:text-rose-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

