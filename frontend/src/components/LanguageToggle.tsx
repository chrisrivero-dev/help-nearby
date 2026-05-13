'use client';

import { useLocale, type Locale } from '@/lib/i18n';
import { useState } from 'react';

const LOCALES: Locale[] = ['EN', 'ES'];

export default function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  const toggleLanguage = () => {
    const currentIndex = LOCALES.indexOf(locale);
    const nextIndex = (currentIndex + 1) % LOCALES.length;
    setLocale(LOCALES[nextIndex]);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={toggleLanguage}
        className={[
          'px-3 py-1 text-sm font-black uppercase tracking-widest transition-colors border-4 border-black shadow-[4px_4px_0px_#000]',
          locale === 'EN' || !isOpen
            ? 'bg-[#f9c700] text-black'
            : 'bg-white text-black hover:bg-neutral-100',
        ].join(' ')}
      >
        {locale}
      </button>
    </div>
  );
}
