import Link from 'next/link';
import {
  FaHome,
  FaUtensils,
  FaDollarSign,
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaChevronRight,
} from 'react-icons/fa';

/* ─────────────────────────────────────────────
   Nav
   ───────────────────────────────────────────── */

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'Resources', href: '/help' },
  { label: 'About', href: '/about' },
] as const;

/* ─────────────────────────────────────────────
   Category data
   ───────────────────────────────────────────── */

const CATEGORIES = [
  {
    key: 'housing',
    number: '01',
    label: 'Housing',
    Icon: FaHome,
    tagline: 'Shelter, rent aid, and temporary housing options.',
    items: ['Emergency shelter', 'Rent assistance', 'Temporary housing'],
  },
  {
    key: 'food',
    number: '02',
    label: 'Food',
    Icon: FaUtensils,
    tagline: 'Food banks, prepared meals, and nutrition programs.',
    items: ['Food banks', 'Meal programs', 'Nutrition support'],
  },
  {
    key: 'cash',
    number: '03',
    label: 'Cash Assistance',
    Icon: FaDollarSign,
    tagline: 'Emergency funds, relief grants, and one-time aid.',
    items: ['Emergency cash', 'Relief funds', 'One-time grants'],
  },
  {
    key: 'disaster',
    number: '04',
    label: 'Disaster Recovery',
    Icon: FaExclamationTriangle,
    tagline: 'Immediate aid, temporary housing, and rebuilding help.',
    items: ['Recovery aid', 'Temporary housing', 'Rebuilding help'],
  },
] as const;

/* ─────────────────────────────────────────────
   Page (Server Component — no 'use client')
   ───────────────────────────────────────────── */

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-[#eef0f2]">

      {/* ══════════════ NAV ══════════════ */}
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
              className={[
                'px-5 py-2 bg-white border-[3px] border-black',
                'font-bold text-sm uppercase tracking-wide',
                'hover:bg-black hover:text-white transition-colors duration-150',
                i > 0 ? '-ml-[3px]' : '',
              ].join(' ')}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* ══════════════ HERO ══════════════ */}
      <section className="bg-white border-b-4 border-black py-10 md:py-14">
        <div className="max-w-6xl mx-auto px-6 md:px-8">

          {/* Eyebrow tag */}
          <p className="inline-flex items-center text-xs font-bold uppercase tracking-[0.15em] text-black/50 border-[2px] border-black/25 px-2.5 py-1 mb-6">
            Local assistance — housing, food, cash &amp; disaster
          </p>

          {/* Main title */}
          <h1
            className="font-black uppercase leading-none tracking-tight text-black"
            style={{ fontSize: 'clamp(3rem, 9vw, 7rem)' }}
          >
            Resources
            <span className="text-red-600">!</span>
            <br />
            Nearby.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base md:text-lg text-black/60 max-w-xl leading-relaxed">
            Find verified local programs near you. Select a category below to
            see what&apos;s available — nothing is submitted automatically.
          </p>
        </div>
      </section>

      {/* ══════════════ SECTION LABEL ══════════════ */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 pt-8 pb-4">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-black/40">
          Choose a category
        </p>
        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight mt-1">
          What can we help with?
        </h2>
      </div>

      {/* ══════════════ CATEGORY GRID ══════════════ */}
      <main className="pb-16">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

            {/* ── Left column: stacked panels ── */}
            <div>
              {CATEGORIES.map(({ key, label, tagline }) => (
                <div
                  key={key}
                  className="border-t-[3px] border-black last:border-b-[3px] py-6 flex justify-between items-start"
                >
                  <div>
                    <h3 className="text-base font-black uppercase tracking-tight leading-none">
                      {label}
                    </h3>
                    <p className="mt-1.5 text-sm text-black/50 leading-snug max-w-xs">
                      {tagline}
                    </p>
                  </div>
                  <FaChevronRight
                    size={13}
                    className="text-black/25 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                </div>
              ))}
            </div>

            {/* ── Right column: preview panel ── */}
            <div className="border-[3px] border-black min-h-[420px] bg-white flex items-center justify-center">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-neutral-400">
                Preview panel
              </span>
            </div>

          </div>

          {/* Fine print */}
          <p className="mt-10 text-xs text-black/35 max-w-lg leading-relaxed">
            Program availability varies by location. Nothing on this page
            constitutes an application or enrollment. Sources are manually
            reviewed before listing.
          </p>
        </div>
      </main>

      {/* ══════════════ FOOTER ══════════════ */}
      <footer className="flex items-center justify-center gap-3 py-10 border-t-[3px] border-black/10">
        <span className="text-3xl md:text-4xl font-black uppercase tracking-tight text-black/70 select-none">
          Help Nearby
        </span>
        <FaMapMarkerAlt className="text-3xl text-black/70" aria-hidden="true" />
      </footer>

    </div>
  );
}
