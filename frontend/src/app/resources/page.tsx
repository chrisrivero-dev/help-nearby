'use client';

import { useState, useRef, useEffect } from 'react';
import Button from '@/components/Buttons';
import { FiMapPin } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeLocation } from '@/lib/location/normalizeLocation';

/* ------ Layout styles -------------------------------- */
const pageStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: '#f3f3f3',
  color: '#000',
  paddingBottom: '4rem',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  padding: '1rem 2rem',
  backgroundColor: '#e6ecf1ff',
  borderBottom: '4px solid #000',
};

const titleStyle: React.CSSProperties = {
  fontWeight: 700,
  textTransform: 'uppercase',
  textAlign: 'left',
  color: '#000',
  padding: '0.5rem',
  fontSize: 'clamp(2rem, 8vw, 12vh)',
};

const headerIconStyle: React.CSSProperties = {
  fontSize: 'clamp(4rem, 8vw, 10rem)',
  cursor: 'pointer',
};

const linkContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'row',
  gap: '1rem',
  fontSize: '1.25rem',
  marginLeft: 'auto',
  marginRight: 'auto',
  alignItems: 'center',
  height: '100%',
  justifyContent: 'center',
};

const linkStyle: React.CSSProperties = {
  display: 'flex',
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
  whiteSpace: 'nowrap',
  minWidth: '8rem',
  color: '#000',
  backgroundColor: '#fff',
  border: '4px solid #000',
  padding: '0.25rem 0',
  textDecoration: 'none',
};

const panelStyle: React.CSSProperties = {
  backgroundColor: 'rgb(25, 27, 53)',
  width: '100%',
  overflow: 'hidden', // Changed from 'auto' to 'hidden'
  borderBottom: '4px solid #000',
  marginBottom: 'var(--banner-height)',
  position: 'relative', // Added to position the panel properly
  zIndex: 10, // Ensure it appears above content
};

// Panel content styles
const panelContentStyle: React.CSSProperties = {
  padding: '2rem',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  height: '100%',
  flexDirection: 'column',
  textAlign: 'center',
};

const mapPlaceholderStyle: React.CSSProperties = {
  fontSize: 'clamp(2rem, 10vw, 5rem)',
  fontWeight: 700,
  color: '#000',
  backgroundColor: '#fff',
  border: '4px solid #000',
  padding: '1rem 2rem',
  textAlign: 'center',
};

const activeShadowStyle: React.CSSProperties = {
  position: 'absolute',
  top: 'calc(100% + 4px)', // distance below the icon (tweak if needed)
  left: 0,
  right: 0,
  margin: '0 auto', // forces horizontal centering
  width: '4rem',
  height: '1.2rem',
  backgroundColor: '#000', // solid black
  borderRadius: '50%',
};

/* =====================
   TYPES & DATA
===================== */

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

const LOCAL_RESOURCES: Record<HelpCategory, Record<string, LocalEntry[]>> = {
  housing: {
    'Emergency Shelter': [
      { title: 'Local Rescue Mission',        url: 'https://www.cityrescuemission.com' },
      { title: 'County Emergency Shelter',    url: 'https://www.hud.gov/findhelp' },
      { title: '211 Local Shelter Finder',    url: 'https://www.211.org' },
    ],
    'Rent Assistance': [
      { title: 'County Housing Authority',    url: 'https://www.hud.gov/program_offices/public_indian_housing/pha/contacts' },
      { title: 'Local Legal Aid — Rental',    url: 'https://www.lawhelp.org' },
      { title: '211 Local Rent Help',         url: 'https://www.211.org' },
    ],
    'Temporary Housing': [
      { title: 'Local YMCA Transitional Housing', url: 'https://www.ymca.org' },
      { title: 'County Social Services',          url: 'https://www.benefits.gov' },
      { title: '211 Transitional Housing',        url: 'https://www.211.org' },
    ],
  },
  food: {
    'Food Banks': [
      { title: 'Local Food Bank',             url: 'https://www.feedingamerica.org/find-your-local-foodbank' },
      { title: 'County Food Pantry Network',  url: 'https://www.foodpantries.org' },
      { title: '211 Local Food Programs',     url: 'https://www.211.org' },
    ],
    'Free Meals': [
      { title: 'Local Soup Kitchen',          url: 'https://www.salvationarmyusa.org' },
      { title: 'Meals on Wheels Local',       url: 'https://www.mealsonwheelsamerica.org/find-a-program' },
      { title: '211 Free Meals Near You',     url: 'https://www.211.org' },
    ],
    'SNAP Enrollment': [
      { title: 'County SNAP Office',          url: 'https://www.fns.usda.gov/snap/state-directory' },
      { title: 'Benefits.gov SNAP Screener',  url: 'https://www.benefits.gov/benefit/361' },
      { title: '211 SNAP Enrollment Help',    url: 'https://www.211.org' },
    ],
  },
  safety: {
    'Domestic Violence Help': [
      { title: 'Local DV Shelter',            url: 'https://www.thehotline.org/get-help/' },
      { title: 'Legal Aid — DV Cases',        url: 'https://www.lawhelp.org' },
      { title: 'National DV Hotline',         url: 'https://www.thehotline.org' },
    ],
    'Emergency Services': [
      { title: 'County Emergency Management', url: 'https://www.ready.gov' },
      { title: 'Local Red Cross Chapter',     url: 'https://www.redcross.org/local' },
      { title: '211 Emergency Services',      url: 'https://www.211.org' },
    ],
    'Crisis Lines': [
      { title: 'Local Crisis Center',         url: 'https://988lifeline.org' },
      { title: '988 Suicide & Crisis Line',   url: 'https://988lifeline.org' },
      { title: 'Crisis Text Line',            url: 'https://www.crisistextline.org' },
    ],
  },
  finance: {
    'Cash Assistance': [
      { title: 'County Assistance Office',        url: 'https://www.benefits.gov' },
      { title: 'Local Salvation Army Aid',        url: 'https://www.salvationarmyusa.org/usn/financial-assistance/' },
      { title: '211 Local Financial Aid',         url: 'https://www.211.org' },
    ],
    'Utility Help': [
      { title: 'Local LIHEAP Office',             url: 'https://liheapch.acf.hhs.gov/Grantees/grantees.htm' },
      { title: 'County Utility Assistance',       url: 'https://www.benefits.gov' },
      { title: '211 Utility Help Programs',       url: 'https://www.211.org' },
    ],
    'Debt Counseling': [
      { title: 'Local Credit Counseling Center',  url: 'https://www.nfcc.org/find-a-counselor/' },
      { title: 'Legal Aid — Debt Issues',         url: 'https://www.lawhelp.org' },
      { title: '211 Financial Counseling',        url: 'https://www.211.org' },
    ],
  },
};

/* =====================
   PAGE
===================== */

export default function HelpPage() {
  // ✅ STATE LIVES HERE (the brain)
  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [locationZip, setLocationZip] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [resolvedLocation, setResolvedLocation] = useState<{ city: string; stateCode: string } | null>(null);

  useEffect(() => {
    const zip = locationZip.replace(/\D/g, '').slice(0, 5);
    if (zip.length !== 5) { setResolvedLocation(null); return; }
    normalizeLocation(zip).then((loc) => {
      setResolvedLocation(loc.isValid ? { city: loc.city, stateCode: loc.stateCode } : null);
    });
  }, [locationZip]);

  /* =====================
     RENDER
  ===================== */

  return (
    <motion.main
      style={pageStyle}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header - Match main page style */}
      <header style={headerStyle}>
        <div
          style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
        >
          {/* Buttons row above title and map pin */}
          <div style={linkContainerStyle}>
            <Button
              style={linkStyle}
              onClick={() => (window.location.href = '/')}
            >
              HOME
            </Button>
            <Button
              style={linkStyle}
              onClick={() => (window.location.href = '/resources')}
            >
              RESOURCES
            </Button>
            <Button
              style={linkStyle}
              onClick={() => (window.location.href = '/about')}
            >
              ABOUT
            </Button>
          </div>

          {/* Title and map pin container */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
            }}
          >
            <motion.div
              style={titleStyle}
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <motion.span
                style={{ display: 'inline-block', cursor: 'pointer' }}
                whileHover={{
                  backgroundColor: '#ff0000ff',
                  color: '#fff',
                  transition: { duration: 0.2 },
                }}
                onClick={() => console.log('HELP! clicked')}
              >
                RESOURCES!
              </motion.span>{' '}
              <span>NEARBY.</span>
            </motion.div>

            {/* Wrapper now carries the same left‑margin as the icon */}
            <div style={{ position: 'relative', marginLeft: '1rem' }}>
              <motion.div
                onClick={() => setPanelOpen((o) => !o)}
                style={headerIconStyle}
                initial={{ y: -800, opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  transition: { duration: 1.2, ease: 'easeInOut' },
                }}
                whileHover={{
                  y: -10,
                  transition: { duration: 0.15, ease: 'linear' },
                }}
              >
                <FiMapPin style={{ color: '#000000' }} />
              </motion.div>

              {/* Oval shadow – animated (kept from previous step) */}
              <AnimatePresence>
                {panelOpen && (
                  <motion.div
                    style={activeShadowStyle}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  />
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* Sliding panel - added to match main page */}
      <AnimatePresence>
        {panelOpen && (
          <motion.div
            style={panelStyle}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: '50vh', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            {/* Panel content - empty as requested */}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main content (max-width container) ─────────────────── */}
      <div style={{ maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '0 2rem' }}>

        {/* ── Location input ──────────────────────────────────── */}
        <div style={{
          marginTop: '2rem', padding: '0.9rem 1.25rem',
          border: '3px solid #000', backgroundColor: '#fff',
          display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
        }}>
          <span style={{
            fontWeight: 700, fontSize: '0.7rem', letterSpacing: '0.15em',
            textTransform: 'uppercase', whiteSpace: 'nowrap', color: '#444',
          }}>
            LOCATION
          </span>
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
            style={{
              border: '2px solid #000', backgroundColor: '#f3f3f3',
              padding: '0.4rem 0.75rem', fontWeight: 600, fontSize: '0.9rem',
              fontFamily: 'inherit', width: '140px', outline: 'none',
            }}
          />
          <button
            onClick={() => {
              navigator.geolocation.getCurrentPosition(
                (pos) => {
                  setLocationLat(pos.coords.latitude);
                  setLocationLng(pos.coords.longitude);
                  setLocationZip('');
                },
                () => { /* permission denied — silently ignore */ }
              );
            }}
            style={{
              border: '2px solid #000', backgroundColor: '#000', color: '#fff',
              padding: '0.4rem 0.9rem', fontWeight: 700, fontSize: '0.7rem',
              letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
              fontFamily: 'inherit', whiteSpace: 'nowrap',
            }}
          >
            Use My Location
          </button>
          {/* Active location badge */}
          {(locationZip.trim() !== '' || locationLat !== null) && (
            <span style={{
              marginLeft: 'auto', fontSize: '0.8rem', fontWeight: 700,
              letterSpacing: '0.04em', border: '2px solid #000',
              padding: '0.3rem 0.75rem', backgroundColor: '#f3f3f3',
              whiteSpace: 'nowrap',
            }}>
              {locationZip.trim() !== ''
                ? `Showing results near ZIP ${locationZip.trim()}`
                : 'Showing results near your current location'}
            </span>
          )}
        </div>

        {/* ── Category cards ──────────────────────────────────── */}
        <div style={{ display: 'flex', gap: '1.25rem', marginTop: '1.25rem' }}>
          {(Object.keys(SUB_OPTIONS) as HelpCategory[]).map((cat) => {
            const isActive = category === cat;
            return (
              <div key={cat} style={{ position: 'relative', flex: 1, height: '80px' }}>
                {/* Brutalist offset shadow */}
                <div style={{
                  position: 'absolute', backgroundColor: '#000',
                  width: '100%', height: '100%',
                  zIndex: 0, left: '-5px', top: '5px',
                }} />
                <button
                  onClick={() => { setCategory(isActive ? null : cat); setSubcategory(null); }}
                  aria-pressed={isActive}
                  style={{
                    position: 'relative', zIndex: 1,
                    width: '100%', height: '100%',
                    backgroundColor: isActive ? '#000' : '#fff',
                    color: isActive ? '#fff' : '#000',
                    border: `${isActive ? '4px' : '3px'} solid #000`,
                    boxShadow: isActive ? 'none' : undefined,
                    fontWeight: 700, fontSize: '1.1rem', letterSpacing: '0.08em',
                    textTransform: 'uppercase', cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  {cat.toUpperCase()}
                </button>
              </div>
            );
          })}
        </div>

        {/* ── Sub-options + preview panel ─────────────────────── */}
        <AnimatePresence initial={false}>
          {category && (
            <motion.div
              key={category}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              style={{ overflow: 'hidden', marginTop: '1.25rem' }}
            >
              <div style={{ border: '3px solid #000', backgroundColor: '#fff', display: 'flex' }}>

                {/* Left: sub-option buttons */}
                <div style={{
                  width: '220px', flexShrink: 0,
                  borderRight: '3px solid #000',
                  backgroundColor: '#f3f3f3',
                  display: 'flex', flexDirection: 'column',
                }}>
                  <p style={{
                    fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em',
                    textTransform: 'uppercase', padding: '0.75rem 1rem',
                    borderBottom: '2px solid #000', margin: 0, color: '#666',
                  }}>
                    {category.toUpperCase()} — SELECT TOPIC
                  </p>
                  {SUB_OPTIONS[category].map((sub) => {
                    const isSubActive = subcategory === sub;
                    return (
                      <button
                        key={sub}
                        onClick={() => {
                          setSubcategory(sub);
                          setExpandedCard(null);
                          previewRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        aria-pressed={isSubActive}
                        style={{
                          padding: '0.85rem 1rem', textAlign: 'left',
                          fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.03em',
                          cursor: 'pointer', border: 'none', borderBottom: '1px solid #000',
                          backgroundColor: isSubActive ? '#000' : 'transparent',
                          color: isSubActive ? '#fff' : '#000',
                          fontFamily: 'inherit',
                        }}
                      >
                        {sub}
                      </button>
                    );
                  })}
                </div>

                {/* Right: results preview */}
                <div
                  ref={previewRef}
                  style={{
                    flex: 1, padding: '1.5rem', minHeight: '200px', maxHeight: '420px',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-start',
                    overflowY: 'auto',
                  }}
                >
                  <AnimatePresence initial={false} mode="wait">
                    {subcategory ? (
                      <motion.div
                        key={subcategory}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Heading */}
                        <p style={{
                          fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em',
                          textTransform: 'uppercase', color: '#666', marginBottom: '0.4rem',
                          margin: 0,
                        }}>
                          {category.charAt(0).toUpperCase() + category.slice(1)} — {subcategory}
                        </p>
                        <p style={{
                          fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.3,
                          marginTop: '0.3rem', marginBottom: '1.25rem',
                          paddingBottom: '0.75rem', borderBottom: '2px solid #000',
                        }}>
                          Showing resources for{' '}
                          <span style={{ borderBottom: '3px solid #000' }}>{subcategory}</span>.
                        </p>

                        {/* ── Local resources (ZIP-resolved) ──────── */}
                        {resolvedLocation && (LOCAL_RESOURCES[category as HelpCategory]?.[subcategory!] ?? []).length > 0 && (
                          <div style={{
                            marginBottom: '1.25rem', paddingBottom: '1rem',
                            borderBottom: '2px solid #000',
                          }}>
                            <p style={{
                              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.15em',
                              textTransform: 'uppercase', margin: '0 0 0.65rem',
                              backgroundColor: '#000', color: '#fff',
                              padding: '0.3rem 0.65rem', display: 'inline-block',
                            }}>
                              LOCAL RESOURCES — {resolvedLocation.city}, {resolvedLocation.stateCode}
                            </p>
                            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                              {(LOCAL_RESOURCES[category as HelpCategory]?.[subcategory!] ?? []).map((entry) => (
                                <li key={entry.url}>
                                  <a
                                    href={entry.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      fontSize: '0.85rem', fontWeight: 700, color: '#000',
                                      textDecoration: 'none', borderBottom: '1px solid #000',
                                    }}
                                  >
                                    • {entry.title} ↗
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Expandable resource cards */}
                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {(RESOURCE_DATA[category as HelpCategory]?.[subcategory] ?? []).map((link) => {
                            const isOpen = expandedCard === link.url;
                            const detailId = `card-detail-${link.url.replace(/[^a-z0-9]/gi, '-')}`;
                            return (
                              <li key={link.url} style={{ borderBottom: '2px solid #000' }}>

                                {/* ── Collapsed row ── */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', padding: '0.8rem 0' }}>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <a
                                      href={link.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        fontWeight: 700, fontSize: '0.95rem', color: '#000',
                                        textDecoration: 'none', borderBottom: '2px solid #000',
                                        display: 'inline-block', marginBottom: '0.15rem',
                                      }}
                                    >
                                      {link.title} ↗
                                    </a>
                                    {link.description && (
                                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#555', lineHeight: 1.4 }}>
                                        {link.description}
                                      </p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => {
                                      setExpandedCard(isOpen ? null : link.url);
                                      previewRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    aria-expanded={isOpen}
                                    aria-controls={detailId}
                                    style={{
                                      flexShrink: 0, border: '2px solid #000',
                                      backgroundColor: isOpen ? '#000' : '#f3f3f3',
                                      color: isOpen ? '#fff' : '#000',
                                      padding: '0.25rem 0.6rem', cursor: 'pointer',
                                      fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.06em',
                                      textTransform: 'uppercase', fontFamily: 'inherit',
                                      whiteSpace: 'nowrap', alignSelf: 'flex-start',
                                      marginTop: '0.1rem',
                                    }}
                                  >
                                    {isOpen ? 'Close ▲' : 'Expand ▼'}
                                  </button>
                                </div>

                                {/* ── Expanded detail block ── */}
                                <AnimatePresence initial={false}>
                                  {isOpen && (
                                    <motion.div
                                      id={detailId}
                                      key="detail"
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                                      style={{ overflow: 'hidden' }}
                                    >
                                      <div style={{
                                        borderTop: '1px solid #ddd',
                                        padding: '0.85rem 0 1.1rem',
                                        display: 'flex', flexDirection: 'column', gap: '0.75rem',
                                        backgroundColor: '#fafafa',
                                        paddingLeft: '0.75rem', paddingRight: '0.75rem',
                                        marginBottom: '0.5rem',
                                      }}>

                                        {/* Details */}
                                        <div>
                                          <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', margin: '0 0 0.25rem' }}>
                                            Details
                                          </p>
                                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#222', lineHeight: 1.55 }}>
                                            {link.description ?? 'Visit the link above for more information about this resource and available services.'}
                                          </p>
                                        </div>

                                        {/* Eligibility */}
                                        <div>
                                          <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', margin: '0 0 0.25rem' }}>
                                            Eligibility
                                          </p>
                                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#222', lineHeight: 1.55 }}>
                                            Eligibility varies by program and location. Contact the resource directly to confirm requirements.
                                          </p>
                                        </div>

                                        {/* How to apply */}
                                        <div>
                                          <p style={{ fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#888', margin: '0 0 0.25rem' }}>
                                            How to Apply
                                          </p>
                                          <p style={{ margin: 0, fontSize: '0.85rem', color: '#222', lineHeight: 1.55 }}>
                                            Visit{' '}
                                            <a href={link.url} target="_blank" rel="noreferrer"
                                              style={{ color: '#000', fontWeight: 600, borderBottom: '1px solid #999' }}>
                                              {link.url}
                                            </a>
                                            {' '}to get started, or{' '}
                                            <a href={link.url} target="_blank" rel="noreferrer"
                                              style={{ color: '#000', fontWeight: 700, borderBottom: '2px solid #000' }}>
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
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '180px', color: '#bbb' }}
                      >
                        <p style={{
                          fontSize: '1rem', fontWeight: 700,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                        }}>
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

      </div>{/* end max-width container */}
    </motion.main>
  );
}
