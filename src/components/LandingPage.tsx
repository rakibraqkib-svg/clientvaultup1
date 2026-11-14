import React, { useState } from 'react';
import {
  ArrowRight,
  Play,
  ShieldCheck,
  Share2,
  FolderKanban,
  Users,
  Briefcase,
  FileCheck2,
  Star,
  Lock,
  UploadCloud,
  Eye,
  HardDrive,
  Clock,
  FolderLock,
  Menu,
  X,
  Check,
  Send,
  Globe,
  ExternalLink,
  FileText,
  Download,
  CheckCircle2,
  Sparkles,
  Edit3,
  Trash2,
} from 'lucide-react';
import { motion } from 'motion/react';
import { ClientVaultLogo } from './ClientVaultLogo';
import { FileThumbnail, LocalFileThumb } from './FileThumbnail';
import { LanguageToggle, useLanguage } from '../i18n/LanguageContext';
import { getAuthorizedFileUrl, submitContactForm } from '../services/api';
import type { VaultFile, VaultStatePayload } from '../types/vault';
import { formatBytes } from '../utils/vaultLogic';
import sampleDeliverableImg from '../assets/images/creative_deliverable_preview_1794641035657.jpg';
import heroTurtleCleanImg from '../assets/images/hero_turtle_clean_1794645239110.jpg';

interface LandingPageProps {
  vault: VaultStatePayload | null;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onExploreDashboard: () => void;
  onOpenDemo: () => void;
  onOpenSamplePortal: (token: string) => void;
  onOpenLegal: (docType: 'privacy' | 'terms') => void;
  onSyncWorkspace: () => Promise<void>;
  onUploadFile: (payload: {
    name: string;
    mimeType: string;
    size: number;
    projectId: string | null;
    description?: string;
    contentBase64?: string;
    textPreview?: string;
  }) => Promise<VaultFile>;
  onOpenUploadModal: () => void;
  onPreviewFile: (file: VaultFile) => void;
  onEditFile: (file: VaultFile) => void;
  onDeleteFile: (file: VaultFile) => Promise<void>;
  onShareFile: (file: VaultFile) => void;
}

const HERO_TURTLE_SRC = heroTurtleCleanImg;
const SAMPLE_DELIVERABLE_SRC = sampleDeliverableImg;

const FEATURE_META = [
  { icon: ShieldCheck, glow: 'cyan' },
  { icon: UploadCloud, glow: 'purple' },
  { icon: Share2, glow: 'cyan' },
  { icon: Lock, glow: 'purple' },
  { icon: FolderKanban, glow: 'cyan' },
  { icon: Eye, glow: 'purple' },
  { icon: HardDrive, glow: 'cyan' },
  { icon: Clock, glow: 'purple' },
] as const;

const STEP_META = [
  { icon: UserPlusIcon, accent: 'from-[#00D9FF]/25 to-[#0879B9]/10', progress: '38%' },
  { icon: UploadCloud, accent: 'from-[#22E6D0]/25 to-[#0879B9]/10', progress: '72%' },
  { icon: ShieldCheck, accent: 'from-[#8B3DFF]/25 to-[#0879B9]/10', progress: '100%' },
] as const;

function UserPlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

export const LandingPage: React.FC<LandingPageProps> = ({
  vault,
  onOpenAuth,
  onExploreDashboard,
  onOpenDemo,
  onOpenSamplePortal,
  onOpenLegal,
  onSyncWorkspace,
  onUploadFile,
  onOpenUploadModal,
  onPreviewFile,
  onEditFile,
  onDeleteFile,
  onShareFile,
}) => {
  const { t, lang } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [portalPreviewTab, setPortalPreviewTab] = useState<'deliverables' | 'password' | 'analytics'>('deliverables');
  const [demoPasscode, setDemoPasscode] = useState('');
  const [demoUnlocked, setDemoUnlocked] = useState(false);
  const [demoPassError, setDemoPassError] = useState<string | null>(null);
  const [billingAnnual, setBillingAnnual] = useState(true);

  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactCompany, setContactCompany] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactStatus, setContactStatus] = useState<'idle' | 'submitting' | 'sent' | 'error'>('idle');
  const [contactFeedback, setContactFeedback] = useState('');

  // Front-page quick file uploader state
  const frontFileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [frontDragging, setFrontDragging] = useState(false);
  const [frontSelectedFiles, setFrontSelectedFiles] = useState<File[]>([]);
  const [frontProjectId, setFrontProjectId] = useState('');
  const [frontNote, setFrontNote] = useState('');
  const [frontUploading, setFrontUploading] = useState(false);
  const [frontProgress, setFrontProgress] = useState(0);
  const [frontStatus, setFrontStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [syncingFrontVault, setSyncingFrontVault] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const readFileBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Could not read file.'));
      reader.readAsDataURL(file);
    });

  const handleFrontUploadSubmit = async (filesToUpload?: File[]) => {
    const queue = filesToUpload && filesToUpload.length > 0 ? filesToUpload : frontSelectedFiles;
    if (queue.length === 0) {
      setFrontStatus({ type: 'error', text: t.frontUpload.selectOneError });
      return;
    }
    setFrontUploading(true);
    setFrontStatus(null);
    setFrontProgress(15);
    try {
      for (let i = 0; i < queue.length; i += 1) {
        const f = queue[i];
        setFrontProgress(Math.round(((i + 0.35) / queue.length) * 100));
        const contentBase64 = await readFileBase64(f);
        await onUploadFile({
          name: f.name,
          mimeType: f.type || 'application/octet-stream',
          size: f.size,
          projectId: frontProjectId || null,
          description: frontNote.trim() || 'Uploaded via ClientVault Front Workspace',
          contentBase64,
        });
        setFrontProgress(Math.round(((i + 1) / queue.length) * 100));
      }
      setFrontSelectedFiles([]);
      setFrontNote('');
      setFrontStatus({
        type: 'success',
        text:
          lang === 'bn'
            ? `${queue.length}টি ফাইল আপনার ভল্টে আপলোড এবং সুরক্ষিত হয়েছে।`
            : `${queue.length} ${queue.length === 1 ? 'file' : 'files'} uploaded and secured in your vault.`,
      });
    } catch (err) {
      setFrontStatus({
        type: 'error',
        text: err instanceof Error ? err.message : 'Upload failed.',
      });
    } finally {
      setFrontUploading(false);
    }
  };

  const activeVaultFiles = vault ? vault.files.filter((f) => !f.isTrashed) : [];

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactStatus('submitting');
    setContactFeedback('');
    try {
      await submitContactForm({
        name: contactName,
        email: contactEmail,
        company: contactCompany,
        message: contactMessage,
      });
      setContactStatus('sent');
      setContactFeedback(t.aboutContact.sentFeedback);
      setContactName('');
      setContactEmail('');
      setContactCompany('');
      setContactMessage('');
    } catch (err) {
      setContactStatus('error');
      setContactFeedback(err instanceof Error ? err.message : 'Unable to send message.');
    }
  };

  const handleDemoUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (demoPasscode.trim() === 'reef2026') {
      setDemoUnlocked(true);
      setDemoPassError(null);
    } else {
      setDemoPassError(t.portalPreview.passErrorHint);
    }
  };

  return (
    <div className="relative z-10 min-h-screen text-white">
      {/* HERO SECTION — Translucent Ocean Glassmorphism Composition */}
      <section id="home" className="relative min-h-[820px] lg:min-h-[870px] overflow-hidden pt-5 sm:pt-7 pb-14">
        {/* SVG objectBoundingBox clipPath for true translucent crystal frosted glass along the exact curved Hero contour */}
        <svg aria-hidden="true" width="0" height="0" className="absolute pointer-events-none">
          <defs>
            <clipPath id="cvHeroGlassClip" clipPathUnits="objectBoundingBox">
              <path d="M 0.0364 0.0062 L 0.9682 0.0062 C 0.9955 0.0062 1.0000 0.0400 0.9682 0.0769 C 0.8205 0.1723 0.6955 0.3200 0.6750 0.5415 C 0.6636 0.6846 0.6955 0.8338 0.7295 0.9231 C 0.7432 0.9677 0.7159 0.9938 0.6841 0.9938 L 0.0364 0.9938 C 0.0159 0.9938 0.0045 0.9723 0.0045 0.9446 L 0.0045 0.0554 C 0.0045 0.0277 0.0159 0.0062 0.0364 0.0062 Z" />
            </clipPath>
          </defs>
        </svg>

        {/* Clean Razor-Sharp Underwater 3D Sea Turtle Scene Backdrop — positioned so outstretched left flipper tucks behind glass while head/shell stay clear */}
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <img
            src={HERO_TURTLE_SRC}
            alt="ClientVault underwater ocean scene with 3D sea turtle mascot"
            className="h-full w-full object-cover object-[66%_42%] lg:object-[100%_24%] opacity-100"
          />
          {/* Short gentle edge blend only at the very bottom into long-scroll sections */}
          <div
            className="absolute inset-x-0 bottom-0 h-28"
            style={{
              background:
                'linear-gradient(to top, #041536 0%, rgba(4, 21, 54, 0.58) 45%, transparent 100%)',
            }}
          />
          {/* Subtle mobile dark-ocean scrim for crisp text legibility */}
          <div className="lg:hidden absolute inset-0 bg-[#041536]/35" />
          {/* Bottom-left neon purple & bottom-right cyan coral wave accents matching reference */}
          <div className="hidden lg:block absolute bottom-2 -left-16 h-44 w-72 rounded-[100%] bg-gradient-to-tr from-[#8B3DFF]/40 via-[#6A28D9]/20 to-transparent blur-2xl" />
          <div className="hidden lg:block absolute bottom-2 -right-16 h-44 w-72 rounded-[100%] bg-gradient-to-tl from-[#00D9FF]/35 via-[#22E6D0]/18 to-transparent blur-2xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-[1380px] px-4 sm:px-8">
          {/* Mobile Header Bar */}
          <header className="lg:hidden rounded-2xl bg-[#051B44]/72 backdrop-blur-xl px-4 py-3 flex items-center justify-between gap-3 border border-white/22 mb-5 shadow-[0_12px_32px_rgba(2,10,30,0.45)]">
            <a href="#home" aria-label="ClientVault Home" className="shrink-0">
              <ClientVaultLogo size="sm" />
            </a>
            <div className="flex items-center gap-2">
              <LanguageToggle compact />
              <button
                type="button"
                onClick={onExploreDashboard}
                className="cta-ocean-gradient inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold text-white whitespace-nowrap"
              >
                <span>{t.nav.dashboardShort}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                aria-label={mobileMenuOpen ? t.nav.closeMenu : t.nav.openMenu}
                aria-expanded={mobileMenuOpen}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white"
              >
                {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </header>

          {/* Responsive Mobile Nav Drawer */}
          {mobileMenuOpen && (
            <div className="lg:hidden mb-5 ocean-glass rounded-2xl p-4 space-y-2 border border-[#00D9FF]/35">
              {[
                [t.nav.home, '#home'],
                [t.nav.features, '#features'],
                [t.nav.howItWorks, '#how-it-works'],
                [t.nav.pricing, '#pricing'],
                [t.nav.about, '#about'],
                [t.nav.contact, '#contact'],
              ].map(([label, href]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block rounded-xl px-3.5 py-2.5 text-sm font-medium text-[#E2F2FC] hover:bg-white/10"
                >
                  {label}
                </a>
              ))}
            </div>
          )}

          {/* Desktop Floating Right Controls ("EN | বাংলা" + "Explore Dashboard ->") */}
          <div className="relative z-20 hidden lg:flex justify-end items-center gap-3 pt-3 pr-2 pb-2 pointer-events-none">
            <LanguageToggle />
            <button
              type="button"
              onClick={onExploreDashboard}
              className="pointer-events-auto cta-ocean-gradient inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.03] whitespace-nowrap shadow-[0_10px_32px_rgba(0,217,255,0.42)] border border-white/25"
            >
              <span>{t.nav.exploreDashboard}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Prominent Turtle Visual — sharp 3D sea turtle & coral reef */}
          <div className="lg:hidden mb-5 relative h-56 sm:h-64 rounded-3xl overflow-hidden border border-[#00D9FF]/40 bg-[#041536] shadow-[0_18px_45px_rgba(2,12,30,0.55)]">
            <img
              src={HERO_TURTLE_SRC}
              alt="ClientVault 3D Sea Turtle Mascot"
              className="h-full w-full object-cover object-[66%_42%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#041536]/70 via-transparent to-transparent" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
              <span className="ocean-glass-soft rounded-xl px-3 py-1.5 text-[11px] font-semibold text-[#22E6D0] border border-[#00D9FF]/35">
                {t.hero.mobileVaultTag}
              </span>
              <button
                type="button"
                onClick={onOpenUploadModal}
                className="cta-ocean-gradient rounded-xl px-3 py-1.5 text-[11px] font-semibold text-white inline-flex items-center gap-1.5"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>{t.hero.ctaUpload}</span>
              </button>
            </div>
          </div>

          {/* Main Hero Split: Sweeping Curved Glass Panel on Left + Open Unobstructed 3D Turtle on Right */}
          <div className="relative lg:-mt-14 grid grid-cols-1 lg:grid-cols-12 items-stretch gap-6">
            {/* Curved Frosted Glass Hero Frame (matches AquaLife swept-glass geometry) */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="lg:col-span-6 relative"
            >
              {/* Desktop SVG Curved Glass Shell Backdrop & Luminous Cyan-Purple Rim */}
              <div className="relative rounded-[30px] lg:rounded-none p-6 sm:p-9 lg:pt-6 lg:pb-10 lg:pl-10 lg:pr-14 overflow-hidden lg:overflow-visible">
                {/* Mobile/Tablet standard rounded glass card */}
                <div
                  aria-hidden="true"
                  className="lg:hidden absolute inset-0 rounded-[30px] ocean-glass border border-[#00D9FF]/45 shadow-[0_24px_65px_rgba(2,12,30,0.65)]"
                />

                {/* True Translucent Crystal Frosted Glass Backdrop Clipped Exactly Inside Curved Frame */}
                <div
                  aria-hidden="true"
                  style={{
                    clipPath: 'url(#cvHeroGlassClip)',
                    backdropFilter: 'blur(2px) saturate(118%) brightness(1.03)',
                    WebkitBackdropFilter: 'blur(2px) saturate(118%) brightness(1.03)',
                  }}
                  className="hidden lg:block pointer-events-none absolute top-0 left-0 h-[calc(100%+18px)] w-[136%]"
                />

                {/* Desktop curved swept-edge translucent crystal glass & luminous specular rim */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 880 650"
                  preserveAspectRatio="none"
                  className="hidden lg:block pointer-events-none absolute top-0 left-0 h-[calc(100%+18px)] w-[136%] max-w-none drop-shadow-[0_24px_55px_rgba(2,10,30,0.48)]"
                >
                  <defs>
                    <linearGradient id="cvGlassFill" x1="0%" y1="50%" x2="100%" y2="50%">
                      <stop offset="0%" stopColor="rgba(6, 26, 68, 0.34)" />
                      <stop offset="48%" stopColor="rgba(12, 56, 134, 0.22)" />
                      <stop offset="78%" stopColor="rgba(26, 98, 190, 0.14)" />
                      <stop offset="100%" stopColor="rgba(120, 210, 255, 0.10)" />
                    </linearGradient>
                    <linearGradient id="cvGlassBevel" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255, 255, 255, 0.22)" />
                      <stop offset="18%" stopColor="rgba(255, 255, 255, 0.03)" />
                      <stop offset="86%" stopColor="rgba(0, 217, 255, 0.04)" />
                      <stop offset="100%" stopColor="rgba(104, 42, 210, 0.18)" />
                    </linearGradient>
                    <linearGradient id="cvGlassRim" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="rgba(255, 255, 255, 0.88)" />
                      <stop offset="42%" stopColor="rgba(165, 243, 255, 0.96)" />
                      <stop offset="68%" stopColor="rgba(0, 217, 255, 0.95)" />
                      <stop offset="100%" stopColor="rgba(139, 61, 255, 0.86)" />
                    </linearGradient>
                    <radialGradient id="cvGlassGlint" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="rgba(255, 255, 255, 0.95)" />
                      <stop offset="35%" stopColor="rgba(0, 229, 255, 0.55)" />
                      <stop offset="100%" stopColor="rgba(0, 217, 255, 0)" />
                    </radialGradient>
                  </defs>
                  {/* Crystal frosted glass body + subtle inner edge refraction */}
                  <path
                    d="M 32 4 L 852 4 C 876 4 880 26 852 50 C 722 112 612 208 594 352 C 584 445 612 542 642 600 C 654 629 630 646 602 646 L 32 646 C 14 646 4 632 4 614 L 4 36 C 4 18 14 4 32 4 Z"
                    fill="url(#cvGlassFill)"
                  />
                  <path
                    d="M 32 4 L 852 4 C 876 4 880 26 852 50 C 722 112 612 208 594 352 C 584 445 612 542 642 600 C 654 629 630 646 602 646 L 32 646 C 14 646 4 632 4 614 L 4 36 C 4 18 14 4 32 4 Z"
                    fill="url(#cvGlassBevel)"
                    stroke="url(#cvGlassRim)"
                    strokeWidth="2.4"
                  />
                  {/* Specular light flare along the curved right glass shoulder */}
                  <ellipse cx="644" cy="176" rx="22" ry="38" transform="rotate(-34 644 176)" fill="url(#cvGlassGlint)" opacity="0.86" />
                </svg>

                {/* Content inside the Glass Hero Frame */}
                <div className="relative z-10">
                  {/* Integrated Desktop Top Navigation inside the upper glass panel (exact match to AquaLife reference) */}
                  <div className="hidden lg:flex items-center justify-between gap-5 pb-8 w-[112%]">
                    <a href="#home" aria-label="ClientVault Home" className="shrink-0">
                      <ClientVaultLogo size="md" />
                    </a>

                    <nav
                      aria-label="Main navigation"
                      className="flex items-center gap-5 text-[13px] font-medium text-[#B9D8EB]"
                    >
                      <a
                        href="#home"
                        className="text-white border-b-2 border-[#00D9FF] pb-0.5 whitespace-nowrap shrink-0"
                      >
                        {t.nav.home}
                      </a>
                      <a href="#features" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
                        {t.nav.features}
                      </a>
                      <a href="#how-it-works" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
                        {t.nav.howItWorks}
                      </a>
                      <a href="#pricing" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
                        {t.nav.pricing}
                      </a>
                      <a href="#about" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
                        {t.nav.about}
                      </a>
                      <a href="#contact" className="hover:text-white transition-colors whitespace-nowrap shrink-0">
                        {t.nav.contact}
                      </a>
                    </nav>
                  </div>

                  {/* Small Badge */}
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/12 backdrop-blur-md px-4 py-1.5 text-[11px] font-semibold tracking-wider text-[#7CF7EA]">
                    <ShieldCheck className="h-3.5 w-3.5 text-[#00D9FF]" />
                    <span>{t.hero.badge}</span>
                  </div>

                  {/* Main Hero Headline */}
                  <h1 className="mt-5 font-display font-extrabold tracking-tight leading-[1.06] text-4xl sm:text-5xl lg:text-[54px] text-white text-balance max-w-lg drop-shadow-[0_4px_20px_rgba(3,20,54,0.35)]">
                    {t.hero.headlineLine1}
                    <br />
                    {t.hero.headlineLine2}
                    <br />
                    {t.hero.headlinePrefix}
                    <span className="bg-gradient-to-r from-[#00D9FF] via-[#22E6D0] to-[#7CF7EA] bg-clip-text text-transparent">
                      {t.hero.headlineHighlight}
                    </span>
                  </h1>

                  {/* Hero Description */}
                  <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-[#E2F3FD]">
                    {t.hero.description}
                  </p>

                  {/* Hero CTAs */}
                  <div className="mt-7 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenAuth('register')}
                      className="cta-ocean-gradient inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-transform hover:scale-[1.02] whitespace-nowrap"
                    >
                      <span>{t.hero.ctaPrimary}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={onOpenUploadModal}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-[#00D9FF]/60 bg-[#00D9FF]/18 backdrop-blur-md px-5 py-3.5 text-sm font-semibold text-[#9AFBF0] hover:bg-[#00D9FF]/28 transition-colors whitespace-nowrap shadow-[0_0_24px_rgba(0,217,255,0.22)]"
                    >
                      <UploadCloud className="h-4 w-4 text-[#00D9FF]" />
                      <span>{t.hero.ctaUpload}</span>
                    </button>
                    <button
                      type="button"
                      onClick={onOpenDemo}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 backdrop-blur-md px-5 py-3.5 text-sm font-semibold text-white hover:bg-white/18 transition-colors whitespace-nowrap"
                    >
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#00D9FF]/65 bg-[#00D9FF]/20 text-[#00D9FF]">
                        <Play className="h-3 w-3 fill-current ml-0.5" />
                      </span>
                      <span>{t.hero.ctaDemo}</span>
                    </button>
                  </div>

                  {/* 3 Glass Feature Indicators */}
                  <div className="mt-8 max-w-[552px] grid grid-cols-1 sm:grid-cols-3 gap-2.5 rounded-2xl border border-white/20 bg-[#061A44]/48 backdrop-blur-md p-3">
                    <div className="flex items-center gap-2 sm:border-r sm:border-white/15 sm:pr-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#00D9FF]/40 bg-[#00D9FF]/12 text-[#00D9FF]">
                        <FolderLock className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11.5px] font-semibold text-white whitespace-nowrap">{t.hero.pill1Title}</div>
                        <div className="text-[10.5px] text-[#B9D8EB] whitespace-nowrap">{t.hero.pill1Sub}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 sm:border-r sm:border-white/15 sm:pr-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#22E6D0]/40 bg-[#22E6D0]/12 text-[#22E6D0]">
                        <Share2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11.5px] font-semibold text-white whitespace-nowrap">{t.hero.pill2Title}</div>
                        <div className="text-[10.5px] text-[#B9D8EB] whitespace-nowrap">{t.hero.pill2Sub}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#8B3DFF]/45 bg-[#8B3DFF]/15 text-[#C39CFF]">
                        <FolderKanban className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11.5px] font-semibold text-white whitespace-nowrap">{t.hero.pill3Title}</div>
                        <div className="text-[10.5px] text-[#B9D8EB] whitespace-nowrap">{t.hero.pill3Sub}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Right Visual Column: Unobstructed space showcasing the razor-sharp 3D Sea Turtle & Coral Reef */}
            <div className="hidden lg:flex lg:col-span-6 relative min-h-[540px] pointer-events-none" />
          </div>

          {/* HERO BOTTOM STATISTICS BAR */}
          <div className="mt-8 mx-auto max-w-4xl relative z-20">
            <div className="rounded-2xl bg-[#0B255E]/34 backdrop-blur-2xl px-6 py-4 border border-white/28 shadow-[0_20px_50px_rgba(2,10,30,0.42),inset_0_1px_0_rgba(255,255,255,0.28)]">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#8B3DFF]/50 bg-[#8B3DFF]/15 text-[#C39CFF]">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-display font-bold text-white tabular-nums">{t.stats.usersValue}</div>
                    <div className="text-xs text-[#B9D8EB]">{t.stats.usersLabel}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#00D9FF]/50 bg-[#00D9FF]/15 text-[#00D9FF]">
                    <Briefcase className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-display font-bold text-white tabular-nums">{t.stats.projectsValue}</div>
                    <div className="text-xs text-[#B9D8EB]">{t.stats.projectsLabel}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#22E6D0]/50 bg-[#22E6D0]/15 text-[#22E6D0]">
                    <FileCheck2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-display font-bold text-white tabular-nums">{t.stats.filesValue}</div>
                    <div className="text-xs text-[#B9D8EB]">{t.stats.filesLabel}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3.5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-amber-300/45 bg-amber-400/12 text-amber-300">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-display font-bold text-white tabular-nums">{t.stats.ratingValue}</div>
                    <div className="text-xs text-[#B9D8EB]">{t.stats.ratingLabel}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FRONT-PAGE FILE UPLOAD & INSTANT VAULT SECTION */}
      <section id="upload-files" className="relative py-16 px-4 sm:px-8 mx-auto max-w-[1320px]">
        <div className="ocean-glass neon-cyan-border rounded-[32px] p-6 sm:p-9">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/15 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#00D9FF]/40 bg-[#00D9FF]/12 px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#22E6D0]">
                <UploadCloud className="h-3.5 w-3.5 text-[#00D9FF]" />
                <span>{t.frontUpload.badge}</span>
              </div>
              <h2 className="mt-2.5 text-2xl sm:text-3xl font-display font-bold text-white">
                {t.frontUpload.title}
              </h2>
              <p className="mt-1.5 max-w-2xl text-sm text-[#B9D8EB]">
                {t.frontUpload.subtitle}
              </p>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onOpenUploadModal}
                className="inline-flex items-center gap-2 rounded-full border border-[#00D9FF]/45 bg-[#00D9FF]/12 px-4 py-2 text-xs font-semibold text-[#00D9FF] hover:bg-[#00D9FF]/22 transition-colors whitespace-nowrap"
              >
                <UploadCloud className="h-3.5 w-3.5" />
                <span>{t.frontUpload.briefModalBtn}</span>
              </button>
              <button
                type="button"
                onClick={onExploreDashboard}
                className="cta-ocean-gradient inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold text-white whitespace-nowrap"
              >
                <span>{t.frontUpload.dashboardBtn}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
            {/* Left Column: Direct Drag-and-Drop File Uploader */}
            <div className="lg:col-span-5 space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setFrontDragging(true);
                }}
                onDragLeave={() => setFrontDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setFrontDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    setFrontSelectedFiles(Array.from(e.dataTransfer.files));
                    setFrontStatus(null);
                  }
                }}
                className={`rounded-2xl border-2 border-dashed p-6 text-center transition-colors ${
                  frontDragging
                    ? 'border-[#00D9FF] bg-[#00D9FF]/18'
                    : 'border-[#00D9FF]/45 bg-white/[0.07] backdrop-blur-md hover:border-[#00D9FF]/80'
                }`}
              >
                <input
                  ref={frontFileInputRef}
                  id="front-vault-file-input"
                  type="file"
                  multiple
                  aria-label="Choose files to upload to ClientVault"
                  className="sr-only"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setFrontSelectedFiles(Array.from(e.target.files));
                      setFrontStatus(null);
                    }
                    e.target.value = '';
                  }}
                />
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-[#00D9FF]/45 bg-[#00D9FF]/15 text-[#00D9FF] shadow-[0_0_24px_rgba(0,217,255,0.22)]">
                  <UploadCloud className="h-6 w-6" />
                </div>
                <p className="mt-3 text-base font-display font-semibold text-white">
                  {t.frontUpload.dropTitle}
                </p>
                <p className="mt-1 text-xs text-[#B9D8EB]">
                  {t.frontUpload.dropSub}
                </p>
                <button
                  type="button"
                  onClick={() => frontFileInputRef.current?.click()}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#00D9FF]/50 bg-[#00D9FF]/15 px-5 py-2 text-xs font-semibold text-[#00D9FF] hover:bg-[#00D9FF]/25 transition-colors"
                >
                  <span>{t.frontUpload.selectFilesBtn}</span>
                </button>

                {frontSelectedFiles.length > 0 && (
                  <div className="mt-4 space-y-1.5 text-left">
                    {frontSelectedFiles.map((f) => (
                      <div
                        key={`${f.name}-${f.size}`}
                        className="flex items-center justify-between rounded-xl border border-[#22E6D0]/35 bg-[#22E6D0]/10 px-3 py-2 text-xs"
                      >
                        <span className="inline-flex items-center gap-2.5 min-w-0 text-white">
                          <LocalFileThumb file={f} />
                          <span className="truncate font-medium">{f.name}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 tabular-nums text-[#B9D8EB] shrink-0 ml-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#22E6D0]" />
                          {formatBytes(f.size)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="front-upload-project" className="block text-xs font-medium text-[#B9D8EB] mb-1">
                    {t.frontUpload.projectFolderLabel}
                  </label>
                  <select
                    id="front-upload-project"
                    value={frontProjectId}
                    onChange={(e) => setFrontProjectId(e.target.value)}
                    className="w-full rounded-xl border border-white/25 bg-[#0A3A7A]/70 px-3 py-2 text-xs text-white focus:border-[#00D9FF] focus:outline-none"
                  >
                    <option value="">{t.frontUpload.generalVaultOption}</option>
                    {(vault?.projects || []).map((proj) => (
                      <option key={proj.id} value={proj.id}>
                        {proj.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="front-upload-note" className="block text-xs font-medium text-[#B9D8EB] mb-1">
                    {t.frontUpload.noteLabel}
                  </label>
                  <input
                    id="front-upload-note"
                    type="text"
                    value={frontNote}
                    onChange={(e) => setFrontNote(e.target.value)}
                    placeholder={t.frontUpload.notePlaceholder}
                    className="w-full rounded-xl border border-white/25 bg-white/[0.08] px-3 py-2 text-xs text-white placeholder:text-white/45 focus:border-[#00D9FF] focus:outline-none"
                  />
                </div>
              </div>

              {frontUploading && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-[#22E6D0]">
                    <span>{t.frontUpload.uploadingStatus}</span>
                    <span className="tabular-nums">{frontProgress}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#8B3DFF] via-[#0879B9] to-[#00D9FF] transition-all"
                      style={{ width: `${frontProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {frontStatus && (
                <div
                  role={frontStatus.type === 'error' ? 'alert' : 'status'}
                  className={`rounded-xl px-3.5 py-2.5 text-xs ${
                    frontStatus.type === 'success'
                      ? 'border border-[#22E6D0]/45 bg-[#22E6D0]/15 text-[#22E6D0]'
                      : 'border border-rose-400/45 bg-rose-500/15 text-rose-100'
                  }`}
                >
                  {frontStatus.text}
                </div>
              )}

              <button
                type="button"
                disabled={frontUploading}
                onClick={() => void handleFrontUploadSubmit()}
                className="cta-ocean-gradient w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-60 shadow-[0_0_24px_rgba(0,217,255,0.28)]"
              >
                <UploadCloud className="h-4 w-4" />
                <span>{frontUploading ? t.frontUpload.uploadingBtn : t.frontUpload.uploadBtn}</span>
              </button>
            </div>

            {/* Right Column: Live Front-Page Uploaded Files Feed */}
            <div className="lg:col-span-7 rounded-2xl border border-white/22 bg-white/[0.08] backdrop-blur-md p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/12 pb-3.5">
                <div>
                  <h3 className="text-base font-display font-bold text-white">
                    {t.frontUpload.liveTitle}
                  </h3>
                  <p className="text-xs text-[#B9D8EB]">
                    {vault
                      ? `${activeVaultFiles.length} ${
                          activeVaultFiles.length === 1
                            ? t.frontUpload.liveSyncSingular
                            : t.frontUpload.liveSyncPlural
                        }`
                      : t.frontUpload.liveSubtitleEmpty}
                  </p>
                </div>
                {!vault && (
                  <button
                    type="button"
                    disabled={syncingFrontVault}
                    onClick={async () => {
                      setSyncingFrontVault(true);
                      try {
                        await onSyncWorkspace();
                      } finally {
                        setSyncingFrontVault(false);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#22E6D0]/45 bg-[#22E6D0]/12 px-4 py-1.5 text-xs font-semibold text-[#22E6D0] hover:bg-[#22E6D0]/22 transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{syncingFrontVault ? t.frontUpload.syncingBtn : t.frontUpload.showExistingBtn}</span>
                  </button>
                )}
              </div>

              {vault && activeVaultFiles.length > 0 ? (
                <div className="mt-4 space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                  {activeVaultFiles.slice(0, 6).map((file) => {
                    const projectName = vault.projects.find((p) => p.id === file.projectId)?.name;
                    return (
                      <div
                        key={file.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-white/15 bg-white/5 px-4 py-3 hover:border-[#00D9FF]/45 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <FileThumbnail
                            file={file}
                            size="md"
                            onClick={() => onPreviewFile(file)}
                          />
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => onPreviewFile(file)}
                              title={file.name}
                              className="block w-full truncate text-left text-sm font-semibold text-white hover:text-[#00D9FF] transition-colors"
                            >
                              {file.name}
                            </button>
                            <div className="truncate text-[11px] text-[#B9D8EB] tabular-nums">
                              {formatBytes(file.size)} · {projectName || t.common.generalVault}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => onPreviewFile(file)}
                            aria-label={`${t.common.preview} ${file.name}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-[#E2F2FC] hover:bg-white/15"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#00D9FF]" />
                            <span>{t.common.preview}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditFile(file)}
                            aria-label={`${t.common.edit} ${file.name}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-[#E2F2FC] hover:bg-white/15"
                          >
                            <Edit3 className="h-3.5 w-3.5 text-[#22E6D0]" />
                            <span>{t.common.edit}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onShareFile(file)}
                            aria-label={`${t.common.share} ${file.name}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#00D9FF]/35 bg-[#00D9FF]/12 px-2.5 py-1.5 text-xs font-medium text-[#00D9FF] hover:bg-[#00D9FF]/22"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                            <span>{t.common.share}</span>
                          </button>
                          <a
                            href={getAuthorizedFileUrl(file.id, true)}
                            download={file.name}
                            aria-label={`${t.common.download} ${file.name}`}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-[#B9D8EB] hover:bg-white/15 hover:text-white"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </a>
                          <button
                            type="button"
                            disabled={deletingFileId === file.id}
                            onClick={async () => {
                              setDeletingFileId(file.id);
                              try {
                                await onDeleteFile(file);
                              } finally {
                                setDeletingFileId(null);
                              }
                            }}
                            aria-label={`${t.common.delete} ${file.name}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-400/25 bg-rose-500/10 px-2.5 py-1.5 text-xs font-medium text-rose-200 hover:bg-rose-500/25 disabled:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>{t.common.delete}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                  <p className="text-sm font-medium text-white">{t.frontUpload.emptyTitle}</p>
                  <p className="mt-1 text-xs text-[#B9D8EB] max-w-md mx-auto">
                    {t.frontUpload.emptyDesc}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION — 8 Glassmorphism Cards */}
      <section id="features" className="relative py-20 px-4 sm:px-8 mx-auto max-w-[1320px]">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#22E6D0]">
            {t.features.eyebrow}
          </p>
          <h2 className="mt-2.5 text-3xl sm:text-4xl font-display font-bold tracking-tight text-white text-balance">
            {t.features.title}
          </h2>
          <p className="mt-3 text-base text-[#B9D8EB]">
            {t.features.subtitle}
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {t.features.cards.map((feat, idx) => {
            const meta = FEATURE_META[idx];
            const Icon = meta.icon;
            const isCyan = meta.glow === 'cyan';
            return (
              <div
                key={feat.title}
                className={`ocean-glass rounded-2xl p-6 transition-transform duration-200 hover:-translate-y-1 ${
                  isCyan ? 'neon-cyan-border' : 'neon-purple-border'
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-xl border ${
                    isCyan
                      ? 'border-[#00D9FF]/45 bg-[#00D9FF]/15 text-[#00D9FF] shadow-[0_0_24px_rgba(0,217,255,0.22)]'
                      : 'border-[#8B3DFF]/45 bg-[#8B3DFF]/15 text-[#C39CFF] shadow-[0_0_24px_rgba(139,61,255,0.25)]'
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-display font-bold text-white">{feat.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#B9D8EB]">{feat.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* HOW IT WORKS — 3 Ocean Glass Steps */}
      <section id="how-it-works" className="relative py-20 px-4 sm:px-8 mx-auto max-w-[1320px]">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#00D9FF]">
            {t.howItWorks.eyebrow}
          </p>
          <h2 className="mt-2.5 text-3xl sm:text-4xl font-display font-bold tracking-tight text-white text-balance">
            {t.howItWorks.title}
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          {t.howItWorks.steps.map((item, idx) => {
            const meta = STEP_META[idx];
            const Icon = meta.icon;
            return (
              <div
                key={item.step}
                className="ocean-glass neon-cyan-border rounded-3xl p-7 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-sm font-semibold text-[#22E6D0] tabular-nums">
                      {item.step}
                    </span>
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.accent} border border-white/20 text-[#00D9FF]`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <h3 className="mt-6 text-xl font-display font-bold text-white">
                    {item.step} – {item.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-relaxed text-[#B9D8EB]">{item.description}</p>
                </div>

                <div className="mt-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00D9FF] to-[#8B3DFF]"
                    style={{ width: meta.progress }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* INTERACTIVE CLIENT PORTAL PREVIEW */}
      <section id="portal-preview" className="relative py-20 px-4 sm:px-8 mx-auto max-w-[1320px]">
        <div className="ocean-glass neon-cyan-border rounded-[32px] p-6 sm:p-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/15 pb-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-[#22E6D0]">
                {t.portalPreview.eyebrow}
              </p>
              <h2 className="mt-2 text-3xl sm:text-4xl font-display font-bold text-white">
                {t.portalPreview.title}
              </h2>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-[#B9D8EB]">
                {t.portalPreview.subtitle}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(
                [
                  ['deliverables', t.portalPreview.tabDeliverables],
                  ['password', t.portalPreview.tabPassword],
                  ['analytics', t.portalPreview.tabAnalytics],
                ] as const
              ).map(([tabKey, label]) => (
                <button
                  key={tabKey}
                  type="button"
                  onClick={() => setPortalPreviewTab(tabKey)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all whitespace-nowrap ${
                    portalPreviewTab === tabKey
                      ? 'bg-[#00D9FF]/20 text-[#00D9FF] border border-[#00D9FF]/55'
                      : 'bg-white/5 text-[#B9D8EB] border border-white/15 hover:bg-white/10'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-1 lg:grid-cols-12 gap-7 items-center">
            {portalPreviewTab === 'deliverables' && (
              <>
                <div className="lg:col-span-6 overflow-hidden rounded-2xl border border-white/22 bg-white/[0.08]">
                  <img
                    src={SAMPLE_DELIVERABLE_SRC}
                    alt="Aether Botanicals packaging deliverable preview"
                    referrerPolicy="no-referrer"
                    className="h-72 w-full object-cover"
                  />
                </div>
                <div className="lg:col-span-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-[#22E6D0]">{t.portalPreview.studioName}</div>
                      <h3 className="text-2xl font-display font-bold text-white">
                        {t.portalPreview.sampleTitle}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-[#B9D8EB] tabular-nums">{t.portalPreview.sampleMeta}</span>
                  </div>
                  <p className="text-sm text-[#B9D8EB]">
                    {t.portalPreview.sampleDesc}
                  </p>
                  <div className="space-y-2.5">
                    {[
                      ['Aether-Packaging-Hero-4K.jpg', '4.8 MB'],
                      ['Aether-Brand-Guidelines-v3.md', '24.8 KB'],
                    ].map(([fname, fsize]) => (
                      <div
                        key={fname}
                        className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-white truncate">{fname}</span>
                        <span className="text-xs font-mono text-[#B9D8EB] tabular-nums ml-3">{fsize}</span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-2 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => onOpenSamplePortal('aether-launch-2026')}
                      className="cta-ocean-gradient inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-white"
                    >
                      <span>{t.portalPreview.openLivePortal}</span>
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {portalPreviewTab === 'password' && (
              <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="rounded-2xl border border-[#8B3DFF]/45 bg-white/[0.08] backdrop-blur-xl p-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#8B3DFF]/20 border border-[#8B3DFF]/50 text-[#C39CFF]">
                      <Lock className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-display font-bold text-white">
                        {demoUnlocked ? t.portalPreview.unlockedTitle : t.portalPreview.lockedTitle}
                      </h3>
                      <p className="text-xs text-[#B9D8EB]">
                        {demoUnlocked
                          ? t.portalPreview.unlockedSub
                          : t.portalPreview.lockedSub}
                      </p>
                    </div>
                  </div>

                  {!demoUnlocked ? (
                    <form onSubmit={handleDemoUnlock} className="mt-5 space-y-3">
                      <label htmlFor="preview-passcode" className="block text-xs text-[#B9D8EB]">
                        {t.portalPreview.passcodeLabel}
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="preview-passcode"
                          type="password"
                          value={demoPasscode}
                          onChange={(e) => setDemoPasscode(e.target.value)}
                          placeholder={t.portalPreview.passcodePlaceholder}
                          className="flex-1 rounded-xl border border-white/22 bg-white/[0.10] px-3.5 py-2.5 text-sm text-white placeholder:text-white/50 focus:border-[#00D9FF] focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="cta-ocean-gradient rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
                        >
                          {t.portalPreview.unlockBtn}
                        </button>
                      </div>
                      {demoPassError && <p className="text-xs text-amber-300">{demoPassError}</p>}
                    </form>
                  ) : (
                    <div className="mt-5 flex items-center justify-between rounded-xl border border-[#22E6D0]/40 bg-[#22E6D0]/10 p-4">
                      <span className="text-sm font-medium text-white">
                        Pelagic Marine — Confidential Review Pack
                      </span>
                      <button
                        type="button"
                        onClick={() => onOpenSamplePortal('pelagic-review-vault')}
                        className="text-xs font-semibold text-[#00D9FF] hover:underline"
                      >
                        {t.portalPreview.launchFullPortal}
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-3 text-sm text-[#B9D8EB]">
                  <h4 className="text-xl font-display font-bold text-white">
                    {t.portalPreview.zeroFrictionTitle}
                  </h4>
                  <p>
                    {t.portalPreview.zeroFrictionDesc}
                  </p>
                  <button
                    type="button"
                    onClick={() => onOpenSamplePortal('pelagic-review-vault')}
                    className="inline-flex items-center gap-2 rounded-full border border-[#00D9FF]/45 bg-[#00D9FF]/10 px-5 py-2.5 text-xs font-semibold text-[#00D9FF] hover:bg-[#00D9FF]/20"
                  >
                    <span>{t.portalPreview.testLockedPortal}</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}

            {portalPreviewTab === 'analytics' && (
              <div className="lg:col-span-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                {t.portalPreview.analyticsCards.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/20 bg-white/[0.08] backdrop-blur-xl p-5">
                    <div className="text-xs font-semibold text-[#22E6D0]">{stat.label}</div>
                    <div className="mt-2 text-xl font-display font-bold text-white tabular-nums">
                      {stat.value}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-[#B9D8EB]">{stat.detail}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="relative py-20 px-4 sm:px-8 mx-auto max-w-[1320px]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#00D9FF]">
              {t.pricing.eyebrow}
            </p>
            <h2 className="mt-2 text-3xl sm:text-4xl font-display font-bold text-white">
              {t.pricing.title}
            </h2>
          </div>

          <div className="inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/8 p-1 self-start">
            <button
              type="button"
              onClick={() => setBillingAnnual(false)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                !billingAnnual ? 'bg-[#0879B9] text-white' : 'text-[#B9D8EB]'
              }`}
            >
              {t.pricing.monthly}
            </button>
            <button
              type="button"
              onClick={() => setBillingAnnual(true)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold transition-colors ${
                billingAnnual ? 'bg-[#0879B9] text-white' : 'text-[#B9D8EB]'
              }`}
            >
              {t.pricing.annual}
            </button>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { ...t.pricing.tiers[0], price: 0, highlighted: false },
            { ...t.pricing.tiers[1], price: billingAnnual ? 19 : 24, highlighted: true },
            { ...t.pricing.tiers[2], price: billingAnnual ? 49 : 59, highlighted: false },
          ].map((tier) => (
            <div
              key={tier.name}
              className={`ocean-glass rounded-3xl p-7 flex flex-col justify-between ${
                tier.highlighted ? 'neon-cyan-border ring-1 ring-[#00D9FF]/40' : 'border border-white/18'
              }`}
            >
              <div>
                <div className="text-xs font-semibold text-[#22E6D0]">{tier.audience}</div>
                <h3 className="mt-1.5 text-2xl font-display font-bold text-white">{tier.name}</h3>
                <div className="mt-4 flex items-baseline gap-1.5">
                  <span className="text-4xl font-display font-extrabold text-white tabular-nums">
                    ${tier.price}
                  </span>
                  <span className="text-sm text-[#B9D8EB]">{t.pricing.perMonth}</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-[#B9D8EB]">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-center gap-2.5">
                      <Check className="h-4 w-4 shrink-0 text-[#00D9FF]" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                type="button"
                onClick={() => onOpenAuth('register')}
                className={`mt-8 w-full rounded-full py-3 text-sm font-semibold transition-transform hover:scale-[1.01] ${
                  tier.highlighted
                    ? 'cta-ocean-gradient text-white'
                    : 'border border-white/25 bg-white/8 text-white hover:bg-white/15'
                }`}
              >
                {tier.price === 0 ? t.pricing.startFree : t.pricing.choosePlan}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT & CONTACT SECTION */}
      <section id="about" className="relative py-20 px-4 sm:px-8 mx-auto max-w-[1320px]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-5 space-y-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#22E6D0]">
              {t.aboutContact.eyebrow}
            </p>
            <h2 className="text-3xl sm:text-4xl font-display font-bold text-white text-balance">
              {t.aboutContact.title}
            </h2>
            <p className="text-base leading-relaxed text-[#B9D8EB]">
              {t.aboutContact.desc}
            </p>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="ocean-glass rounded-2xl p-4 border border-white/15">
                <div className="text-2xl font-display font-bold text-[#00D9FF] tabular-nums">99.98%</div>
                <div className="mt-1 text-xs text-[#B9D8EB]">{t.aboutContact.uptimeLabel}</div>
              </div>
              <div className="ocean-glass rounded-2xl p-4 border border-white/15">
                <div className="text-2xl font-display font-bold text-[#22E6D0] tabular-nums">AES-256</div>
                <div className="mt-1 text-xs text-[#B9D8EB]">{t.aboutContact.encryptionLabel}</div>
              </div>
            </div>
          </div>

          <div id="contact" className="lg:col-span-7 ocean-glass neon-purple-border rounded-3xl p-7 sm:p-8">
            <h3 className="text-2xl font-display font-bold text-white">{t.aboutContact.contactTitle}</h3>
            <p className="mt-1 text-sm text-[#B9D8EB]">
              {t.aboutContact.contactSub}
            </p>

            <form onSubmit={handleContactSubmit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contact-name" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                    {t.aboutContact.yourName}
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder={t.aboutContact.namePlaceholder}
                    className="w-full rounded-xl border border-white/25 bg-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder:text-white/45 focus:border-[#00D9FF] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                    {t.aboutContact.emailAddress}
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder={t.aboutContact.emailPlaceholder}
                    className="w-full rounded-xl border border-white/25 bg-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder:text-white/45 focus:border-[#00D9FF] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="contact-company" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                  {t.aboutContact.companyOptional}
                </label>
                <input
                  id="contact-company"
                  type="text"
                  value={contactCompany}
                  onChange={(e) => setContactCompany(e.target.value)}
                  placeholder={t.aboutContact.companyPlaceholder}
                  className="w-full rounded-xl border border-white/25 bg-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder:text-white/45 focus:border-[#00D9FF] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="contact-message" className="block text-xs font-medium text-[#B9D8EB] mb-1.5">
                  {t.aboutContact.messageLabel}
                </label>
                <textarea
                  id="contact-message"
                  rows={3}
                  required
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder={t.aboutContact.messagePlaceholder}
                  className="w-full rounded-xl border border-white/25 bg-white/[0.08] px-3.5 py-2.5 text-sm text-white placeholder:text-white/45 focus:border-[#00D9FF] focus:outline-none"
                />
              </div>

              {contactFeedback && (
                <div
                  role={contactStatus === 'error' ? 'alert' : 'status'}
                  className={`rounded-xl px-4 py-2.5 text-xs ${
                    contactStatus === 'sent'
                      ? 'border border-[#22E6D0]/40 bg-[#22E6D0]/15 text-[#22E6D0]'
                      : 'border border-rose-400/40 bg-rose-500/15 text-rose-100'
                  }`}
                >
                  {contactFeedback}
                </div>
              )}

              <button
                type="submit"
                disabled={contactStatus === 'submitting'}
                className="cta-ocean-gradient inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                <span>{contactStatus === 'submitting' ? t.aboutContact.sending : t.aboutContact.sendMessage}</span>
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* CALL TO ACTION SECTION */}
      <section className="relative py-16 px-4 sm:px-8 mx-auto max-w-[1320px]">
        <div className="ocean-glass neon-cyan-border rounded-[32px] px-6 py-14 sm:px-12 text-center relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-56 w-96 rounded-full bg-[#00D9FF]/20 blur-3xl"
          />
          <h2 className="relative text-3xl sm:text-5xl font-display font-extrabold tracking-tight text-white text-balance">
            {t.cta.title}
          </h2>
          <p className="relative mt-4 mx-auto max-w-xl text-base sm:text-lg text-[#B9D8EB]">
            {t.cta.subtitle}
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => onOpenAuth('register')}
              className="cta-ocean-gradient inline-flex items-center gap-2.5 rounded-full px-8 py-4 text-base font-semibold text-white transition-transform hover:scale-[1.02]"
            >
              <span>{t.cta.button}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* OCEAN GLASS FOOTER */}
      <footer className="border-t border-white/18 bg-[#04183D]/70 backdrop-blur-xl">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-5 space-y-3">
              <ClientVaultLogo size="md" />
              <p className="max-w-sm text-sm text-[#B9D8EB]">
                {t.footer.tagline}
              </p>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                {[
                  { label: 'ClientVault Website', href: '#home', icon: Globe },
                  { label: 'ClientVault Portal', href: '#portal-preview', icon: Share2 },
                  { label: 'ClientVault Security', href: '#features', icon: ShieldCheck },
                ].map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.label}
                      href={social.href}
                      aria-label={social.label}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/5 text-[#B9D8EB] hover:border-[#00D9FF]/50 hover:text-[#00D9FF] transition-colors"
                    >
                      <Icon className="h-4 w-4" />
                    </a>
                  );
                })}
                <LanguageToggle compact />
              </div>
            </div>

            <div className="md:col-span-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-white">{t.footer.navHeading}</div>
              <div className="mt-3 grid grid-cols-2 gap-2.5 text-sm text-[#B9D8EB]">
                <a href="#home" className="hover:text-white">{t.nav.home}</a>
                <a href="#features" className="hover:text-white">{t.nav.features}</a>
                <a href="#how-it-works" className="hover:text-white">{t.nav.howItWorks}</a>
                <a href="#pricing" className="hover:text-white">{t.nav.pricing}</a>
                <a href="#about" className="hover:text-white">{t.nav.about}</a>
                <a href="#contact" className="hover:text-white">{t.nav.contact}</a>
              </div>
            </div>

            <div className="md:col-span-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-white">{t.footer.legalHeading}</div>
              <div className="mt-3 space-y-2.5 text-sm text-[#B9D8EB]">
                <button
                  type="button"
                  onClick={() => onOpenLegal('privacy')}
                  className="block hover:text-white transition-colors"
                >
                  {t.footer.privacy}
                </button>
                <button
                  type="button"
                  onClick={() => onOpenLegal('terms')}
                  className="block hover:text-white transition-colors"
                >
                  {t.footer.terms}
                </button>
                <button
                  type="button"
                  onClick={onExploreDashboard}
                  className="block text-[#00D9FF] hover:underline"
                >
                  {t.footer.exploreDashboard}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-[#B9D8EB]">
            <span>© {new Date().getFullYear()} ClientVault · RAKIB. {t.footer.copyright}</span>
            <span>{t.footer.platformLabel}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
