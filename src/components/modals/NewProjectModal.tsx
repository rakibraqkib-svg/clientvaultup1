import React, { useState, useEffect } from 'react';
import { X, FolderPlus } from 'lucide-react';
import type { Project, ProjectStatus } from '../../types/vault';
import { validateProjectInput } from '../../utils/vaultLogic';
import { useLanguage } from '../../i18n/LanguageContext';

interface NewProjectModalProps {
  isOpen: boolean;
  editingProject?: Project | null;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    clientName: string;
    clientEmail: string;
    description: string;
    accentColor: Project['accentColor'];
    status: ProjectStatus;
  }) => Promise<void>;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  editingProject,
  onClose,
  onSubmit,
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [description, setDescription] = useState('');
  const [accentColor, setAccentColor] = useState<Project['accentColor']>('cyan');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editingProject) {
      setName(editingProject.name);
      setClientName(editingProject.clientName);
      setClientEmail(editingProject.clientEmail);
      setDescription(editingProject.description);
      setAccentColor(editingProject.accentColor);
      setStatus(editingProject.status);
    } else {
      setName('');
      setClientName('');
      setClientEmail('');
      setDescription('');
      setAccentColor('cyan');
      setStatus('active');
    }
    setError(null);
  }, [editingProject, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateProjectInput({ name, clientName, clientEmail });
    if (validation) {
      setError(validation);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSubmit({ name, clientName, clientEmail, description, accentColor, status });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save project.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06285A]/55 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="project-modal-title"
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
            <FolderPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 id="project-modal-title" className="text-xl font-display font-bold">
              {editingProject ? t.modals.newProject.editTitle : t.modals.newProject.createTitle}
            </h2>
            <p className="text-xs text-[#B9D8EB]">{t.modals.newProject.subtitle}</p>
          </div>
        </div>

        {error && (
          <div role="alert" className="mb-4 rounded-xl border border-rose-400/40 bg-rose-500/15 px-3.5 py-2 text-xs text-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="proj-name" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                {t.modals.newProject.projectName}
              </label>
              <input
                id="proj-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="RAKIB Brand Launch 2026"
                required
                className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="proj-client" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                {t.modals.newProject.clientName}
              </label>
              <input
                id="proj-client"
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Coral Reef Studio"
                required
                className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="proj-email" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                {t.modals.newProject.clientEmail}
              </label>
              <input
                id="proj-email"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                placeholder="client@company.com"
                className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="proj-status" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                {t.modals.newProject.status}
              </label>
              <select
                id="proj-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                className="w-full rounded-xl border border-white/22 bg-[#0A3A7A]/85 px-3.5 py-2.5 text-sm text-white focus:border-[#00D9FF] focus:outline-none"
              >
                <option value="active">{t.projectsView.statusLabels.active}</option>
                <option value="review">{t.projectsView.statusLabels.review}</option>
                <option value="delivered">{t.projectsView.statusLabels.delivered}</option>
                <option value="archived">{t.projectsView.statusLabels.archived}</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="proj-desc" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
              {t.modals.newProject.scope}
            </label>
            <textarea
              id="proj-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Packaging mockups, typography specifications, and launch deliverables..."
              className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
            />
          </div>

          <div>
            <span className="block text-xs font-medium text-[#B9D8EB] mb-2">
              {t.modals.newProject.accentGlow}
            </span>
            <div className="flex items-center gap-2.5">
              {(['cyan', 'turquoise', 'purple', 'blue'] as const).map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setAccentColor(color)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold capitalize border transition-all ${
                    accentColor === color
                      ? 'border-[#00D9FF] bg-[#00D9FF]/20 text-white'
                      : 'border-white/15 bg-white/5 text-[#B9D8EB] hover:bg-white/10'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

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
              {saving
                ? t.common.saving
                : editingProject
                ? t.common.save
                : t.modals.newProject.createBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

