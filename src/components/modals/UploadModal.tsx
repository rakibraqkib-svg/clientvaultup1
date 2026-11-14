import React, { useEffect, useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';
import type { Project } from '../../types/vault';
import { formatBytes } from '../../utils/vaultLogic';
import { useLanguage } from '../../i18n/LanguageContext';

interface UploadModalProps {
  isOpen: boolean;
  projects: Project[];
  defaultProjectId?: string | null;
  onClose: () => void;
  onUploadFile: (payload: {
    name: string;
    mimeType: string;
    size: number;
    projectId: string | null;
    description: string;
    contentBase64?: string;
    textPreview?: string;
  }) => Promise<void>;
}

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read selected file.'));
    reader.readAsDataURL(file);
  });
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  projects,
  defaultProjectId = null,
  onClose,
  onUploadFile,
}) => {
  const { t } = useLanguage();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [projectId, setProjectId] = useState<string>(defaultProjectId || '');
  const [description, setDescription] = useState('');
  const [quickBriefName, setQuickBriefName] = useState('');
  const [quickBriefBody, setQuickBriefBody] = useState('');
  const [mode, setMode] = useState<'upload' | 'note'>('upload');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setProjectId(defaultProjectId || '');
      setError(null);
      setProgress(0);
    }
  }, [isOpen, defaultProjectId]);

  if (!isOpen) return null;

  const handleFilePick = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    setSelectedFiles(Array.from(filesList));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'upload') {
      if (selectedFiles.length === 0) {
        setError(t.frontUpload.selectOneError);
        return;
      }
      setUploading(true);
      try {
        for (let i = 0; i < selectedFiles.length; i += 1) {
          const f = selectedFiles[i];
          setProgress(Math.round(((i + 0.3) / selectedFiles.length) * 100));
          const contentBase64 = await readFileAsBase64(f);
          await onUploadFile({
            name: f.name,
            mimeType: f.type || 'application/octet-stream',
            size: f.size,
            projectId: projectId || null,
            description: description.trim() || 'Uploaded client deliverable',
            contentBase64,
          });
          setProgress(Math.round(((i + 1) / selectedFiles.length) * 100));
        }
        setSelectedFiles([]);
        setDescription('');
        setProgress(0);
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed.');
      } finally {
        setUploading(false);
      }
    } else {
      if (quickBriefName.trim().length < 2) {
        setError('Please enter a document filename.');
        return;
      }
      if (quickBriefBody.trim().length < 4) {
        setError('Please enter document content.');
        return;
      }
      setUploading(true);
      try {
        const finalName = quickBriefName.trim().includes('.')
          ? quickBriefName.trim()
          : `${quickBriefName.trim()}.md`;
        const encoded = btoa(unescape(encodeURIComponent(quickBriefBody)));
        await onUploadFile({
          name: finalName,
          mimeType: 'text/markdown',
          size: quickBriefBody.length,
          projectId: projectId || null,
          description: description.trim() || 'Client brief created in ClientVault',
          contentBase64: `data:text/markdown;base64,${encoded}`,
          textPreview: quickBriefBody,
        });
        setQuickBriefName('');
        setQuickBriefBody('');
        setDescription('');
        onClose();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create brief.');
      } finally {
        setUploading(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#06285A]/55 backdrop-blur-md">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-modal-title"
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

        <h2 id="upload-modal-title" className="text-xl font-display font-bold">
          {t.modals.upload.title}
        </h2>
        <p className="mt-1 text-xs text-[#B9D8EB]">{t.modals.upload.subtitle}</p>

        <div className="mt-4 grid grid-cols-2 gap-1 rounded-xl bg-white/8 p-1 border border-white/12">
          <button
            type="button"
            onClick={() => {
              setMode('upload');
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === 'upload' ? 'bg-[#0879B9] text-white' : 'text-[#B9D8EB] hover:text-white'
            }`}
          >
            {t.modals.upload.tabUpload}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('note');
              setError(null);
            }}
            className={`rounded-lg py-2 text-xs font-semibold transition-all ${
              mode === 'note' ? 'bg-[#0879B9] text-white' : 'text-[#B9D8EB] hover:text-white'
            }`}
          >
            {t.modals.upload.tabBrief}
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-rose-400/40 bg-rose-500/15 px-3.5 py-2 text-xs text-rose-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {mode === 'upload' ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFilePick(e.dataTransfer.files);
              }}
              className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                isDragging
                  ? 'border-[#00D9FF] bg-[#00D9FF]/10'
                  : 'border-white/28 bg-white/[0.07] hover:border-[#00D9FF]/70'
              }`}
            >
              <input
                ref={inputRef}
                id="vault-file-input"
                type="file"
                multiple
                className="sr-only"
                onChange={(e) => {
                  handleFilePick(e.target.files);
                  e.target.value = '';
                }}
              />
              <UploadCloud className="mx-auto h-10 w-10 text-[#00D9FF]" />
              <p className="mt-2.5 text-sm font-semibold text-white">{t.modals.upload.dropPrompt}</p>
              <p className="mt-1 text-xs text-[#B9D8EB]">{t.modals.upload.dropTypes}</p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="mt-4 rounded-full border border-[#00D9FF]/45 bg-[#00D9FF]/15 px-5 py-2 text-xs font-semibold text-[#00D9FF] hover:bg-[#00D9FF]/25 transition-colors"
              >
                {t.modals.upload.browseBtn}
              </button>

              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-1.5 text-left">
                  {selectedFiles.map((f) => (
                    <div
                      key={`${f.name}-${f.size}`}
                      className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs"
                    >
                      <span className="inline-flex items-center gap-2 truncate text-white">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#22E6D0]" />
                        <span className="truncate">{f.name}</span>
                      </span>
                      <span className="tabular-nums text-[#B9D8EB] shrink-0 ml-2">
                        {formatBytes(f.size)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label htmlFor="brief-filename" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                  {t.modals.upload.docName}
                </label>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#00D9FF]" />
                  <input
                    id="brief-filename"
                    type="text"
                    value={quickBriefName}
                    onChange={(e) => setQuickBriefName(e.target.value)}
                    placeholder="Deliverable-Notes.md"
                    className="w-full rounded-xl border border-white/22 bg-white/[0.09] pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="brief-content" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                  {t.modals.upload.docContent}
                </label>
                <textarea
                  id="brief-content"
                  rows={5}
                  value={quickBriefBody}
                  onChange={(e) => setQuickBriefBody(e.target.value)}
                  placeholder="# Project Deliverable Summary&#10;- Print specs&#10;- Client approval checklist"
                  className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm font-mono text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label htmlFor="upload-project" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                {t.modals.upload.assignProject}
              </label>
              <select
                id="upload-project"
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
              <label htmlFor="upload-desc" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                {t.modals.upload.deliverableNote}
              </label>
              <input
                id="upload-desc"
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t.modals.upload.notePlaceholder}
                className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
              />
            </div>
          </div>

          {uploading && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-[#22E6D0]">
                <span>{t.modals.upload.encrypting}</span>
                <span className="tabular-nums">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#8B3DFF] via-[#0879B9] to-[#00D9FF] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

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
              disabled={uploading}
              className="cta-ocean-gradient rounded-full px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {uploading
                ? t.modals.upload.uploadingBtn
                : mode === 'upload'
                ? t.modals.upload.uploadFilesBtn
                : t.modals.upload.saveDocBtn}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

