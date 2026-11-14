import React, { useState } from 'react';
import { X, Link2, Lock, Clock, Copy, Check, ExternalLink } from 'lucide-react';
import type { ExpiryPreset, ShareLink } from '../../types/vault';
import { getExpiryDateFromPreset } from '../../utils/vaultLogic';
import { useLanguage } from '../../i18n/LanguageContext';

interface ShareModalProps {
  isOpen: boolean;
  targetType: 'file' | 'project';
  targetId: string;
  targetName: string;
  defaultClientEmail?: string;
  onClose: () => void;
  onCreateShare: (payload: {
    title: string;
    targetType: 'file' | 'project';
    targetId: string;
    clientEmail: string;
    password: string;
    expiresAt: string | null;
    allowDownload: boolean;
  }) => Promise<ShareLink>;
  onOpenPortal: (token: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  targetType,
  targetId,
  targetName,
  defaultClientEmail = '',
  onClose,
  onCreateShare,
  onOpenPortal,
}) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState(`${targetName} — Client Portal`);
  const [clientEmail, setClientEmail] = useState(defaultClientEmail);
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [expiryPreset, setExpiryPreset] = useState<ExpiryPreset>('7d');
  const [customDate, setCustomDate] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdShare, setCreatedShare] = useState<ShareLink | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const portalUrl = createdShare ? `${window.location.origin}/?portal=${createdShare.token}` : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (enablePassword && password.trim().length < 3) {
      setError('Please enter a share password (at least 3 characters).');
      return;
    }
    if (expiryPreset === 'custom' && !customDate) {
      setError('Please select a custom expiration date.');
      return;
    }

    setCreating(true);
    try {
      const expiresAt = getExpiryDateFromPreset(expiryPreset, customDate);
      const share = await onCreateShare({
        title: title.trim() || targetName,
        targetType,
        targetId,
        clientEmail: clientEmail.trim(),
        password: enablePassword ? password.trim() : '',
        expiresAt,
        allowDownload,
      });
      setCreatedShare(share);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate share link.');
    } finally {
      setCreating(false);
    }
  };

  const handleCopy = async () => {
    if (!portalUrl) return;
    try {
      await navigator.clipboard.writeText(portalUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06285A]/55 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        className="ocean-glass neon-cyan-border relative w-full max-w-lg rounded-3xl p-7 text-white"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t.common.close}
          className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#B9D8EB] hover:bg-white/15 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00D9FF]/15 border border-[#00D9FF]/40 text-[#00D9FF]">
            <Link2 className="h-5 w-5" />
          </div>
          <div>
            <h2 id="share-modal-title" className="text-xl font-display font-bold">
              {t.modals.share.title}
            </h2>
            <p className="text-xs text-[#B9D8EB]">
              {t.modals.share.generatingFor}{' '}
              <span className="text-white font-medium">{targetName}</span>
            </p>
          </div>
        </div>

        {createdShare ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#22E6D0]/40 bg-[#22E6D0]/10 p-4">
              <p className="text-xs font-semibold text-[#22E6D0]">{t.modals.share.readyTitle}</p>
              <p className="mt-1 text-sm font-medium text-white">{createdShare.title}</p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  aria-label="Generated share portal URL"
                  value={portalUrl}
                  className="flex-1 rounded-xl border border-white/22 bg-white/[0.09] px-3 py-2 text-xs font-mono text-[#E2F2FC]"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/20"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-[#22E6D0]" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? t.common.copied : t.common.copy}</span>
                </button>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#B9D8EB]">
                <span>{createdShare.hasPassword ? t.sharedView.passwordProtected : t.modals.share.publicLink}</span>
                <span>·</span>
                <span>
                  {createdShare.expiresAt
                    ? `${t.sharedView.expiresPrefix} ${new Date(createdShare.expiresAt).toLocaleDateString()}`
                    : t.sharedView.noExpiration}
                </span>
                <span>·</span>
                <span>{createdShare.allowDownload ? t.portal.downloadsEnabled : t.portal.viewOnly}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#B9D8EB] hover:bg-white/10"
              >
                {t.common.done}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPortal(createdShare.token);
                }}
                className="cta-ocean-gradient inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white"
              >
                <span>{t.modals.share.openClientPortal}</span>
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div role="alert" className="rounded-xl border border-rose-400/40 bg-rose-500/15 px-3.5 py-2 text-xs text-rose-100">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="share-title" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                {t.modals.share.portalTitle}
              </label>
              <input
                id="share-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm text-white focus:border-[#00D9FF] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="share-email" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                {t.modals.share.recipientEmail}
              </label>
              <input
                id="share-email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@company.com"
                className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
              />
            </div>

            <div className="rounded-2xl border border-white/18 bg-white/[0.08] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label htmlFor="toggle-share-pw" className="inline-flex items-center gap-2 text-sm font-medium text-white cursor-pointer">
                  <Lock className="h-4 w-4 text-[#8B3DFF]" />
                  <span>{t.modals.share.passwordToggle}</span>
                </label>
                <input
                  id="toggle-share-pw"
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(e) => setEnablePassword(e.target.checked)}
                  className="h-4 w-4 accent-[#00D9FF]"
                />
              </div>

              {enablePassword && (
                <div>
                  <label htmlFor="share-password" className="sr-only">
                    {t.modals.share.passwordToggle}
                  </label>
                  <input
                    id="share-password"
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.modals.share.passwordPlaceholder}
                    className="w-full rounded-xl border border-white/22 bg-white/[0.10] px-3.5 py-2 text-sm text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
                  />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/18 bg-white/[0.08] p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-white">
                <Clock className="h-4 w-4 text-[#00D9FF]" />
                <span>{t.modals.share.expirationTitle}</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {(['24h', '7d', '30d', 'custom', 'never'] as ExpiryPreset[]).map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setExpiryPreset(preset)}
                    className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                      expiryPreset === preset
                        ? 'bg-[#00D9FF]/25 text-[#00D9FF] border border-[#00D9FF]/50'
                        : 'bg-white/5 text-[#B9D8EB] border border-white/10 hover:bg-white/10'
                    }`}
                  >
                    {preset === 'never'
                      ? t.modals.share.never
                      : preset === 'custom'
                      ? t.modals.share.custom
                      : preset}
                  </button>
                ))}
              </div>
              {expiryPreset === 'custom' && (
                <input
                  type="datetime-local"
                  aria-label="Custom expiration date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full rounded-xl border border-white/22 bg-white/[0.10] px-3.5 py-2 text-sm text-white focus:border-[#00D9FF] focus:outline-none"
                />
              )}
            </div>

            <label className="flex items-center justify-between rounded-2xl border border-white/18 bg-white/[0.08] px-4 py-3 text-sm text-white cursor-pointer">
              <span>{t.modals.share.allowDownloads}</span>
              <input
                type="checkbox"
                checked={allowDownload}
                onChange={(e) => setAllowDownload(e.target.checked)}
                className="h-4 w-4 accent-[#00D9FF]"
              />
            </label>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#B9D8EB] hover:bg-white/10"
              >
                {t.common.cancel}
              </button>
              <button
                type="submit"
                disabled={creating}
                className="cta-ocean-gradient rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {creating ? t.modals.share.creatingBtn : t.modals.share.generateBtn}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

