import React from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../i18n/LanguageContext';

interface LegalModalProps {
  docType: 'privacy' | 'terms' | null;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ docType, onClose }) => {
  const { t } = useLanguage();
  if (!docType) return null;

  const isPrivacy = docType === 'privacy';
  const paragraphs = isPrivacy
    ? t.modals.legal.privacyParagraphs
    : t.modals.legal.termsParagraphs;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06285A]/55 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="legal-modal-title"
        className="ocean-glass neon-cyan-border relative w-full max-w-xl rounded-3xl p-7 text-white"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t.common.close}
          className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#B9D8EB] hover:bg-white/15 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <h2 id="legal-modal-title" className="text-2xl font-display font-bold">
          {isPrivacy ? t.modals.legal.privacyTitle : t.modals.legal.termsTitle}
        </h2>
        <p className="mt-1 text-xs text-[#B9D8EB]">{t.modals.legal.updatedMeta}</p>

        <div className="mt-5 max-h-[55vh] space-y-4 overflow-y-auto pr-2 text-sm leading-relaxed text-[#B9D8EB]">
          {paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cta-ocean-gradient rounded-full px-6 py-2.5 text-sm font-semibold text-white"
          >
            {t.modals.legal.understandBtn}
          </button>
        </div>
      </div>
    </div>
  );
};

