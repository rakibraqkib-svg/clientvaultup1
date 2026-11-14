import { useCallback, useEffect, useState } from 'react';
import { OceanAtmosphere } from './components/OceanAtmosphere';
import { LandingPage } from './components/LandingPage';
import { DashboardShell } from './components/dashboard/DashboardShell';
import { ClientPortalView } from './components/portal/ClientPortalView';
import { AuthModal } from './components/modals/AuthModal';
import { WatchDemoModal } from './components/modals/WatchDemoModal';
import { LegalModal } from './components/modals/LegalModal';
import { UploadModal } from './components/modals/UploadModal';
import { FilePreviewModal } from './components/modals/FilePreviewModal';
import { ShareModal } from './components/modals/ShareModal';
import { EditFileModal } from './components/modals/EditFileModal';
import { useLanguage } from './i18n/LanguageContext';
import {
  createShareLink,
  fetchVaultState,
  getStoredToken,
  loginWithDemo,
  setStoredToken,
  updateVaultFile,
  uploadVaultFile,
} from './services/api';
import type { VaultFile, VaultStatePayload } from './types/vault';

export default function App() {
  const [view, setView] = useState<'landing' | 'dashboard' | 'portal'>('landing');
  const [portalToken, setPortalToken] = useState<string | null>(null);
  const [vault, setVault] = useState<VaultStatePayload | null>(null);
  const [loadingVault, setLoadingVault] = useState(false);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [demoModalOpen, setDemoModalOpen] = useState(false);
  const [legalDoc, setLegalDoc] = useState<'privacy' | 'terms' | null>(null);

  const { t } = useLanguage();
  const [frontUploadOpen, setFrontUploadOpen] = useState(false);
  const [frontPreviewFile, setFrontPreviewFile] = useState<VaultFile | null>(null);
  const [frontEditFile, setFrontEditFile] = useState<VaultFile | null>(null);
  const [frontShareFile, setFrontShareFile] = useState<VaultFile | null>(null);

  const loadVault = useCallback(async () => {
    setLoadingVault(true);
    try {
      const state = await fetchVaultState();
      setVault(state);
      return state;
    } finally {
      setLoadingVault(false);
    }
  }, []);

  const ensureAuthenticatedVault = useCallback(async (): Promise<VaultStatePayload> => {
    if (!getStoredToken()) {
      await loginWithDemo();
    }
    try {
      return await loadVault();
    } catch {
      await loginWithDemo();
      return await loadVault();
    }
  }, [loadVault]);

  const enterDashboard = useCallback(async () => {
    await ensureAuthenticatedVault();
    setView('dashboard');
  }, [ensureAuthenticatedVault]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const portalParam = params.get('portal');
    const autostart = params.get('autostart');

    if (portalParam) {
      setPortalToken(portalParam);
      setView('portal');
      return;
    }

    if (autostart === '1') {
      void enterDashboard();
      return;
    }

    const token = getStoredToken();
    if (token) {
      loadVault().catch(() => {
        setStoredToken(null);
      });
    }
  }, [enterDashboard, loadVault]);

  const handleOpenPortal = (token: string) => {
    setPortalToken(token);
    setView('portal');
    const url = new URL(window.location.href);
    url.searchParams.set('portal', token);
    window.history.replaceState({}, '', url.toString());
  };

  const handleExitPortal = () => {
    setPortalToken(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('portal');
    window.history.replaceState({}, '', url.toString());
    setView(vault ? 'dashboard' : 'landing');
  };

  const handleSignOut = () => {
    setStoredToken(null);
    setVault(null);
    setView('landing');
  };

  const handleFrontUploadFile = async (payload: {
    name: string;
    mimeType: string;
    size: number;
    projectId: string | null;
    description?: string;
    contentBase64?: string;
    textPreview?: string;
  }) => {
    await ensureAuthenticatedVault();
    const { file } = await uploadVaultFile(payload);
    await loadVault();
    return file;
  };

  const handleOpenFrontUploadModal = async () => {
    if (!vault) {
      await ensureAuthenticatedVault();
    }
    setFrontUploadOpen(true);
  };

  return (
    <div className="relative min-h-screen bg-[#041536] text-white">
      <OceanAtmosphere subtle={view !== 'landing'} />

      {view === 'portal' && portalToken ? (
        <ClientPortalView token={portalToken} onExitPortal={handleExitPortal} />
      ) : view === 'dashboard' && vault ? (
        <DashboardShell
          vault={vault}
          onVaultChange={setVault}
          onRefreshVault={async () => {
            await loadVault();
          }}
          onOpenPortal={handleOpenPortal}
          onReturnLanding={() => setView('landing')}
          onSignOut={handleSignOut}
        />
      ) : (
        <LandingPage
          vault={vault}
          onOpenAuth={(mode) => {
            setAuthMode(mode);
            setAuthModalOpen(true);
          }}
          onExploreDashboard={() => {
            void enterDashboard();
          }}
          onOpenDemo={() => setDemoModalOpen(true)}
          onOpenSamplePortal={handleOpenPortal}
          onOpenLegal={(doc) => setLegalDoc(doc)}
          onSyncWorkspace={async () => {
            await ensureAuthenticatedVault();
          }}
          onUploadFile={handleFrontUploadFile}
          onOpenUploadModal={() => {
            void handleOpenFrontUploadModal();
          }}
          onPreviewFile={(file) => setFrontPreviewFile(file)}
          onEditFile={(file) => setFrontEditFile(file)}
          onDeleteFile={async (file) => {
            await ensureAuthenticatedVault();
            await updateVaultFile(file.id, { isTrashed: true });
            await loadVault();
          }}
          onShareFile={(file) => setFrontShareFile(file)}
        />
      )}

      {loadingVault && view !== 'dashboard' && (
        <div className="fixed bottom-5 right-5 z-50 ocean-glass neon-cyan-border rounded-2xl px-4 py-2.5 text-xs text-[#22E6D0]">
          {t.common.loadingWorkspace}
        </div>
      )}

      <AuthModal
        isOpen={authModalOpen}
        initialMode={authMode}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={async () => {
          setAuthModalOpen(false);
          await loadVault();
          setView('dashboard');
        }}
      />

      <WatchDemoModal
        isOpen={demoModalOpen}
        onClose={() => setDemoModalOpen(false)}
        onExploreDashboard={() => {
          void enterDashboard();
        }}
      />

      <LegalModal docType={legalDoc} onClose={() => setLegalDoc(null)} />

      <UploadModal
        isOpen={frontUploadOpen}
        projects={vault?.projects || []}
        onClose={() => setFrontUploadOpen(false)}
        onUploadFile={async (payload) => {
          await handleFrontUploadFile(payload);
        }}
      />

      <FilePreviewModal
        file={frontPreviewFile}
        projectName={
          frontPreviewFile && vault
            ? vault.projects.find((p) => p.id === frontPreviewFile.projectId)?.name
            : undefined
        }
        onClose={() => setFrontPreviewFile(null)}
        onToggleFavorite={
          vault
            ? async (f) => {
                await updateVaultFile(f.id, { isFavorite: !f.isFavorite });
                const updated = await loadVault();
                const refreshed = updated.files.find((item) => item.id === f.id) || null;
                setFrontPreviewFile(refreshed);
              }
            : undefined
        }
        onShare={(f) => setFrontShareFile(f)}
      />

      <EditFileModal
        file={frontEditFile}
        projects={vault?.projects || []}
        onClose={() => setFrontEditFile(null)}
        onSave={async (fileId, payload) => {
          await ensureAuthenticatedVault();
          await updateVaultFile(fileId, payload);
          await loadVault();
        }}
      />

      {frontShareFile && (
        <ShareModal
          isOpen={Boolean(frontShareFile)}
          targetType="file"
          targetId={frontShareFile.id}
          targetName={frontShareFile.name}
          onClose={() => setFrontShareFile(null)}
          onCreateShare={async (payload) => {
            await ensureAuthenticatedVault();
            const { share } = await createShareLink(payload);
            await loadVault();
            return share;
          }}
          onOpenPortal={handleOpenPortal}
        />
      )}
    </div>
  );
}
