'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHome,
  FaUtensils,
  FaDollarSign,
  FaExclamationTriangle,
  FaMapMarkerAlt,
} from 'react-icons/fa';

type HelpType = 'housing' | 'food' | 'cash' | 'disaster' | null;
type Side = 'left' | 'right';

interface Category {
  key: Exclude<HelpType, null>;
  label: string;
  side: Side;
  icon: React.ReactNode;
  items: { title: string; desc: string }[];
}

const CATEGORIES: Category[] = [
  {
    key: 'housing',
    label: 'Housing',
    side: 'left',
    icon: <FaHome size={84} />,
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
    key: 'cash',
    label: 'Cash assistance',
    side: 'left',
    icon: <FaDollarSign size={84} />,
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
    key: 'food',
    label: 'Food',
    side: 'left',
    icon: <FaUtensils size={84} />,
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
    key: 'disaster',
    label: 'Disaster recovery',
    side: 'left',
    icon: <FaExclamationTriangle size={84} />,
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

export default function HelpFlow() {
  const [hovered, setHovered] = useState<HelpType>(null);

  return (
    <section className="hn-help-section">
      <div className="hn-help-card">
        <header className="hn-help-header">
          <h2>What kind of help are you looking for?</h2>
          <p>Choose the option that best matches your situation.</p>
        </header>

        <div className="hn-choice-grid">
          {CATEGORIES.map((cat) => {
            const isHovered = hovered === cat.key;
            const dimmed = hovered !== null && !isHovered;

            return (
              <motion.div
                key={cat.key}
                className={`hn-category-row ${cat.side}`}
                onMouseEnter={() => setHovered(cat.key)}
                onMouseLeave={() => setHovered(null)}
                animate={{ opacity: dimmed ? 0.35 : 1 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
              >
                {/* ICON → LEFT, CONTENT → RIGHT */}
                <motion.div
                  className="hn-icon-col"
                  animate={
                    isHovered ? { x: 14, scale: 1.06 } : { x: 0, scale: 1 }
                  }
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                >
                  <div className="hn-help-anchor-icon">{cat.icon}</div>
                  <div className="hn-help-anchor-label">{cat.label}</div>
                </motion.div>

                <div className="hn-spacer-col" />

                <div className="hn-bubble-col">
                  <AnimatePresence>
                    {isHovered && <RevealItems items={cat.items} />}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        <p className="hn-footer-note">
          Your answers help narrow down public programs you may want to explore.
          Nothing is submitted automatically.
        </p>

        {/* BOTTOM SUPPORT IMAGE */}
        <div className="hn-bottom-image">
          <img
            src="/images/help-support.jpg"
            alt="People helping and supporting one another"
          />
        </div>

        {/* BOTTOM BRAND */}
        <div className="hn-bottom-banner">
          <span className="hn-bottom-brand">HELP! NEARBY.</span>
          <FaMapMarkerAlt className="hn-bottom-icon" />
        </div>
      </div>{' '}
      {/* ← closes hn-help-card */}
    </section>
  );
}

/* ----------------------------- */
/* REVEAL ITEMS (STAGGERED) */
/* ----------------------------- */

function RevealItems({ items }: { items: { title: string; desc: string }[] }) {
  return (
    <motion.div
      className="hn-reveal-stack"
      initial="hidden"
      animate="show"
      exit="hidden"
      variants={{
        hidden: { opacity: 0 },
        show: {
          opacity: 1,
          transition: {
            staggerChildren: 0.1, // subtle, professional
          },
        },
      }}
    >
      {items.map((item) => (
        <motion.button
          key={item.title}
          className="hn-soft-card"
          variants={{
            hidden: { opacity: 0, y: 6 },
            show: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          whileHover={{
            y: -2,
            scale: 1.015,
            boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
          }}
          type="button"
        >
          <div className="hn-soft-title">{item.title}</div>
          <div className="hn-soft-desc">{item.desc}</div>
        </motion.button>
      ))}
    </motion.div>
  );
}
