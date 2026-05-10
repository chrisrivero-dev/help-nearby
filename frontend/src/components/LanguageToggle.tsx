'use client';

import { useLocale, type Locale } from '@/lib/i18n';

const LOCALES: Locale[] = ['EN', 'ES'];

export default function LanguageToggle() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex border-4 border-black shadow-[4px_4px_0px_#000] w-fit">
      {LOCALES.map((l, i) => (
        <button
          key={l}
          onClick={() => setLocale(l)}
          className={[
            'px-3 py-1 text-sm font-black uppercase tracking-widest transition-colors',
            i < LOCALES.length - 1 ? 'border-r-4 border-black' : '',
            locale === l
              ? 'bg-[#f9c700] text-black'
              : 'bg-white text-black hover:bg-neutral-100',
          ].join(' ')}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
