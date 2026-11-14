import React, { useEffect, useState } from 'react';
import { X, Link2, Lock, Clock } from 'lucide-react';
import type { ExpiryPreset, ShareLink } from '../../types/vault';
import { getExpiryDateFromPreset } from '../../utils/vaultLogic';
import { useLanguage } from '../../i18n/LanguageContext';

interface EditShareModalProps {
  share: ShareLink | null;
  onClose: () => void;
  onSave: (
    shareId: string,
    payload: {
      title?: string;
      allowDownload?: boolean;
      expiresAt?: string | null;
      password?: string;
    }
  ) => Promise<void>;
}

export const EditShareModal: React.FC<EditShareModalProps> = ({
  share,
  onClose,
  onSave,
}) => {
  const { t, lang } = useLanguage();
  const [title, setTitle] = useState('');
  const [allowDownload, setAllowDownload] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [expiryMode, setExpiryMode] = useState<'keep' | ExpiryPreset>('keep');
  const [customDate, setCustomDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (share) {
      setTitle(share.title);
      setAllowDownload(share.allowDownload);
      setNewPassword('');
      setExpiryMode('keep');
      setCustomDate('');
      setError(null);
    }
  }, [share]);

  if (!share) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 2) {
      setError(lang === 'bn' ? 'পোর্টালের শিরোনাম লিখুন।' : 'Please enter a portal title.');
      return;
    }
    if (newPassword.trim().length > 0 && newPassword.trim().length < 3) {
      setError(
        lang === 'bn'
          ? 'পাসওয়ার্ড কমপক্ষে ৩ অক্ষরের হতে হবে।'
          : 'Password must be at least 3 characters.'
      );
      return;
    }
    if (expiryMode === 'custom' && !customDate) {
      setError(
        lang === 'bn' ? 'কাস্টম মেয়াদের তারিখ নির্বাচন করুন।' : 'Please select a custom expiration date.'
      );
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: {
        title?: string;
        allowDownload?: boolean;
        expiresAt?: string | null;
        password?: string;
      } = {
        title: title.trim(),
        allowDownload,
      };
      if (expiryMode !== 'keep') {
        payload.expiresAt = getExpiryDateFromPreset(expiryMode, customDate);
      }
      if (newPassword.trim().length > 0) {
        payload.password = newPassword.trim();
      }
      await onSave(share.id, payload);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : lang === 'bn'
          ? 'শেয়ার লিংক আপডেট করা যায়নি।'
          : 'Unable to update share link.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06285A]/55 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-share-modal-title"
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
            <h2 id="edit-share-modal-title" className="text-xl font-display font-bold">
              {t.modals.editShare.title}
            </h2>
            <p className="text-xs text-[#B9D8EB]">{t.modals.editShare.subtitle}</p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-xl border border-rose-400/40 bg-rose-500/15 px-3.5 py-2 text-xs text-rose-100"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-share-title" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
              {t.modals.share.portalTitle}
            </label>
            <input
              id="edit-share-title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm text-white focus:border-[#00D9FF] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="edit-share-pw" className="flex items-center gap-1.5 text-xs font-medium text-[#B9D8EB] mb-1.5">
              <Lock className="h-3.5 w-3.5 text-[#8B3DFF]" />
              <span>{t.modals.editShare.newPasswordLabel}</span>
            </label>
            <input
              id="edit-share-pw"
              type="text"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t.modals.editShare.newPasswordPlaceholder}
              className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm text-white placeholder:text-white/45 focus:border-[#00D9FF] focus:outline-none"
            />
          </div>

          <div className="rounded-2xl border border-white/18 bg-white/[0.08] p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-white">
              <Clock className="h-4 w-4 text-[#00D9FF]" />
              <span>{t.modals.share.expirationTitle}</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {(['keep', '24h', '7d', '30d', 'custom', 'never'] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setExpiryMode(preset)}
                  className={`rounded-lg py-1.5 text-xs font-semibold transition-colors ${
                    expiryMode === preset
                      ? 'bg-[#00D9FF]/25 text-[#00D9FF] border border-[#00D9FF]/50'
                      : 'bg-white/5 text-[#B9D8EB] border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {preset === 'keep'
                    ? lang === 'bn'
                      ? 'বর্তমান'
                      : 'Keep'
                    : preset === 'never'
                    ? t.modals.share.never
                    : preset === 'custom'
                    ? t.modals.share.custom
                    : preset}
                </button>
              ))}
            </div>
            {expiryMode === 'custom' && (
              <input
                type="datetime-local"
                aria-label={t.modals.share.custom}
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
              className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#B9D8EB] hover:bg-white/10 hover:text-white transition-colors"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="cta-ocean-gradient rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {saving ? t.common.saving : t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
