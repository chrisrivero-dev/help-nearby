'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeLocation } from '@/lib/location/normalizeLocation';
import { useTheme } from '@/components/useTheme';

/* Types */
type HelpCategory = 'housing' | 'food' | 'safety' | 'finance';

const SUB_OPTIONS: Record<HelpCategory, string[]> = {
  housing:  ['Emergency Shelter', 'Rent Assistance', 'Temporary Housing'],
  food:     ['Food Banks', 'Free Meals', 'SNAP Enrollment'],
  safety:   ['Domestic Violence Help', 'Emergency Services', 'Crisis Lines'],
  finance:  ['Cash Assistance', 'Utility Help', 'Debt Counseling'],
};

type ResourceLink = { title: string; url: string; description?: string };

const RESOURCE_DATA: Record<HelpCategory, Record<string, ResourceLink[]>> = {
  housing: {
    'Emergency Shelter': [
      { title: 'National Alliance to End Homelessness', url: 'https://endhomelessness.org', description: 'Research, policy, and shelter locator tools.' },
      { title: 'HUD — Find Shelter', url: 'https://www.hud.gov/findhelp', description: 'Federal housing assistance finder by zip code.' },
      { title: 'Shelter Listings', url: 'https://www.shelterlistings.org', description: 'National directory of emergency shelters.' },
      { title: '211 Housing Hotline', url: 'https://www.211.org', description: 'Dial 2-1-1 or search online for local shelter availability.' },
    ],
    'Rent Assistance': [
      { title: 'Emergency Rental Assistance (ERA)', url: 'https://home.treasury.gov/policy-issues/homeownership/emergency-rental-assistance-program', description: 'Federal ERA program — find your state portal.' },
      { title: 'National Low Income Housing Coalition', url: 'https://nlihc.org', description: 'Advocacy + rental assistance database.' },
      { title: 'HUD Rental Assistance', url: 'https://www.hud.gov/topics/rental_assistance', description: 'Section 8 and other HUD-backed rental programs.' },
      { title: '211 — Rent Help', url: 'https://www.211.org', description: 'Local rent assistance programs through the 211 network.' },
    ],
    'Temporary Housing': [
      { title: 'Salvation Army — Housing Services', url: 'https://www.salvationarmyusa.org/usn/housing/', description: 'Short-term and transitional housing programs.' },
      { title: 'Catholic Charities USA', url: 'https://www.catholiccharitiesusa.org', description: 'Emergency housing through local Catholic Charities offices.' },
      { title: 'Transitional Housing — HUD', url: 'https://www.hud.gov/program_offices/comm_planning/transitional_housing', description: 'HUD-funded transitional housing locator.' },
      { title: 'YMCA Emergency Housing', url: 'https://www.ymca.org', description: 'Many Y locations provide transitional housing programs.' },
    ],
  },
  food: {
    'Food Banks': [
      { title: 'Feeding America — Find a Food Bank', url: 'https://www.feedingamerica.org/find-your-local-foodbank', description: 'Largest US food bank network — zip-code locator.' },
      { title: 'FoodPantries.org', url: 'https://www.foodpantries.org', description: 'Directory of local food pantries and banks.' },
      { title: 'WhyHunger Hotline', url: 'https://www.whyhunger.org/find-food/', description: 'Call 1-800-5-HUNGRY or use the online finder.' },
      { title: 'Bread for the World', url: 'https://www.bread.org', description: 'Advocacy and local food bank connections.' },
    ],
    'Free Meals': [
      { title: 'Meals on Wheels America', url: 'https://www.mealsonwheelsamerica.org', description: 'Home-delivered meals for seniors and those in need.' },
      { title: 'No Kid Hungry', url: 'https://www.nokidhungry.org', description: 'Free meal programs for children across the US.' },
      { title: 'City Harvest', url: 'https://www.cityharvest.org', description: 'Connects surplus food with community members in NYC.' },
      { title: '211 — Free Meals', url: 'https://www.211.org', description: 'Find local hot meal programs via the 211 network.' },
    ],
    'SNAP Enrollment': [
      { title: 'SNAP — Apply Online', url: 'https://www.fns.usda.gov/snap/state-directory', description: 'Official USDA portal — find your state SNAP office.' },
      { title: 'Benefits.gov — SNAP', url: 'https://www.benefits.gov/benefit/361', description: 'Eligibility pre-screener and application links.' },
      { title: 'GetCalFresh (California)', url: 'https://www.getcalfresh.org', description: 'Fast online SNAP application for California residents.' },
      { title: 'SNAP Retailer Locator', url: 'https://www.fns.usda.gov/snap/retailer-locator', description: 'Find stores that accept EBT near you.' },
    ],
  },
  safety: {
    'Domestic Violence Help': [
      { title: 'National DV Hotline', url: 'https://www.thehotline.org', description: 'Call 1-800-799-7233 or text START to 88788.' },
      { title: 'WomensLaw.org', url: 'https://www.womenslaw.org', description: 'Legal information and resources for abuse survivors.' },
      { title: 'loveisrespect', url: 'https://www.loveisrespect.org', description: 'Real-time chat, text, and call support for relationship abuse.' },
      { title: 'DV Shelter Locator', url: 'https://www.thehotline.org/get-help/', description: 'Find local DV shelters and advocacy programs.' },
    ],
    'Emergency Services': [
      { title: 'FEMA Disaster Assistance', url: 'https://www.disasterassistance.gov', description: 'Apply for federal assistance after declared emergencies.' },
      { title: 'American Red Cross', url: 'https://www.redcross.org/get-help.html', description: 'Emergency shelter, food, and disaster relief.' },
      { title: 'Salvation Army Disaster Relief', url: 'https://www.salvationarmyusa.org/usn/disaster-relief/', description: 'On-the-ground emergency services nationwide.' },
      { title: '211 Emergency Services', url: 'https://www.211.org', description: 'Local emergency resource referrals 24/7.' },
    ],
    'Crisis Lines': [
      { title: '988 Suicide & Crisis Lifeline', url: 'https://988lifeline.org', description: 'Call or text 988 — free, confidential support.' },
      { title: 'Crisis Text Line', url: 'https://www.crisistextline.org', description: 'Text HOME to 741741 for free crisis counseling.' },
      { title: 'SAMHSA National Helpline', url: 'https://www.samhsa.gov/find-help/national-helpline', description: 'Free mental health & substance use support: 1-800-662-4357.' },
      { title: 'Trevor Project (LGBTQ+)', url: 'https://www.thetrevorproject.org', description: 'Crisis intervention for LGBTQ+ young people.' },
    ],
  },
  finance: {
    'Cash Assistance': [
      { title: 'Benefits.gov — Cash Assistance', url: 'https://www.benefits.gov', description: 'Search all federal and state cash aid programs.' },
      { title: 'TANF — Temporary Assistance', url: 'https://www.acf.hhs.gov/ofa/programs/tanf', description: 'Federal cash assistance program for families in need.' },
      { title: 'Salvation Army Emergency Aid', url: 'https://www.salvationarmyusa.org/usn/financial-assistance/', description: 'One-time emergency financial assistance.' },
      { title: '211 — Cash Aid', url: 'https://www.211.org', description: 'Local emergency financial assistance programs.' },
      { title: 'AidKit — Direct Aid Programs', url: 'https://www.aidkit.org/', description: 'Platform used by governments and nonprofits to distribute cash assistance.' },
    ],
    'Utility Help': [
      { title: 'LIHEAP — Heating & Cooling Aid', url: 'https://www.acf.hhs.gov/ocs/programs/liheap', description: 'Federal program to help pay energy bills.' },
      { title: 'LIHEAP Grantees Directory', url: 'https://liheapch.acf.hhs.gov/Grantees/grantees.htm', description: 'Find your state or tribal LIHEAP office.' },
      { title: 'WAP — Weatherization Program', url: 'https://www.energy.gov/eere/wap/weatherization-assistance-program', description: 'Free home energy upgrades to reduce utility bills.' },
      { title: '211 — Utility Assistance', url: 'https://www.211.org', description: 'Local programs to prevent utility shutoffs.' },
    ],
    'Debt Counseling': [
      { title: 'NFCC — Credit Counseling', url: 'https://www.nfcc.org', description: 'Find a nonprofit credit counselor near you.' },
      { title: 'CFPB — Debt Help', url: 'https://www.consumerfinance.gov/consumer-tools/debt-collection/', description: 'Know your rights + tools to manage and dispute debt.' },
      { title: 'Legal Aid — Debt', url: 'https://www.lawhelp.org', description: 'Free legal assistance for debt and financial issues.' },
      { title: 'NCLC — Consumer Debt', url: 'https://www.nclc.org', description: 'National Consumer Law Center guides on debt relief.' },
    ],
  },
};

type LocalEntry = { title: string; url: string };

/* Styles with theme awareness */
const useResourceFinderStyles = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textColor = isDark ? '#e8e8e8' : '#111111';
  const textMuted = isDark ? '#888888' : '#666666';
  const textSecondary = isDark ? '#aaaaaa' : '#444444';
  const bgSurface = isDark ? '#1e1e1e' : '#ffffff';
  const bgAlt = isDark ? '#2a2a2a' : '#f3f3f3';
  const border = isDark ? '#3e3e3e' : '#000000';
  const primary = isDark ? '#60a5fa' : '#2563eb';

  return {
    containerStyle: {
      position: 'relative',
      maxWidth: '1100px',
      width: '100%',
      margin: '0 auto',
      padding: '0 2rem',
      paddingBottom: '4rem',
      overflowY: 'auto',
      color: textColor,
    } as React.CSSProperties,
    locationInputStyle: {
      marginTop: '2rem',
      padding: '0.9rem 1.25rem',
      border: `3px solid ${border}`,
      backgroundColor: bgSurface,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      flexWrap: 'wrap',
    } as React.CSSProperties,
    locationLabelStyle: {
      fontWeight: 700,
      fontSize: '0.7rem',
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      color: textMuted,
    } as React.CSSProperties,
    inputStyle: {
      border: `2px solid ${border}`,
      backgroundColor: bgAlt,
      padding: '0.4rem 0.75rem',
      fontWeight: 600,
      fontSize: '0.9rem',
      fontFamily: 'inherit',
      width: '140px',
      outline: 'none',
      color: textColor,
    } as React.CSSProperties,
    buttonStyle: {
      border: `2px solid ${border}`,
      backgroundColor: border,
      color: isDark ? '#0f0f0f' : '#ffffff',
      padding: '0.4rem 0.9rem',
      fontWeight: 700,
      fontSize: '0.7rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      fontFamily: 'inherit',
      whiteSpace: 'nowrap',
    } as React.CSSProperties,
    locationBadgeStyle: {
      marginLeft: 'auto',
      fontSize: '0.8rem',
      fontWeight: 700,
      letterSpacing: '0.04em',
      border: `2px solid ${border}`,
      padding: '0.3rem 0.75rem',
      backgroundColor: bgAlt,
      whiteSpace: 'nowrap',
      color: textColor,
    } as React.CSSProperties,
    descriptionStyle: {
      fontSize: '0.8rem',
      fontWeight: 600,
      color: textMuted,
      marginTop: '0.65rem',
      marginBottom: 0,
      letterSpacing: '0.02em',
      lineHeight: 1.5,
    } as React.CSSProperties,
    categoryContainerStyle: {
      display: 'flex',
      gap: '1.25rem',
      marginTop: '1.25rem',
    } as React.CSSProperties,
    categoryButtonStyle: {
      position: 'relative',
      zIndex: 1,
      flex: 1,
      height: '80px',
      width: '100%',
      backgroundColor: bgSurface,
      color: textColor,
      border: `3px solid ${border}`,
      fontWeight: 700,
      fontSize: '1.1rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      fontFamily: 'inherit',
    } as React.CSSProperties,
    categoryShadowStyle: {
      position: 'absolute',
      backgroundColor: border,
      width: '100%',
      height: '100%',
      zIndex: 0,
      left: '-5px',
      top: '5px',
    } as React.CSSProperties,
    categoryButtonActiveStyle: {
      position: 'relative',
      zIndex: 1,
      flex: 1,
      height: '80px',
      width: '100%',
      backgroundColor: border,
      color: isDark ? '#0f0f0f' : '#ffffff',
      border: `4px solid ${border}`,
      boxShadow: 'none',
      fontWeight: 700,
      fontSize: '1.1rem',
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      cursor: 'pointer',
      fontFamily: 'inherit',
    } as React.CSSProperties,
    panelStyle: {
      border: `3px solid ${border}`,
      backgroundColor: bgSurface,
      display: 'flex',
      overflow: 'hidden',
      marginTop: '1.25rem',
    } as React.CSSProperties,
    subOptionsStyle: {
      width: '220px',
      flexShrink: 0,
      borderRight: `3px solid ${border}`,
      backgroundColor: bgAlt,
      display: 'flex',
      flexDirection: 'column',
    } as React.CSSProperties,
    subOptionsHeaderStyle: {
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      padding: '0.75rem 1rem',
      borderBottom: `2px solid ${border}`,
      margin: 0,
      color: textMuted,
    } as React.CSSProperties,
    subOptionButtonStyle: {
      padding: '0.85rem 1rem',
      textAlign: 'left',
      fontWeight: 700,
      fontSize: '0.85rem',
      letterSpacing: '0.03em',
      cursor: 'pointer',
      border: 'none',
      borderBottom: `1px solid ${border}`,
      fontFamily: 'inherit',
      color: textColor,
      backgroundColor: 'transparent',
    } as React.CSSProperties,
    subOptionButtonActiveStyle: {
      padding: '0.85rem 1rem',
      textAlign: 'left',
      fontWeight: 700,
      fontSize: '0.85rem',
      letterSpacing: '0.03em',
      cursor: 'pointer',
      border: 'none',
      borderBottom: `1px solid ${border}`,
      backgroundColor: border,
      color: isDark ? '#0f0f0f' : '#ffffff',
      fontFamily: 'inherit',
    } as React.CSSProperties,
    previewPanelStyle: {
      flex: 1,
      padding: '1.5rem',
      minHeight: '200px',
      maxHeight: '420px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      overflowY: 'auto',
    } as React.CSSProperties,
    resourceHeadingStyle: {
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      color: textMuted,
      marginBottom: '0.4rem',
      margin: 0,
    } as React.CSSProperties,
    resourceSubheadingStyle: {
      fontSize: '1.1rem',
      fontWeight: 700,
      lineHeight: 1.3,
      marginTop: '0.3rem',
      marginBottom: '1.25rem',
      paddingBottom: '0.75rem',
      borderBottom: `2px solid ${border}`,
      color: textColor,
    } as React.CSSProperties,
    localResourcesHeaderStyle: {
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      margin: '0 0 0.65rem',
      backgroundColor: border,
      color: isDark ? '#0f0f0f' : '#ffffff',
      padding: '0.3rem 0.65rem',
      display: 'inline-block',
    } as React.CSSProperties,
    loadingStyle: {
      fontSize: '0.8rem',
      fontWeight: 600,
      color: textMuted,
      margin: 0,
      letterSpacing: '0.04em',
    } as React.CSSProperties,
    noResultsStyle: {
      fontSize: '0.8rem',
      fontWeight: 600,
      color: textMuted,
      margin: 0,
      letterSpacing: '0.04em',
    } as React.CSSProperties,
    resourceLinkStyle: {
      fontSize: '0.85rem',
      fontWeight: 700,
      color: primary,
      textDecoration: 'none',
      borderBottom: `1px solid ${border}`,
    } as React.CSSProperties,
    resourceItemStyle: {
      borderBottom: `2px solid ${border}`,
    } as React.CSSProperties,
    resourceCardCollapsedStyle: {
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      padding: '0.8rem 0',
    } as React.CSSProperties,
    resourceTitleStyle: {
      fontWeight: 700,
      fontSize: '0.95rem',
      color: primary,
      textDecoration: 'none',
      borderBottom: `2px solid ${border}`,
      display: 'inline-block',
      marginBottom: '0.15rem',
    } as React.CSSProperties,
    resourceDescriptionStyle: {
      margin: 0,
      fontSize: '0.8rem',
      color: textSecondary,
      lineHeight: 1.4,
    } as React.CSSProperties,
    expandButtonStyle: {
      flexShrink: 0,
      border: `2px solid ${border}`,
      backgroundColor: bgAlt,
      color: textColor,
      padding: '0.25rem 0.6rem',
      cursor: 'pointer',
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      fontFamily: 'inherit',
      whiteSpace: 'nowrap',
      alignSelf: 'flex-start',
      marginTop: '0.1rem',
    } as React.CSSProperties,
    expandButtonActiveStyle: {
      flexShrink: 0,
      border: `2px solid ${border}`,
      backgroundColor: border,
      color: isDark ? '#0f0f0f' : '#ffffff',
      padding: '0.25rem 0.6rem',
      cursor: 'pointer',
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.06em',
      textTransform: 'uppercase',
      fontFamily: 'inherit',
      whiteSpace: 'nowrap',
      alignSelf: 'flex-start',
      marginTop: '0.1rem',
    } as React.CSSProperties,
    detailBlockStyle: {
      borderTop: `1px solid ${border}`,
      padding: '0.85rem 0 1.1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      backgroundColor: bgAlt,
      paddingLeft: '0.75rem',
      paddingRight: '0.75rem',
      marginBottom: '0.5rem',
    } as React.CSSProperties,
    detailLabelStyle: {
      fontSize: '0.6rem',
      fontWeight: 700,
      letterSpacing: '0.14em',
      textTransform: 'uppercase',
      color: textMuted,
      margin: '0 0 0.25rem',
    } as React.CSSProperties,
    detailTextStyle: {
      margin: 0,
      fontSize: '0.85rem',
      color: textColor,
      lineHeight: 1.55,
    } as React.CSSProperties,
    detailLinkStyle: {
      color: primary,
      fontWeight: 600,
      borderBottom: `1px solid ${textMuted}`,
    } as React.CSSProperties,
    detailActionLinkStyle: {
      color: primary,
      fontWeight: 700,
      borderBottom: `2px solid ${border}`,
    } as React.CSSProperties,
    emptyStateStyle: {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '180px',
      color: textMuted,
    } as React.CSSProperties,
    emptyStateTextStyle: {
      fontSize: '1rem',
      fontWeight: 700,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    } as React.CSSProperties,
  };
};

export interface ResourceFinderProps {
  initialCategory?: HelpCategory;
  initialSubcategory?: string;
}

const ResourceFinder: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const styles = useResourceFinderStyles();
  
  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [locationZip, setLocationZip] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [resolvedLocation, setResolvedLocation] = useState<{ city: string; stateCode: string } | null>(null);
  const [localResources, setLocalResources] = useState<LocalEntry[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  useEffect(() => {
    const zip = locationZip.replace(/\D/g, '').slice(0, 5);
    if (zip.length !== 5) { setResolvedLocation(null); return; }
    normalizeLocation(zip).then((loc) => {
      setResolvedLocation(loc.isValid ? { city: loc.city, stateCode: loc.stateCode } : null);
    });
  }, [locationZip]);

  async function fetchLocalResources(
    cat: HelpCategory,
    sub: string,
    city: string,
    state: string,
  ): Promise<LocalEntry[]> {
    const params = new URLSearchParams({ category: cat, subcategory: sub, city, state });
    const res = await fetch(`/api/local-resources?${params}`);
    if (!res.ok) return [];
    return res.json() as Promise<LocalEntry[]>;
  }

  useEffect(() => {
    if (!resolvedLocation || !category || !subcategory) { setLocalResources([]); return; }
    setLoadingResources(true);
    fetchLocalResources(category, subcategory, resolvedLocation.city, resolvedLocation.stateCode)
      .then(setLocalResources)
      .finally(() => setLoadingResources(false));
  }, [resolvedLocation, category, subcategory]);

  const handleCategoryClick = (cat: HelpCategory) => {
    setCategory(category === cat ? null : cat);
    setSubcategory(null);
  };

  const handleSubcategoryClick = (sub: string) => {
    setSubcategory(sub);
    setExpandedCard(null);
    previewRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLocate = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocationLat(pos.coords.latitude);
        setLocationLng(pos.coords.longitude);
        setLocationZip('');
      },
      () => { /* permission denied — silently ignore */ }
    );
  };

  const handleExpandCard = (url: string) => {
    setExpandedCard(expandedCard === url ? null : url);
    previewRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div style={styles.containerStyle}>
      {/* Location Input */}
      <div style={styles.locationInputStyle}>
        <span style={styles.locationLabelStyle}>LOCATION</span>
        <input
          type="text"
          value={locationZip}
          onChange={(e) => {
            setLocationZip(e.target.value);
            setLocationLat(null);
            setLocationLng(null);
          }}
          placeholder="Enter ZIP code"
          maxLength={10}
          style={styles.inputStyle}
        />
        <button
          onClick={handleLocate}
          style={styles.buttonStyle}
        >
          Use My Location
        </button>
        {(locationZip.trim() !== '' || locationLat !== null) && (
          <span style={styles.locationBadgeStyle}>
            {locationZip.trim() !== ''
              ? resolvedLocation
                ? `Showing results near ${resolvedLocation.city}, ${resolvedLocation.stateCode} (${locationZip.trim()})`
                : `Showing results near ZIP ${locationZip.trim()}`
              : 'Showing results near your current location'}
          </span>
        )}
      </div>

      {/* Page description */}
      <p style={styles.descriptionStyle}>
        Enter your ZIP code, pick a category, and find local and national resources near you.
      </p>

      {/* Category cards */}
      <div style={styles.categoryContainerStyle}>
        {(Object.keys(SUB_OPTIONS) as HelpCategory[]).map((cat) => {
          const isActive = category === cat;
          return (
            <div key={cat} style={{ position: 'relative', flex: 1, height: '80px' }}>
              <div style={styles.categoryShadowStyle} />
              <motion.button
                onClick={() => handleCategoryClick(cat)}
                aria-pressed={isActive}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                style={isActive ? styles.categoryButtonActiveStyle : styles.categoryButtonStyle}
              >
                {cat.toUpperCase()}
              </motion.button>
            </div>
          );
        })}
      </div>

      {/* Sub-options + preview panel */}
      <AnimatePresence initial={false} mode="wait">
        {category && (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96] }}
            style={{ overflow: 'hidden', marginTop: '1.25rem' }}
          >
            <div style={styles.panelStyle}>
              {/* Left: sub-option buttons */}
              <div style={styles.subOptionsStyle}>
                <p style={styles.subOptionsHeaderStyle}>
                  {category.toUpperCase()} — SELECT TOPIC
                </p>
                {SUB_OPTIONS[category].map((sub) => {
                  const isSubActive = subcategory === sub;
                  return (
                    <motion.button
                      key={sub}
                      onClick={() => handleSubcategoryClick(sub)}
                      aria-pressed={isSubActive}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 400, damping: 20 }}
                      style={isSubActive ? styles.subOptionButtonActiveStyle : styles.subOptionButtonStyle}
                    >
                      {sub}
                    </motion.button>
                  );
                })}
              </div>

              {/* Right: results preview */}
              <div
                ref={previewRef}
                style={styles.previewPanelStyle}
              >
                <AnimatePresence initial={false} mode="wait">
                  {subcategory ? (
                    <motion.div
                      key={subcategory}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.4, ease: [0.43, 0.13, 0.23, 0.96] }}
                    >
                      {/* Heading */}
                      <p style={styles.resourceHeadingStyle}>
                        {category.charAt(0).toUpperCase() + category.slice(1)} — {subcategory}
                      </p>
                      <p style={styles.resourceSubheadingStyle}>
                        Showing resources for{' '}
                        <span style={{ borderBottom: `3px solid ${isDark ? '#60a5fa' : '#2563eb'}` }}>{subcategory}</span>.
                      </p>

                      {/* Local resources */}
                      {resolvedLocation && (loadingResources || localResources.length > 0 || (!loadingResources && localResources.length === 0)) && (
                        <div style={{
                          marginBottom: '1.25rem',
                          paddingBottom: '1rem',
                          borderBottom: `2px solid ${isDark ? '#60a5fa' : '#2563eb'}`,
                        }}>
                          <p style={styles.localResourcesHeaderStyle}>
                            LOCAL RESOURCES — {resolvedLocation.city}, {resolvedLocation.stateCode}
                          </p>
                          {loadingResources ? (
                            <p style={styles.loadingStyle}>
                              Finding resources near you…
                            </p>
                          ) : localResources.length === 0 ? (
                            <p style={styles.noResultsStyle}>
                              No local results found for this area. Try the national resources below.
                            </p>
                          ) : (
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {localResources.map((entry) => (
                                <li key={entry.url}>
                                  <a
                                    href={entry.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={styles.resourceLinkStyle}
                                  >
                                    • {entry.title} ↗
                                  </a>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {/* Expandable resource cards */}
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                        {(RESOURCE_DATA[category as HelpCategory]?.[subcategory] ?? []).map((link) => {
                          const isOpen = expandedCard === link.url;
                          const detailId = `card-detail-${link.url.replace(/[^a-z0-9]/gi, '-')}`;
                          return (
                            <li key={link.url} style={styles.resourceItemStyle}>
                              {/* Collapsed row */}
                              <div style={styles.resourceCardCollapsedStyle}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={styles.resourceTitleStyle}
                                  >
                                    {link.title} ↗
                                  </a>
                                  {link.description && (
                                    <p style={styles.resourceDescriptionStyle}>
                                      {link.description}
                                    </p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleExpandCard(link.url)}
                                  aria-expanded={isOpen}
                                  aria-controls={detailId}
                                  style={isOpen ? styles.expandButtonActiveStyle : styles.expandButtonStyle}
                                >
                                  {isOpen ? 'Close ▲' : 'Expand ▼'}
                                </button>
                              </div>

                              {/* Expanded detail block */}
                              <AnimatePresence initial={false}>
                                {isOpen && (
                                  <motion.div
                                    id={detailId}
                                    key="detail"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                    style={{ overflow: 'hidden' }}
                                  >
                                    <div style={styles.detailBlockStyle}>
                                      <div>
                                        <p style={styles.detailLabelStyle}>Details</p>
                                        <p style={styles.detailTextStyle}>
                                          {link.description ?? 'Visit the link above for more information about this resource and available services.'}
                                        </p>
                                      </div>

                                      <div>
                                        <p style={styles.detailLabelStyle}>Eligibility</p>
                                        <p style={styles.detailTextStyle}>
                                          Eligibility varies by program and location. Contact the resource directly to confirm requirements.
                                        </p>
                                      </div>

                                      <div>
                                        <p style={styles.detailLabelStyle}>How to Apply</p>
                                        <p style={styles.detailTextStyle}>
                                          Visit{' '}
                                          <a href={link.url} target="_blank" rel="noreferrer" style={styles.detailLinkStyle}>
                                            {link.url}
                                          </a>
                                          {' '}to get started, or{' '}
                                          <a href={link.url} target="_blank" rel="noreferrer" style={styles.detailActionLinkStyle}>
                                            open application ↗
                                          </a>
                                        </p>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="empty"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      style={styles.emptyStateStyle}
                    >
                      <p style={styles.emptyStateTextStyle}>
                        ← Select a topic
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ResourceFinder;