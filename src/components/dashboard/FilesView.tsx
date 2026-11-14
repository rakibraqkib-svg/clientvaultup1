import React, { useState } from 'react';
import {
  Search,
  UploadCloud,
  Eye,
  Edit3,
  Download,
  Share2,
  Star,
  Trash2,
  RotateCcw,
  LayoutGrid,
  List,
} from 'lucide-react';
import type { FileCategory, Project, VaultFile } from '../../types/vault';
import { filterVaultFiles, formatBytes } from '../../utils/vaultLogic';
import { getAuthorizedFileUrl } from '../../services/api';
import { FileThumbnail } from '../FileThumbnail';
import { useLanguage } from '../../i18n/LanguageContext';

interface FilesViewProps {
  mode: 'all' | 'favorites' | 'trash';
  files: VaultFile[];
  projects: Project[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenUpload: () => void;
  onPreviewFile: (file: VaultFile) => void;
  onEditFile: (file: VaultFile) => void;
  onShareFile: (file: VaultFile) => void;
  onToggleFavorite: (file: VaultFile) => void;
  onMoveToTrash: (file: VaultFile) => void;
  onRestoreFile: (file: VaultFile) => void;
  onPermanentDelete: (file: VaultFile) => void;
}

export const FilesView: React.FC<FilesViewProps> = ({
  mode,
  files,
  projects,
  searchQuery,
  onSearchChange,
  onOpenUpload,
  onPreviewFile,
  onEditFile,
  onShareFile,
  onToggleFavorite,
  onMoveToTrash,
  onRestoreFile,
  onPermanentDelete,
}) => {
  const { t } = useLanguage();
  const [category, setCategory] = useState<FileCategory | 'all'>('all');
  const [layout, setLayout] = useState<'grid' | 'list'>('list');

  const filtered = filterVaultFiles(files, {
    query: searchQuery,
    category,
    view: mode,
  });

  const projectMap = new Map(projects.map((p) => [p.id, p.name]));

  const title =
    mode === 'favorites'
      ? t.filesView.favoritesTitle
      : mode === 'trash'
      ? t.filesView.trashTitle
      : t.filesView.allTitle;

  const subtitle =
    mode === 'favorites'
      ? t.filesView.favoritesSub
      : mode === 'trash'
      ? t.filesView.trashSub
      : t.filesView.allSub;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">{title}</h2>
          <p className="text-xs text-[#B9D8EB]">{subtitle}</p>
        </div>

        {mode !== 'trash' && (
          <button
            type="button"
            onClick={onOpenUpload}
            className="cta-ocean-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white"
          >
            <UploadCloud className="h-4 w-4" />
            <span>{t.filesView.uploadFiles}</span>
          </button>
        )}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="ocean-glass rounded-2xl p-4 border border-white/15 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B9D8EB]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t.filesView.filterPlaceholder}
            aria-label={t.filesView.filterPlaceholder}
            className="w-full rounded-xl border border-white/22 bg-white/[0.09] pl-10 pr-3.5 py-2 text-sm text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(['all', 'image', 'document', 'design', 'archive'] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors ${
                category === cat
                  ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/50'
                  : 'bg-white/5 text-[#B9D8EB] border border-white/10 hover:bg-white/10'
              }`}
            >
              {t.filesView.categories[cat]}
            </button>
          ))}

          <div className="ml-1 inline-flex rounded-xl border border-white/15 bg-white/5 p-0.5">
            <button
              type="button"
              onClick={() => setLayout('list')}
              aria-label="List layout"
              className={`rounded-lg p-1.5 ${layout === 'list' ? 'bg-[#0879B9] text-white' : 'text-[#B9D8EB]'}`}
            >
              <List className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setLayout('grid')}
              aria-label="Grid layout"
              className={`rounded-lg p-1.5 ${layout === 'grid' ? 'bg-[#0879B9] text-white' : 'text-[#B9D8EB]'}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="ocean-glass rounded-3xl p-12 text-center">
          <p className="text-base font-display font-semibold text-white">
            {mode === 'trash'
              ? t.filesView.trashEmptyTitle
              : mode === 'favorites'
              ? t.filesView.favoritesEmptyTitle
              : t.filesView.allEmptyTitle}
          </p>
          <p className="mt-1 text-xs text-[#B9D8EB]">
            {mode === 'trash' ? t.filesView.trashEmptySub : t.filesView.defaultEmptySub}
          </p>
        </div>
      ) : layout === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((file) => (
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
                        className="block w-full truncate text-left text-sm font-display font-bold text-white hover:text-[#00D9FF]"
                      >
                        {file.name}
                      </button>
                      <span className="block truncate text-[11px] text-[#B9D8EB] tabular-nums">
                        {formatBytes(file.size)} · {file.projectId ? projectMap.get(file.projectId) || t.filesView.thProject : t.common.unassigned}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-[#B9D8EB] line-clamp-2">{file.description}</p>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                {mode === 'trash' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => onRestoreFile(file)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#22E6D0]/40 bg-[#22E6D0]/12 px-3 py-1.5 text-xs font-semibold text-[#22E6D0] hover:bg-[#22E6D0]/20"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>{t.common.restore}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPermanentDelete(file)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 py-1.5 text-xs font-semibold text-rose-200 hover:bg-rose-500/25"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t.filesView.deleteForever}</span>
                    </button>
                  </>
                ) : (
                  <>
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
                        onClick={() => onToggleFavorite(file)}
                        aria-label={`Favorite ${file.name}`}
                        className={`rounded-lg p-1.5 hover:bg-white/10 ${
                          file.isFavorite ? 'text-amber-300' : 'text-[#B9D8EB]'
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
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="ocean-glass rounded-2xl border border-white/18 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/15 text-xs text-[#B9D8EB]">
                <th className="px-5 py-3.5 font-medium">{t.filesView.thFile}</th>
                <th className="px-4 py-3.5 font-medium">{t.filesView.thProject}</th>
                <th className="px-4 py-3.5 font-medium">{t.filesView.thType}</th>
                <th className="px-4 py-3.5 font-medium text-right">{t.filesView.thSize}</th>
                <th className="px-5 py-3.5 font-medium text-right">{t.filesView.thActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtered.map((file) => (
                <tr key={file.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-5 py-3.5">
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
                        className="max-w-[220px] sm:max-w-[340px] truncate font-medium text-white hover:text-[#00D9FF] text-left"
                      >
                        {file.name}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-[#B9D8EB]">
                    {file.projectId ? projectMap.get(file.projectId) || t.filesView.thProject : t.common.unassigned}
                  </td>
                  <td className="px-4 py-3.5 text-xs uppercase text-[#B9D8EB]">{file.category}</td>
                  <td className="px-4 py-3.5 text-right font-mono text-xs text-[#B9D8EB] tabular-nums">
                    {formatBytes(file.size)}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {mode === 'trash' ? (
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onRestoreFile(file)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[#22E6D0]/40 bg-[#22E6D0]/12 px-2.5 py-1 text-xs font-semibold text-[#22E6D0]"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          <span>{t.common.restore}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onPermanentDelete(file)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-400/40 bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-200"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>{t.common.purge}</span>
                        </button>
                      </div>
                    ) : (
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
                          onClick={() => onToggleFavorite(file)}
                          aria-label={`Favorite ${file.name}`}
                          className={`rounded-lg p-1.5 hover:bg-white/10 ${
                            file.isFavorite ? 'text-amber-300' : 'text-[#B9D8EB]'
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
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
