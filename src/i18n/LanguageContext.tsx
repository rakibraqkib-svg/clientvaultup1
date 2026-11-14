import React, { createContext, useContext, useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { normalizeLanguage, translations, type Language, type TranslationTree } from './translations';

const LANG_STORAGE_KEY = 'clientvault_lang';

interface LanguageContextValue {
  lang: Language;
  setLang: (next: Language) => void;
  toggleLang: () => void;
  t: TranslationTree;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

function readInitialLanguage(): Language {
  try {
    return normalizeLanguage(localStorage.getItem(LANG_STORAGE_KEY));
  } catch {
    return 'en';
  }
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(readInitialLanguage);

  const setLang = (next: Language) => {
    setLangState(next);
    try {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    } catch {
      // ignore storage access issues
    }
  };

  const toggleLang = () => {
    setLang(lang === 'en' ? 'bn' : 'en');
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        toggleLang,
        t: translations[lang] as TranslationTree,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return {
      lang: 'en',
      setLang: () => {},
      toggleLang: () => {},
      t: translations.en as TranslationTree,
    };
  }
  return ctx;
}

interface LanguageToggleProps {
  compact?: boolean;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ compact = false }) => {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="group"
      aria-label="Language switcher"
      className="pointer-events-auto inline-flex items-center gap-0.5 rounded-full border border-white/25 bg-[#061E4D]/65 backdrop-blur-xl p-1 shadow-[0_6px_22px_rgba(2,10,30,0.38)]"
    >
      {!compact && <Globe className="ml-2 mr-1 h-3.5 w-3.5 text-[#00D9FF] shrink-0" />}
      <button
        type="button"
        onClick={() => setLang('en')}
        aria-pressed={lang === 'en'}
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all whitespace-nowrap ${
          lang === 'en'
            ? 'bg-gradient-to-r from-[#0879B9] to-[#00D9FF] text-white shadow-sm'
            : 'text-[#B9D8EB] hover:text-white'
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLang('bn')}
        aria-pressed={lang === 'bn'}
        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all whitespace-nowrap ${
          lang === 'bn'
            ? 'bg-gradient-to-r from-[#8B3DFF] to-[#00D9FF] text-white shadow-sm'
            : 'text-[#B9D8EB] hover:text-white'
        }`}
      >
        বাংলা
      </button>
    </div>
  );
};
