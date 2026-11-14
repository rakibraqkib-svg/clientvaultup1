import React, { useEffect, useState } from 'react';
import { X, Edit3 } from 'lucide-react';
import type { Project, VaultFile } from '../../types/vault';
import { useLanguage } from '../../i18n/LanguageContext';

interface EditFileModalProps {
  file: VaultFile | null;
  projects: Project[];
  onClose: () => void;
  onSave: (
    fileId: string,
    payload: { name: string; projectId: string | null; description: string }
  ) => Promise<void>;
}

export const EditFileModal: React.FC<EditFileModalProps> = ({
  file,
  projects,
  onClose,
  onSave,
}) => {
  const { t, lang } = useLanguage();
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (file) {
      setName(file.name);
      setProjectId(file.projectId || '');
      setDescription(file.description || '');
      setError(null);
    }
  }, [file]);

  if (!file) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 1) {
      setError(lang === 'bn' ? 'ফাইলের নাম লিখুন।' : 'Please enter a valid file name.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(file.id, {
        name: trimmedName,
        projectId: projectId || null,
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : lang === 'bn'
          ? 'ফাইল আপডেট করা যায়নি।'
          : 'Unable to update file details.'
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
        aria-labelledby="edit-file-modal-title"
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
            <Edit3 className="h-5 w-5" />
          </div>
          <div>
            <h2 id="edit-file-modal-title" className="text-xl font-display font-bold">
              {t.modals.editFile.title}
            </h2>
            <p className="text-xs text-[#B9D8EB]">{t.modals.editFile.subtitle}</p>
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
            <label htmlFor="edit-file-name" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
              {t.modals.editFile.fileName}
            </label>
            <input
              id="edit-file-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm text-white focus:border-[#00D9FF] focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="edit-file-project" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
              {t.modals.upload.assignProject}
            </label>
            <select
              id="edit-file-project"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full rounded-xl border border-white/22 bg-[#0A3A7A]/85 px-3.5 py-2.5 text-sm text-white focus:border-[#00D9FF] focus:outline-none"
            >
              <option value="">{t.modals.upload.unassignedFiles}</option>
              {projects.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="edit-file-desc" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
              {t.modals.upload.deliverableNote}
            </label>
            <textarea
              id="edit-file-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm text-white focus:border-[#00D9FF] focus:outline-none"
            />
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
              {saving ? t.common.saving : t.common.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
