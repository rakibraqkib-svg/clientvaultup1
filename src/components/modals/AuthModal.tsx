import React, { useEffect, useState } from 'react';
import { X, Lock, Mail, User, Building2, ArrowRight, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ClientVaultLogo } from '../ClientVaultLogo';
import { loginWithDemo, loginWithEmail, registerAccount } from '../../services/api';
import type { UserProfile } from '../../types/vault';
import { useLanguage } from '../../i18n/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'register',
  onClose,
  onSuccess,
}) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
    }
  }, [isOpen, initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res =
        mode === 'register'
          ? await registerAccount({ name, email, password, workspaceName })
          : await loginWithEmail(email, password);
      onSuccess(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await loginWithDemo();
      onSuccess(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open demo studio.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06285A]/55 backdrop-blur-md">
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="auth-modal-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.2 }}
            className="ocean-glass neon-cyan-border relative w-full max-w-md rounded-3xl p-7 text-white shadow-2xl"
          >
            <button
              type="button"
              onClick={onClose}
              aria-label={t.common.close}
              className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#B9D8EB] hover:bg-white/15 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-6">
              <ClientVaultLogo size="sm" />
              <h2 id="auth-modal-title" className="mt-4 text-2xl font-display font-bold tracking-tight">
                {mode === 'register' ? t.modals.auth.createTitle : t.modals.auth.loginTitle}
              </h2>
              <p className="mt-1 text-sm text-[#B9D8EB]">
                {mode === 'register' ? t.modals.auth.createSub : t.modals.auth.loginSub}
              </p>
            </div>

            <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-white/8 p-1 border border-white/12">
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError(null);
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-[#0879B9] to-[#00D9FF]/80 text-white shadow-sm'
                    : 'text-[#B9D8EB] hover:text-white'
                }`}
              >
                {t.modals.auth.tabRegister}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
                className={`rounded-lg py-2 text-xs font-semibold transition-all ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-[#0879B9] to-[#00D9FF]/80 text-white shadow-sm'
                    : 'text-[#B9D8EB] hover:text-white'
                }`}
              >
                {t.modals.auth.tabLogin}
              </button>
            </div>

            {error && (
              <div
                role="alert"
                className="mb-4 rounded-xl border border-rose-400/40 bg-rose-500/15 px-3.5 py-2.5 text-xs text-rose-100"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {mode === 'register' && (
                <>
                  <div>
                    <label htmlFor="auth-name" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                      {t.modals.auth.fullName}
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#00D9FF]" />
                      <input
                        id="auth-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.modals.auth.fullNamePlaceholder}
                        required
                        className="w-full rounded-xl border border-white/22 bg-white/[0.09] pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="auth-workspace" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                      {t.modals.auth.workspaceLabel}
                    </label>
                    <div className="relative">
                      <Building2 className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#22E6D0]" />
                      <input
                        id="auth-workspace"
                        type="text"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        placeholder={t.modals.auth.workspacePlaceholder}
                        className="w-full rounded-xl border border-white/22 bg-white/[0.09] pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                  {t.modals.auth.workEmail}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#00D9FF]" />
                  <input
                    id="auth-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t.modals.auth.emailPlaceholder}
                    required
                    className="w-full rounded-xl border border-white/20 bg-[#03152F]/70 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#00D9FF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-password" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                  {t.modals.auth.password}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8B3DFF]" />
                  <input
                    id="auth-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.modals.auth.passwordPlaceholder}
                    required
                    className="w-full rounded-xl border border-white/20 bg-[#03152F]/70 pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/40 focus:border-[#00D9FF] focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="cta-ocean-gradient mt-2 flex w-full items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] disabled:opacity-60"
              >
                <span>
                  {loading
                    ? t.modals.auth.preparing
                    : mode === 'register'
                    ? t.modals.auth.startFreeBtn
                    : t.modals.auth.signInBtn}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            <div className="my-4 flex items-center gap-3">
              <div className="h-px flex-1 bg-white/15" />
              <span className="text-xs text-[#B9D8EB]">{t.modals.auth.orExplore}</span>
              <div className="h-px flex-1 bg-white/15" />
            </div>

            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full border border-[#00D9FF]/40 bg-[#00D9FF]/10 py-2.5 text-sm font-semibold text-[#00D9FF] hover:bg-[#00D9FF]/20 transition-colors disabled:opacity-60"
            >
              <Waves className="h-4 w-4" />
              <span>{t.modals.auth.enterDemoBtn}</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

