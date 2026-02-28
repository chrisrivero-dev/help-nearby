'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHome,
  FaUtensils,
  FaDollarSign,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaArrowLeft,
  FaChevronRight,
  FaTimes,
  FaCheckCircle,
} from 'react-icons/fa';
import { normalizeLocation } from '@/lib/location/normalizeLocation';
import type { NormalizedLocation } from '@/lib/location/types';
import ShelterResults from '@/components/results/ShelterResults';

/* ────────────────────────────────────────────
   Types
   ──────────────────────────────────────────── */

type HelpCategory = 'housing' | 'food' | 'cash' | 'disaster';

interface CategoryItem {
  title: string;
  desc: string;
}

interface Category {
  key: HelpCategory;
  label: string;
  icon: React.ReactNode;
  items: CategoryItem[];
}

/* ────────────────────────────────────────────
   Categories
   ──────────────────────────────────────────── */

const CATEGORIES: Category[] = [
  {
    key: 'housing',
    label: 'Housing',
    icon: <FaHome size={56} />,
    items: [
      {
        title: 'Shelter',
        desc: 'Immediate shelter options for individuals or families',
      },
      {
        title: 'Rent assistance',
        desc: 'Help paying rent or preventing eviction',
      },
      {
        title: 'Temporary housing',
        desc: 'Short-term housing while you search for something permanent',
      },
    ],
  },
  {
    key: 'food',
    label: 'Food',
    icon: <FaUtensils size={56} />,
    items: [
      {
        title: 'Food banks',
        desc: 'Local food banks providing groceries at no cost',
      },
      {
        title: 'Meal programs',
        desc: 'Prepared meals offered by community organizations',
      },
      {
        title: 'Nutrition support',
        desc: 'Programs like SNAP or WIC that help cover food costs',
      },
    ],
  },
  {
    key: 'cash',
    label: 'Cash assistance',
    icon: <FaDollarSign size={56} />,
    items: [
      {
        title: 'Emergency cash',
        desc: 'Short-term financial assistance for urgent needs',
      },
      {
        title: 'Relief funds',
        desc: 'Public or nonprofit funds during hardship',
      },
      {
        title: 'One-time grants',
        desc: 'Single-payment grants for specific situations',
      },
    ],
  },
  {
    key: 'disaster',
    label: 'Disaster recovery',
    icon: <FaExclamationTriangle size={56} />,
    items: [
      {
        title: 'Recovery aid',
        desc: 'Immediate help after a disaster to stabilize your situation',
      },
      {
        title: 'Temporary housing',
        desc: 'Short-term housing during repairs or rebuilding',
      },
      {
        title: 'Rebuilding help',
        desc: 'Longer-term assistance to repair or rebuild homes',
      },
    ],
  },
];

/* ────────────────────────────────────────────
   Nav links
   ──────────────────────────────────────────── */

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Resources', href: '/help' },
  { label: 'About', href: '/about' },
] as const;

/* ────────────────────────────────────────────
   Page
   ──────────────────────────────────────────── */

export default function HelpPage() {
  const [zipInput, setZipInput] = useState('');
  const [location, setLocation] = useState<NormalizedLocation | null>(null);
  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [zipError, setZipError] = useState(false);

  const showResults = Boolean(location && category && subcategory);
  const activeCategory = CATEGORIES.find((c) => c.key === category) ?? null;
  const isHousingShelter =
    category === 'housing' && subcategory === 'shelter';

  /* ── Handlers ── */

  function handleZipSubmit() {
    const resolved = normalizeLocation(zipInput);
    if (!resolved.isValid) {
      setZipError(true);
      return;
    }
    setZipError(false);
    setLocation(resolved);
  }

  function handleCategoryClick(key: HelpCategory) {
    if (category === key) {
      setCategory(null);
      setSubcategory(null);
    } else {
      setCategory(key);
      setSubcategory(null);
    }
  }

  function handleSubcategoryClick(itemTitle: string) {
    if (!location) {
      setZipError(true);
      return;
    }
    const normalized = itemTitle.toLowerCase().trim().replace(/\s+/g, '-');
    setSubcategory(normalized);
  }

  function handleReset() {
    setCategory(null);
    setSubcategory(null);
  }

  /* ── Render ── */

  return (
    <div className="min-h-screen bg-[#eef0f2]">
      {/* ═══════════ NAV ═══════════ */}
      <nav className="flex items-center justify-between px-6 md:px-10 py-4 bg-[#e4e9ef] border-b-4 border-black">
        <div className="flex items-center gap-2.5">
          <FaMapMarkerAlt className="text-2xl" />
          <span className="text-xl font-extrabold uppercase tracking-tight">
            Help Nearby
          </span>
        </div>

        <div className="flex gap-0">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.label}
              href={link.href}
              className={`px-5 py-2 bg-white border-[3px] border-black font-bold text-sm uppercase tracking-wide
                hover:bg-black hover:text-white transition-colors duration-150
                ${i > 0 ? '-ml-[3px]' : ''}`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ═══════════ HERO ═══════════ */}
      <section className="px-6 md:px-10 py-10 bg-white border-b-4 border-black">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight leading-none mb-3">
            Resources<span className="text-red-600">!</span> Nearby.
          </h1>
          <p className="text-base text-gray-500 mb-8 max-w-lg">
            Find local assistance for housing, food, cash, and disaster
            recovery. Your answers help narrow down programs — nothing is
            submitted automatically.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <input
                type="text"
                value={zipInput}
                onChange={(e) => {
                  setZipInput(e.target.value.replace(/\D/g, ''));
                  setZipError(false);
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleZipSubmit()}
                placeholder="ZIP code"
                maxLength={5}
                className={`w-44 px-4 py-3 border-[3px] text-lg font-semibold
                  placeholder:text-gray-400 placeholder:font-normal
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${
                    zipError
                      ? 'border-red-500 focus:ring-red-400'
                      : 'border-black focus:ring-black'
                  }`}
              />
              {zipError && (
                <span className="absolute -bottom-6 left-0 text-red-600 text-xs font-semibold">
                  Enter a valid 5-digit ZIP
                </span>
              )}
            </div>

            <motion.button
              onClick={handleZipSubmit}
              className="px-7 py-3 bg-black text-white font-bold text-base uppercase tracking-wide
                border-[3px] border-black hover:bg-gray-900 transition-colors"
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.1 }}
            >
              Go
            </motion.button>

            <AnimatePresence>
              {location && (
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#e4e9ef] border-[2px] border-black/20"
                >
                  <FaCheckCircle className="text-green-600 text-sm" />
                  <span className="text-sm font-bold">
                    {location.city}, {location.stateCode}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ═══════════ MAIN ═══════════ */}
      <main className="px-6 md:px-10 py-12">
        <AnimatePresence mode="wait">
          {showResults ? (
            /* ─── Results View ─── */
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="max-w-3xl mx-auto"
            >
              <motion.button
                onClick={handleReset}
                className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide mb-6
                  hover:underline underline-offset-4"
                whileTap={{ scale: 0.97 }}
              >
                <FaArrowLeft className="text-xs" />
                Back to options
              </motion.button>

              <div className="bg-white border-[3px] border-black p-6 md:p-8">
                {isHousingShelter ? (
                  <>
                    <h2 className="text-2xl font-black uppercase tracking-tight mb-1">
                      Shelter near {location!.city}, {location!.stateCode}
                    </h2>
                    <p className="text-sm text-gray-500 mb-6">
                      Emergency shelter options based on ZIP {zipInput}.
                    </p>
                    <ShelterResults location={location!} />
                  </>
                ) : (
                  <div className="py-8 text-center">
                    <p className="text-xl font-bold mb-2">
                      Results coming soon
                    </p>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                      We&apos;re working on connecting verified data sources for
                      this category. Check back or explore other options.
                    </p>
                    <motion.button
                      onClick={handleReset}
                      className="mt-6 px-5 py-2.5 bg-black text-white text-sm font-bold uppercase tracking-wide
                        border-[3px] border-black"
                      whileTap={{ scale: 0.96 }}
                    >
                      Explore other options
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            /* ─── Selection View ─── */
            <motion.div
              key="selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <h2 className="text-xl md:text-2xl font-bold text-center mb-10">
                Choose the option that best matches your situation
              </h2>

              {/* Category Grid */}
              <div className="grid grid-cols-2 gap-4 md:gap-5 max-w-2xl mx-auto">
                {CATEGORIES.map((cat) => {
                  const isActive = category === cat.key;
                  return (
                    <motion.button
                      key={cat.key}
                      onClick={() => handleCategoryClick(cat.key)}
                      className={`relative flex flex-col items-center gap-3 p-6 md:p-8
                        border-[3px] transition-all duration-200 cursor-pointer text-center
                        ${
                          isActive
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black border-black/25 hover:border-black'
                        }`}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.1 }}
                    >
                      <div className={isActive ? 'text-white' : 'text-black'}>
                        {cat.icon}
                      </div>
                      <span className="text-sm md:text-base font-bold uppercase tracking-wider">
                        {cat.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {/* Subcategory Panel */}
              <AnimatePresence mode="wait">
                {activeCategory && (
                  <motion.div
                    key={`sub-${category}`}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="max-w-2xl mx-auto mt-5"
                  >
                    <div className="bg-white border-[3px] border-black p-5 md:p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-black uppercase tracking-wide">
                          {activeCategory.label} — select an option
                        </h3>
                        <motion.button
                          onClick={() => setCategory(null)}
                          className="w-8 h-8 flex items-center justify-center border-[2px] border-black/20
                            hover:border-black hover:bg-black hover:text-white transition-all duration-150"
                          whileTap={{ scale: 0.9 }}
                          aria-label="Close"
                        >
                          <FaTimes className="text-sm" />
                        </motion.button>
                      </div>

                      <div className="flex flex-col gap-2.5">
                        {activeCategory.items.map((item, idx) => (
                          <motion.button
                            key={item.title}
                            onClick={() =>
                              handleSubcategoryClick(item.title)
                            }
                            className="w-full text-left px-4 py-3.5 border-[2px] border-black/15
                              hover:border-black hover:bg-[#f6f7f9]
                              transition-all duration-150 flex items-center justify-between group"
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: idx * 0.06,
                              duration: 0.2,
                            }}
                            whileTap={{ scale: 0.99 }}
                          >
                            <div className="pr-4">
                              <p className="font-bold text-[0.95rem] leading-snug">
                                {item.title}
                              </p>
                              <p className="text-sm text-gray-500 mt-0.5 leading-snug">
                                {item.desc}
                              </p>
                            </div>
                            <FaChevronRight
                              className="text-black/25 group-hover:text-black
                                group-hover:translate-x-0.5 transition-all duration-150 shrink-0"
                            />
                          </motion.button>
                        ))}
                      </div>

                      {!location && (
                        <p className="mt-4 text-xs text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-3 py-2">
                          Enter your ZIP code above before selecting an option.
                        </p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Disclaimer */}
              <p className="text-center text-sm text-gray-400 mt-12 max-w-md mx-auto leading-relaxed">
                Your selections help narrow down public programs you may want to
                explore. Nothing is submitted automatically.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="flex items-center justify-center gap-3 py-10 border-t-[3px] border-black/10">
        <span className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black/70 select-none">
          Help Nearby
        </span>
        <FaMapMarkerAlt className="text-3xl text-black/70" />
      </footer>
    </div>
  );
}
