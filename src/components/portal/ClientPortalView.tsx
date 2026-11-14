import React, { useEffect, useState } from 'react';
import {
  Lock,
  Download,
  Eye,
  ShieldCheck,
  Clock,
  ArrowLeft,
  AlertTriangle,
  FileText,
  Image as ImageIcon,
  Layers,
  FileArchive,
  Film,
  CheckCircle2,
} from 'lucide-react';
import { ClientVaultLogo } from '../ClientVaultLogo';
import { fetchPublicPortal, unlockPublicPortal } from '../../services/api';
import type { PublicPortalPayload, VaultFile } from '../../types/vault';
import { formatBytes } from '../../utils/vaultLogic';
import { FilePreviewModal } from '../modals/FilePreviewModal';
import { LanguageToggle, useLanguage } from '../../i18n/LanguageContext';

interface ClientPortalViewProps {
  token: string;
  onExitPortal: () => void;
}

export const ClientPortalView: React.FC<ClientPortalViewProps> = ({ token, onExitPortal }) => {
  const { t } = useLanguage();
  const [payload, setPayload] = useState<PublicPortalPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState(false);
  const [previewFile, setPreviewFile] = useState<VaultFile | null>(null);
  const [approved, setApproved] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setUnlockError(null);
    setPassword('');
    setApproved(false);

    fetchPublicPortal(token)
      .then((res) => {
        if (active) setPayload(res);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'Unable to load portal.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setUnlockError(null);
    setUnlocking(true);
    try {
      const unlockedPayload = await unlockPublicPortal(token, password);
      setPayload(unlockedPayload);
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : 'Incorrect passcode.');
    } finally {
      setUnlocking(false);
    }
  };

  const renderCategoryIcon = (category: VaultFile['category']) => {
    if (category === 'image') return <ImageIcon className="h-5 w-5 text-[#00D9FF]" />;
    if (category === 'design') return <Layers className="h-5 w-5 text-[#C39CFF]" />;
    if (category === 'archive') return <FileArchive className="h-5 w-5 text-[#22E6D0]" />;
    if (category === 'media') return <Film className="h-5 w-5 text-[#00D9FF]" />;
    return <FileText className="h-5 w-5 text-[#22E6D0]" />;
  };

  return (
    <div className="relative z-10 min-h-screen px-4 sm:px-8 py-6 text-white">
      <div className="mx-auto max-w-5xl">
        {/* Top Portal Header */}
        <header className="ocean-glass rounded-2xl px-5 py-3.5 flex items-center justify-between gap-4 border border-white/20">
          <div className="flex items-center gap-3 min-w-0">
            <ClientVaultLogo size="sm" />
            {payload && (
              <span className="hidden sm:inline-block truncate text-xs text-[#B9D8EB] border-l border-white/20 pl-3">
                {payload.share.workspaceName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <LanguageToggle compact />
            <button
              type="button"
              onClick={onExitPortal}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/8 px-4 py-2 text-xs font-semibold text-white hover:bg-white/15 transition-colors whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>{t.portal.exitPortal}</span>
            </button>
          </div>
        </header>

        {/* Loading State */}
        {loading && (
          <div className="mt-10 ocean-glass rounded-3xl p-12 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-[#00D9FF] border-t-transparent" />
            <p className="mt-4 text-sm text-[#B9D8EB]">{t.portal.loading}</p>
          </div>
        )}

        {/* Not Found Error */}
        {!loading && error && (
          <div className="mt-10 ocean-glass neon-purple-border rounded-3xl p-10 text-center max-w-xl mx-auto">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-300" />
            <h1 className="mt-4 text-2xl font-display font-bold">{t.portal.unavailableTitle}</h1>
            <p className="mt-2 text-sm text-[#B9D8EB]">{error}</p>
            <button
              type="button"
              onClick={onExitPortal}
              className="cta-ocean-gradient mt-6 rounded-full px-6 py-2.5 text-sm font-semibold text-white"
            >
              {t.portal.returnBtn}
            </button>
          </div>
        )}

        {/* Revoked or Expired */}
        {!loading && payload && (payload.share.isRevoked || payload.share.isExpired) && (
          <div className="mt-10 ocean-glass neon-purple-border rounded-3xl p-10 text-center max-w-xl mx-auto">
            <Clock className="mx-auto h-12 w-12 text-amber-300" />
            <h1 className="mt-4 text-2xl font-display font-bold">
              {payload.share.isRevoked ? t.portal.revokedTitle : t.portal.expiredTitle}
            </h1>
            <p className="mt-2 text-sm text-[#B9D8EB]">
              {payload.share.isRevoked ? t.portal.revokedDesc : t.portal.expiredDesc}
            </p>
          </div>
        )}

        {/* Password Gate */}
        {!loading &&
          payload &&
          !payload.share.isRevoked &&
          !payload.share.isExpired &&
          !payload.unlocked && (
            <div className="mt-12 ocean-glass neon-cyan-border rounded-3xl p-8 sm:p-10 max-w-md mx-auto">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#8B3DFF]/20 border border-[#8B3DFF]/50 text-[#C39CFF]">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-2xl font-display font-bold">{payload.share.title}</h1>
              <p className="mt-1.5 text-sm text-[#B9D8EB]">
                {t.portal.protectedBy} {payload.share.workspaceName}.
              </p>
              {payload.share.passwordHint && (
                <p className="mt-2 text-xs font-medium text-[#22E6D0]">{payload.share.passwordHint}</p>
              )}

              {unlockError && (
                <div
                  role="alert"
                  className="mt-4 rounded-xl border border-rose-400/40 bg-rose-500/15 px-3.5 py-2.5 text-xs text-rose-100"
                >
                  {unlockError}
                </div>
              )}

              <form onSubmit={handleUnlock} className="mt-5 space-y-4">
                <div>
                  <label htmlFor="portal-password" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                    {t.portal.accessPasswordLabel}
                  </label>
                  <input
                    id="portal-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.portal.accessPasswordPlaceholder}
                    className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-4 py-3 text-sm text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={unlocking}
                  className="cta-ocean-gradient w-full rounded-full py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {unlocking ? t.portal.verifying : t.portal.unlockDeliverables}
                </button>
              </form>
            </div>
          )}

        {/* Unlocked Client Portal Gallery */}
        {!loading &&
          payload &&
          !payload.share.isRevoked &&
          !payload.share.isExpired &&
          payload.unlocked && (
            <div className="mt-8 space-y-6">
              <div className="ocean-glass neon-cyan-border rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                  <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#22E6D0]">
                    <ShieldCheck className="h-4 w-4 text-[#00D9FF]" />
                    <span>{payload.share.workspaceName} · {t.portal.verifiedPortal}</span>
                  </div>
                  <h1 className="mt-2 text-2xl sm:text-3xl font-display font-bold text-white">
                    {payload.share.title}
                  </h1>
                  {payload.project && (
                    <p className="mt-1.5 max-w-2xl text-sm text-[#B9D8EB]">
                      {t.portal.clientPrefix} <span className="text-white font-medium">{payload.project.clientName}</span> — {payload.project.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#B9D8EB] tabular-nums">
                    <span>
                      {payload.files.length}{' '}
                      {payload.files.length === 1 ? t.portal.deliverableSingular : t.portal.deliverablePlural}
                    </span>
                    <span>·</span>
                    <span>
                      {payload.share.expiresAt
                        ? `${t.portal.expiresPrefix} ${new Date(payload.share.expiresAt).toLocaleDateString()}`
                        : t.portal.permanentAccess}
                    </span>
                    <span>·</span>
                    <span>{payload.share.allowDownload ? t.portal.downloadsEnabled : t.portal.viewOnly}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setApproved(true)}
                    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                      approved
                        ? 'border border-[#22E6D0]/50 bg-[#22E6D0]/20 text-[#22E6D0]'
                        : 'cta-ocean-gradient text-white'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{approved ? t.portal.approved : t.portal.approveDelivery}</span>
                  </button>
                </div>
              </div>

              {payload.files.length === 0 ? (
                <div className="ocean-glass rounded-3xl p-10 text-center text-sm text-[#B9D8EB]">
                  {t.portal.emptyFiles}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {payload.files.map((file) => {
                    const downloadHref = `/api/portal/${encodeURIComponent(token)}/files/${file.id}/download`;
                    const previewUrl =
                      file.previewUrl || `/api/portal/${encodeURIComponent(token)}/files/${file.id}/download?inline=1`;
                    const fileAsVault: VaultFile = {
                      ...file,
                      ownerId: '',
                      projectId: payload.project?.id || null,
                      isFavorite: false,
                      isTrashed: false,
                      trashedAt: null,
                      previewUrl,
                      updatedAt: file.createdAt,
                    };

                    return (
                      <div
                        key={file.id}
                        className="ocean-glass rounded-2xl p-5 border border-white/18 flex flex-col justify-between gap-4"
                      >
                        <div>
                          {file.category === 'image' && (
                            <div className="mb-4 overflow-hidden rounded-xl border border-white/18 bg-white/[0.08]">
                              <img
                                src={previewUrl}
                                alt={file.name}
                                referrerPolicy="no-referrer"
                                className="h-44 w-full object-cover"
                              />
                            </div>
                          )}

                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/5">
                              {renderCategoryIcon(file.category)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h2 className="truncate text-base font-display font-bold text-white">
                                {file.name}
                              </h2>
                              <p className="mt-0.5 text-xs text-[#B9D8EB] tabular-nums">
                                {formatBytes(file.size)} · {file.category.toUpperCase()}
                              </p>
                            </div>
                          </div>

                          <p className="mt-3 text-xs leading-relaxed text-[#B9D8EB]">
                            {file.description}
                          </p>
                        </div>

                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-white/10">
                          <button
                            type="button"
                            onClick={() => setPreviewFile(fileAsVault)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/15 transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span>{t.common.preview}</span>
                          </button>

                          {payload.share.allowDownload && (
                            <a
                              href={downloadHref}
                              download={file.name}
                              className="cta-ocean-gradient inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>{t.common.download}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
      </div>

      <FilePreviewModal
        file={previewFile}
        projectName={payload?.project?.name}
        onClose={() => setPreviewFile(null)}
        customDownloadUrl={
          previewFile
            ? `/api/portal/${encodeURIComponent(token)}/files/${previewFile.id}/download`
            : undefined
        }
        allowDownload={payload?.share.allowDownload ?? true}
      />
    </div>
  );
};

