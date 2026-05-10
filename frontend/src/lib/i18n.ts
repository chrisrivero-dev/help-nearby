'use client';

import { createContext, useContext } from 'react';

export type Locale = 'EN' | 'ES';

/* ── WhatToBring item translations ─────────────────────────────────────── */
const WHAT_TO_BRING_ES: Record<string, string> = {
  'Government-issued ID':       'Identificación oficial',
  'Proof of Residency':         'Comprobante de domicilio',
  'Proof of address':           'Comprobante de domicilio',
  'Insurance card (if any)':    'Tarjeta de seguro (si tiene)',
  'Medications (3-day supply)': 'Medicamentos (para 3 días)',
  'Medications':                'Medicamentos',
  'Emergency contact list':     'Lista de contactos de emergencia',
  'Change of clothes':          'Ropa de cambio',
  'Phone charger':              'Cargador de celular',
  'Important documents':        'Documentos importantes',
  'Proof of need':              'Comprobante de necesidad',
  'Personal hygiene items':     'Artículos de higiene personal',
  'Reusable bags':              'Bolsas reutilizables',
  'Proof of income':            'Comprobante de ingresos',
  'ID (if safe to bring)':      'Identificación (si es seguro llevarla)',
  'Bank account info':          'Información de cuenta bancaria',
  'Recent utility bill':        'Recibo de servicios reciente',
};

/* ── Category / subcategory translations ───────────────────────────────── */
const CATEGORIES_ES: Record<string, string> = {
  housing: 'vivienda',
  food:    'comida',
  safety:  'seguridad',
  finance: 'finanzas',
};

const SUBCATEGORIES_ES: Record<string, string> = {
  'Emergency Shelter':      'Refugio de emergencia',
  'Rent Assistance':        'Ayuda con la renta',
  'Temporary Housing':      'Vivienda temporal',
  'Food Banks':             'Bancos de alimentos',
  'Free Meals':             'Comidas gratuitas',
  'SNAP Enrollment':        'Inscripción a SNAP',
  'Domestic Violence Help': 'Ayuda en violencia doméstica',
  'Emergency Services':     'Servicios de emergencia',
  'Crisis Lines':           'Líneas de crisis',
  'Cash Assistance':        'Asistencia en efectivo',
  'Utility Help':           'Ayuda con servicios públicos',
  'Debt Counseling':        'Asesoría de deudas',
};

/* ── Dictionary ─────────────────────────────────────────────────────────── */
export const dict = {
  EN: {
    /* ShelterResults / shared */
    whatToBring:   'What to Bring',
    noResults:     'No shelter data for this area.',
    shelterCount:  (n: number) => `${n} shelter${n !== 1 ? 's' : ''} found`,
    translateItem: (item: string) => item,

    /* SmsButton */
    textResults:       'Text results to me',
    sending:           'Sending…',
    sent:              'Sent!',
    error:             'Failed. Retry?',
    phone_placeholder: 'Your phone number',

    /* ResourceFinder — location bar */
    location:                'location',
    enterZip:                'Enter ZIP code',
    useMyLocation:           'Use My Location',
    helperText:              'Enter your ZIP code, pick a category, and find local and national resources near you.',
    showingNearCity:         (city: string, state: string, zip: string) =>
                               `Showing results near ${city}, ${state} (${zip})`,
    showingNearZip:          (zip: string) => `Showing results near ZIP ${zip}`,
    showingNearLocation:     'Showing results near your current location',

    /* ResourceFinder — panel chrome */
    selectTopic:             'select topic',
    showingResourcesFor:     'Showing resources for',
    localResourcesLabel:     (city: string, state: string) =>
                               `local resources — ${city}, ${state}`,
    findingResources:        'Finding resources near you…',
    noLocalResults:          'No local results found for this area. Try the national resources below.',
    selectATopic:            '← Select a topic',

    /* ResourceFinder — expanded card */
    expand:          'Expand ▼',
    collapse:        'Close ▲',
    details:         'Details',
    detailsFallback: 'Visit the link above for more information about this resource and available services.',
    eligibility:     'Eligibility',
    eligibilityText: 'Eligibility varies by program and location. Contact the resource directly to confirm requirements.',
    howToApply:      'How to Apply',
    visit:           'Visit',
    toGetStartedOr:  'to get started, or',
    openApplication: 'open application ↗',

    /* ResourceFinder — category / subcategory labels */
    translateCategory:    (cat: string) => cat,
    translateSubcategory: (sub: string) => sub,
  },
  ES: {
    /* ShelterResults / shared */
    whatToBring:   'Qué traer',
    noResults:     'Sin datos de refugios en esta área.',
    shelterCount:  (n: number) => `${n} refugio${n !== 1 ? 's' : ''} encontrado${n !== 1 ? 's' : ''}`,
    translateItem: (item: string) => WHAT_TO_BRING_ES[item] ?? item,

    /* SmsButton */
    textResults:       'Enviarme resultados por SMS',
    sending:           'Enviando…',
    sent:              '¡Enviado!',
    error:             'Error. ¿Reintentar?',
    phone_placeholder: 'Tu número de teléfono',

    /* ResourceFinder — location bar */
    location:                'ubicación',
    enterZip:                'Ingresa tu código postal',
    useMyLocation:           'Usar mi ubicación',
    helperText:              'Ingresa tu código postal, elige una categoría y encuentra recursos locales y nacionales cerca de ti.',
    showingNearCity:         (city: string, state: string, zip: string) =>
                               `Mostrando resultados cerca de ${city}, ${state} (${zip})`,
    showingNearZip:          (zip: string) => `Mostrando resultados cerca del código ${zip}`,
    showingNearLocation:     'Mostrando resultados cerca de tu ubicación actual',

    /* ResourceFinder — panel chrome */
    selectTopic:             'seleccionar tema',
    showingResourcesFor:     'Mostrando recursos para',
    localResourcesLabel:     (city: string, state: string) =>
                               `recursos locales — ${city}, ${state}`,
    findingResources:        'Buscando recursos cerca de ti…',
    noLocalResults:          'No se encontraron resultados locales en esta área. Consulta los recursos nacionales abajo.',
    selectATopic:            '← Selecciona un tema',

    /* ResourceFinder — expanded card */
    expand:          'Expandir ▼',
    collapse:        'Cerrar ▲',
    details:         'Detalles',
    detailsFallback: 'Visita el enlace para más información sobre este recurso y los servicios disponibles.',
    eligibility:     'Elegibilidad',
    eligibilityText: 'Los requisitos varían por programa y ubicación. Contacta directamente al recurso para confirmar.',
    howToApply:      'Cómo aplicar',
    visit:           'Visita',
    toGetStartedOr:  'para comenzar, o',
    openApplication: 'abrir solicitud ↗',

    /* ResourceFinder — category / subcategory labels */
    translateCategory:    (cat: string) => CATEGORIES_ES[cat] ?? cat,
    translateSubcategory: (sub: string) => SUBCATEGORIES_ES[sub] ?? sub,
  },
} as const;

export const LanguageContext = createContext<{
  locale: Locale;
  setLocale: (l: Locale) => void;
}>({ locale: 'EN', setLocale: () => {} });

export const useI18n = () => {
  const { locale } = useContext(LanguageContext);
  return dict[locale];
};

export const useLocale = () => useContext(LanguageContext);
