import React, { useState } from 'react';
import { X, FolderLock, UploadCloud, Share2, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../../i18n/LanguageContext';

interface WatchDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExploreDashboard: () => void;
}

const STEP_ICONS = [FolderLock, UploadCloud, Share2] as const;

export const WatchDemoModal: React.FC<WatchDemoModalProps> = ({
  isOpen,
  onClose,
  onExploreDashboard,
}) => {
  const { t } = useLanguage();
  const [activeStep, setActiveStep] = useState(0);
  const current = t.modals.watchDemo.steps[activeStep];
  const Icon = STEP_ICONS[activeStep];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06285A]/55 backdrop-blur-md">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="demo-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            className="ocean-glass neon-cyan-border relative w-full max-w-2xl rounded-3xl p-7 text-white"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.close}
              className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#B9D8EB] hover:bg-white/15 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="text-xs font-semibold uppercase tracking-widest text-[#22E6D0]">
              {t.modals.watchDemo.eyebrow}
            </p>
            <h2 id="demo-modal-title" className="mt-1.5 text-2xl font-display font-bold">
              {t.modals.watchDemo.title}
            </h2>

            <div className="mt-5 flex flex-wrap gap-2">
              {t.modals.watchDemo.steps.map((step, idx) => (
                <button
                  key={step.label}
                  type="button"
                  onClick={() => setActiveStep(idx)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
                    activeStep === idx
                      ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/50'
                      : 'bg-white/5 text-[#B9D8EB] border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {step.label}
                </button>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-xl p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#00D9FF]/25 to-[#8B3DFF]/25 border border-[#00D9FF]/40 text-[#00D9FF]">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-bold text-white">{current.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#B9D8EB]">{current.summary}</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-[#22E6D0]/25 bg-white/5 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-white">{current.previewTitle}</div>
                  <div className="text-xs text-[#22E6D0] mt-0.5">{current.previewMeta}</div>
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B9D8EB]">
                  <ShieldCheck className="h-4 w-4 text-[#00D9FF]" />
                  {t.modals.watchDemo.encryptedReady}
                </span>
              </div>

              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-[#B9D8EB]">
                {current.highlights.map((item) => (
                  <li key={item} className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/20 bg-white/5 px-5 py-2.5 text-sm font-medium text-[#B9D8EB] hover:bg-white/10 hover:text-white transition-colors"
              >
                {t.common.close}
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onExploreDashboard();
                }}
                className="cta-ocean-gradient inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02]"
              >
                <span>{t.modals.watchDemo.tryLiveBtn}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

