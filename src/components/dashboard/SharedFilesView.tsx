import React, { useState } from 'react';
import {
  Link2,
  Lock,
  Clock,
  Copy,
  Check,
  ExternalLink,
  Ban,
  RotateCcw,
  Trash2,
  Edit3,
} from 'lucide-react';
import type { ShareLink } from '../../types/vault';
import { validateShareAvailability } from '../../utils/vaultLogic';
import { useLanguage } from '../../i18n/LanguageContext';

interface SharedFilesViewProps {
  shares: ShareLink[];
  onOpenPortal: (token: string) => void;
  onEditShare?: (share: ShareLink) => void;
  onToggleRevoke: (share: ShareLink) => void;
  onDeleteShare: (share: ShareLink) => void;
}

export const SharedFilesView: React.FC<SharedFilesViewProps> = ({
  shares,
  onOpenPortal,
  onEditShare,
  onToggleRevoke,
  onDeleteShare,
}) => {
  const { t } = useLanguage();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (share: ShareLink) => {
    const url = `${window.location.origin}/?portal=${share.token}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // ignore clipboard fallback
    }
    setCopiedId(share.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">{t.sharedView.title}</h2>
        <p className="text-xs text-[#B9D8EB]">{t.sharedView.subtitle}</p>
      </div>

      {shares.length === 0 ? (
        <div className="ocean-glass rounded-3xl p-12 text-center">
          <Link2 className="mx-auto h-10 w-10 text-[#00D9FF]" />
          <p className="mt-3 text-base font-display font-semibold text-white">
            {t.sharedView.emptyTitle}
          </p>
          <p className="mt-1 text-xs text-[#B9D8EB]">{t.sharedView.emptySub}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {shares.map((share) => {
            const availability = validateShareAvailability(share);
            return (
              <div
                key={share.id}
                className={`ocean-glass rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  availability.valid ? 'neon-cyan-border' : 'border border-white/15 opacity-80'
                }`}
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <h3 className="text-base font-display font-bold text-white truncate">
                      {share.title}
                    </h3>
                    <span
                      className={`text-xs font-semibold ${
                        availability.valid ? 'text-[#22E6D0]' : 'text-amber-300'
                      }`}
                    >
                      {availability.valid
                        ? t.sharedView.active
                        : availability.reason === 'revoked'
                        ? t.sharedView.revoked
                        : t.sharedView.expired}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#B9D8EB] tabular-nums">
                    <span className="inline-flex items-center gap-1">
                      <Lock className="h-3.5 w-3.5 text-[#C39CFF]" />
                      {share.hasPassword ? t.sharedView.passwordProtected : t.sharedView.openLink}
                    </span>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#00D9FF]" />
                      {share.expiresAt
                        ? `${t.sharedView.expiresPrefix} ${new Date(share.expiresAt).toLocaleDateString()}`
                        : t.sharedView.noExpiration}
                    </span>
                    <span>·</span>
                    <span>{share.viewsCount} {t.sharedView.viewsSuffix}</span>
                    <span>·</span>
                    <span>{share.downloadsCount} {t.sharedView.downloadsSuffix}</span>
                  </div>

                  <div className="font-mono text-xs text-[#00D9FF] truncate">
                    /?portal={share.token}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleCopy(share)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/8 px-3.5 py-2 text-xs font-semibold text-white hover:bg-white/15"
                  >
                    {copiedId === share.id ? (
                      <Check className="h-3.5 w-3.5 text-[#22E6D0]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedId === share.id ? t.common.copied : t.common.copyLink}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenPortal(share.token)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#00D9FF]/45 bg-[#00D9FF]/12 px-3.5 py-2 text-xs font-semibold text-[#00D9FF] hover:bg-[#00D9FF]/22"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>{t.common.openPortal}</span>
                  </button>

                  {onEditShare && (
                    <button
                      type="button"
                      onClick={() => onEditShare(share)}
                      aria-label={`${t.common.edit} ${share.title}`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-white/18 bg-white/8 px-3 py-2 text-xs font-semibold text-white hover:bg-white/15"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>{t.common.edit}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onToggleRevoke(share)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-[#B9D8EB] hover:bg-white/15 hover:text-white"
                  >
                    {share.isRevoked ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5 text-[#22E6D0]" />
                        <span>{t.sharedView.reenable}</span>
                      </>
                    ) : (
                      <>
                        <Ban className="h-3.5 w-3.5 text-amber-300" />
                        <span>{t.sharedView.revoke}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteShare(share)}
                    aria-label={`${t.common.delete} ${share.title}`}
                    title={t.common.delete}
                    className="rounded-xl border border-white/15 bg-white/5 p-2 text-[#B9D8EB] hover:bg-rose-500/20 hover:text-rose-200"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

