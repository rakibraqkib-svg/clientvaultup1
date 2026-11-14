import React from 'react';
import { X, Download, Share2, Star, FileText, FileArchive, Film, Layers } from 'lucide-react';
import type { VaultFile } from '../../types/vault';
import { formatBytes } from '../../utils/vaultLogic';
import { getAuthorizedFileUrl } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

interface FilePreviewModalProps {
  file: VaultFile | null;
  projectName?: string;
  onClose: () => void;
  onToggleFavorite?: (file: VaultFile) => void;
  onShare?: (file: VaultFile) => void;
  customDownloadUrl?: string;
  allowDownload?: boolean;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  file,
  projectName,
  onClose,
  onToggleFavorite,
  onShare,
  customDownloadUrl,
  allowDownload = true,
}) => {
  const { t } = useLanguage();
  if (!file) return null;

  const contentUrl =
    customDownloadUrl ||
    (file.previewUrl &&
    !file.previewUrl.startsWith('/api/files/') &&
    !file.previewUrl.startsWith('/src/')
      ? file.previewUrl
      : getAuthorizedFileUrl(file.id, false));

  const downloadUrl =
    customDownloadUrl || getAuthorizedFileUrl(file.id, true);

  const isImage = file.category === 'image';
  const isPdf = file.mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
  const isText = Boolean(file.textPreview) || file.mimeType.startsWith('text/') || file.mimeType.includes('json');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06285A]/60 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
        className="ocean-glass neon-cyan-border relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl p-6 text-white"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/15 pb-4">
          <div className="min-w-0">
            <h2 id="preview-modal-title" className="truncate text-lg font-display font-bold text-white">
              {file.name}
            </h2>
            <p className="mt-1 text-xs text-[#B9D8EB] tabular-nums">
              {formatBytes(file.size)} · {file.category.toUpperCase()}
              {projectName ? ` · ${projectName}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(file)}
                aria-label={file.isFavorite ? `Unfavorite ${file.name}` : `Favorite ${file.name}`}
                className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${
                  file.isFavorite
                    ? 'border-amber-400/50 bg-amber-400/15 text-amber-300'
                    : 'border-white/15 bg-white/5 text-[#B9D8EB] hover:bg-white/15'
                }`}
              >
                <Star className={`h-4 w-4 ${file.isFavorite ? 'fill-amber-300' : ''}`} />
              </button>
            )}
            {onShare && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onShare(file);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#00D9FF]/40 bg-[#00D9FF]/10 px-3.5 py-2 text-xs font-semibold text-[#00D9FF] hover:bg-[#00D9FF]/20 transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" />
                <span>{t.common.share}</span>
              </button>
            )}
            {allowDownload && (
              <a
                href={downloadUrl}
                download={file.name}
                className="cta-ocean-gradient inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"
              >
                <Download className="h-3.5 w-3.5" />
                <span>{t.common.download}</span>
              </a>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.close}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#B9D8EB] hover:bg-white/15 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex-1 overflow-auto rounded-2xl border border-white/18 bg-white/[0.07] p-4">
          {isImage ? (
            <div className="flex items-center justify-center">
              <img
                src={contentUrl}
                alt={file.name}
                referrerPolicy="no-referrer"
                className="max-h-[55vh] w-auto rounded-xl object-contain shadow-2xl"
              />
            </div>
          ) : isPdf ? (
            <iframe
              src={contentUrl}
              title={file.name}
              className="h-[55vh] w-full rounded-xl border border-white/10 bg-white"
            />
          ) : isText && file.textPreview ? (
            <pre className="whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-[#E2F2FC]">
              {file.textPreview}
            </pre>
          ) : (
            <div className="flex flex-col items-center justify-center py-14 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#00D9FF]/40 bg-[#00D9FF]/12 text-[#00D9FF]">
                {file.category === 'archive' ? (
                  <FileArchive className="h-8 w-8" />
                ) : file.category === 'media' ? (
                  <Film className="h-8 w-8" />
                ) : file.category === 'design' ? (
                  <Layers className="h-8 w-8" />
                ) : (
                  <FileText className="h-8 w-8" />
                )}
              </div>
              <p className="mt-4 text-base font-display font-semibold text-white">{file.name}</p>
              <p className="mt-1.5 max-w-md text-xs text-[#B9D8EB]">
                {file.description || 'Binary deliverable ready for encrypted download.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

