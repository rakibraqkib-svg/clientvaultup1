import React, { useState } from 'react';
import { HelpCircle, Search, Send } from 'lucide-react';
import { submitContactForm } from '../../services/api';
import { useLanguage } from '../../i18n/LanguageContext';

interface HelpViewProps {
  userName: string;
  userEmail: string;
}

export const HelpView: React.FC<HelpViewProps> = ({ userName, userEmail }) => {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [feedback, setFeedback] = useState('');

  const filteredFaqs = t.helpView.faqs.filter(
    (item) =>
      item.q.toLowerCase().includes(query.trim().toLowerCase()) ||
      item.a.toLowerCase().includes(query.trim().toLowerCase())
  );

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setFeedback('');
    try {
      await submitContactForm({
        name: userName,
        email: userEmail,
        company: 'ClientVault Workspace User',
        message,
      });
      setStatus('sent');
      setFeedback(t.helpView.sentMsg);
      setMessage('');
    } catch (err) {
      setStatus('error');
      setFeedback(err instanceof Error ? err.message : 'Unable to send support message.');
    }
  };

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-display font-bold text-white">{t.helpView.title}</h2>
        <p className="text-xs text-[#B9D8EB]">{t.helpView.subtitle}</p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#B9D8EB]" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.helpView.searchPlaceholder}
          aria-label={t.helpView.searchPlaceholder}
          className="w-full rounded-xl border border-white/22 bg-white/[0.09] pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFaqs.map((faq) => (
          <div key={faq.q} className="ocean-glass rounded-2xl p-5 border border-white/15">
            <div className="flex items-start gap-2.5">
              <HelpCircle className="h-4 w-4 shrink-0 text-[#00D9FF] mt-0.5" />
              <h3 className="text-sm font-display font-bold text-white">{faq.q}</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-[#B9D8EB]">{faq.a}</p>
          </div>
        ))}
      </div>

      <div className="ocean-glass neon-purple-border rounded-3xl p-6">
        <h3 className="text-lg font-display font-bold text-white">{t.helpView.needHelpTitle}</h3>
        <p className="mt-1 text-xs text-[#B9D8EB]">
          {t.helpView.needHelpSub} {userEmail}
        </p>

        <form onSubmit={handleSupportSubmit} className="mt-4 space-y-3">
          <textarea
            rows={3}
            required
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t.helpView.msgPlaceholder}
            aria-label={t.helpView.msgPlaceholder}
            className="w-full rounded-xl border border-white/22 bg-white/[0.09] px-3.5 py-2.5 text-sm text-white placeholder:text-white/55 focus:border-[#00D9FF] focus:outline-none"
          />

          {feedback && (
            <div
              role={status === 'error' ? 'alert' : 'status'}
              className={`rounded-xl px-3.5 py-2 text-xs ${
                status === 'sent'
                  ? 'border border-[#22E6D0]/40 bg-[#22E6D0]/15 text-[#22E6D0]'
                  : 'border border-rose-400/40 bg-rose-500/15 text-rose-100'
              }`}
            >
              {feedback}
            </div>
          )}

          <button
            type="submit"
            disabled={status === 'sending'}
            className="cta-ocean-gradient inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-white"
          >
            <Send className="h-3.5 w-3.5" />
            <span>{status === 'sending' ? t.helpView.sendingBtn : t.helpView.sendBtn}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

