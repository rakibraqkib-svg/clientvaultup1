import React, { useEffect, useState } from 'react';
import { Save, ShieldCheck, CheckCircle2 } from 'lucide-react';
import type { ExpiryPreset, UserProfile, WorkspaceSettings } from '../../types/vault';
import { useLanguage } from '../../i18n/LanguageContext';

interface SettingsViewProps {
  user: UserProfile;
  onSaveSettings: (payload: {
    name: string;
    role: string;
    settings: Partial<WorkspaceSettings>;
  }) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ user, onSaveSettings }) => {
  const { t } = useLanguage();
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [workspaceName, setWorkspaceName] = useState(user.settings.workspaceName);
  const [defaultShareExpiry, setDefaultShareExpiry] = useState<ExpiryPreset>(
    user.settings.defaultShareExpiry
  );
  const [requirePasswordByDefault, setRequirePasswordByDefault] = useState(
    user.settings.requirePasswordByDefault
  );
  const [emailNotifications, setEmailNotifications] = useState(user.settings.emailNotifications);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user.settings.twoFactorEnabled);
  const [saving, setSaving] = useState(false);
  const [savedBanner, setSavedBanner] = useState(false);

  useEffect(() => {
    setName(user.name);
    setRole(user.role);
    setWorkspaceName(user.settings.workspaceName);
    setDefaultShareExpiry(user.settings.defaultShareExpiry);
    setRequirePasswordByDefault(user.settings.requirePasswordByDefault);
    setEmailNotifications(user.settings.emailNotifications);
    setTwoFactorEnabled(user.settings.twoFactorEnabled);
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedBanner(false);
    try {
      await onSaveSettings({
        name,
        role,
        settings: {
          workspaceName,
          defaultShareExpiry,
          requirePasswordByDefault,
          emailNotifications,
          twoFactorEnabled,
        },
      });
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">{t.settingsView.title}</h2>
        <p className="text-xs text-[#B9D8EB]">{t.settingsView.subtitle}</p>
      </div>

      <form onSubmit={handleSubmit} className="ocean-glass neon-cyan-border rounded-3xl p-7 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="settings-name" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
              {t.settingsView.yourName}
            </label>
            <input
              id="settings-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm text-white focus:border-[#00D9FF] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="settings-role" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
              {t.settingsView.roleTitle}
            </label>
            <input
              id="settings-role"
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm text-white focus:border-[#00D9FF] focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="settings-workspace" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
              {t.settingsView.workspaceName}
            </label>
            <input
              id="settings-workspace"
              type="text"
              required
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm text-white focus:border-[#00D9FF] focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="settings-expiry" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
              {t.settingsView.defaultExpiry}
            </label>
            <select
              id="settings-expiry"
              value={defaultShareExpiry}
              onChange={(e) => setDefaultShareExpiry(e.target.value as ExpiryPreset)}
              className="w-full rounded-xl border border-white/22 bg-[#0A3A7A]/85 px-3.5 py-2.5 text-sm text-white focus:border-[#00D9FF] focus:outline-none"
            >
              <option value="24h">{t.settingsView.expiry24h}</option>
              <option value="7d">{t.settingsView.expiry7d}</option>
              <option value="30d">{t.settingsView.expiry30d}</option>
              <option value="never">{t.settingsView.expiryNever}</option>
            </select>
          </div>
        </div>

        <div className="space-y-3 border-t border-white/12 pt-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <ShieldCheck className="h-4 w-4 text-[#00D9FF]" />
            <span>{t.settingsView.securityTitle}</span>
          </div>

          <label className="flex items-center justify-between rounded-2xl border border-white/18 bg-white/[0.08] px-4 py-3 text-sm cursor-pointer">
            <span className="text-[#E2F2FC]">{t.settingsView.reqPassword}</span>
            <input
              type="checkbox"
              checked={requirePasswordByDefault}
              onChange={(e) => setRequirePasswordByDefault(e.target.checked)}
              className="h-4 w-4 accent-[#00D9FF]"
            />
          </label>

          <label className="flex items-center justify-between rounded-2xl border border-white/18 bg-white/[0.08] px-4 py-3 text-sm cursor-pointer">
            <span className="text-[#E2F2FC]">{t.settingsView.emailNotif}</span>
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="h-4 w-4 accent-[#00D9FF]"
            />
          </label>

          <label className="flex items-center justify-between rounded-2xl border border-white/18 bg-white/[0.08] px-4 py-3 text-sm cursor-pointer">
            <span className="text-[#E2F2FC]">{t.settingsView.twoFactor}</span>
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              className="h-4 w-4 accent-[#00D9FF]"
            />
          </label>
        </div>

        {savedBanner && (
          <div
            role="status"
            className="flex items-center gap-2 rounded-xl border border-[#22E6D0]/45 bg-[#22E6D0]/15 px-4 py-2.5 text-xs font-medium text-[#22E6D0]"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{t.settingsView.savedBanner}</span>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="cta-ocean-gradient inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? t.common.saving : t.settingsView.savePreferences}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

