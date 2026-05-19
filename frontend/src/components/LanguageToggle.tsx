'use client';

import { useLocale, type Locale } from '@/lib/i18n';
import { useTheme } from '@/components/useTheme';
import { useState } from 'react';

const LOCALES: Locale[] = ['EN', 'ES'];

// Panel border colors
const panelBorderDark = '#252525';
const panelBorderLight = '#e4e4e4';

export default function LanguageToggle() {
  const { locale, setLocale } = useLocale();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);

  const toggleLanguage = () => {
    const currentIndex = LOCALES.indexOf(locale);
    const nextIndex = (currentIndex + 1) % LOCALES.length;
    setLocale(LOCALES[nextIndex]);
    setIsOpen(false);
  };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '0.75rem',
        fontFamily: "'Poppins', sans-serif",
        fontWeight: 600,
        color: isDark ? '#dedede' : '#111111',
      }}
      onClick={toggleLanguage}
    >
      {locale}
    </span>
  );
}
