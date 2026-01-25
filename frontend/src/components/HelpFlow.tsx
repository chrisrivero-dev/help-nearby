'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaHome,
  FaUtensils,
  FaMapMarkerAlt,
  FaDollarSign,
  FaExclamationTriangle,
  FaTimes,
} from 'react-icons/fa';

import HoverZipPrompt from '@/components/HoverZipPrompt';

type HelpType = 'housing' | 'food' | 'cash' | 'disaster' | null;

interface Category {
  key: Exclude<HelpType, null>;
  label: string;
  icon: React.ReactNode;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  items: { title: string; desc: string }[];
}

const CATEGORIES: Category[] = [
  {
    key: 'housing',
    label: 'Housing',
    position: 'top-left',
    icon: <FaHome size={80} />,
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
    position: 'top-right',
    icon: <FaUtensils size={80} />,
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
    position: 'bottom-left',
    icon: <FaDollarSign size={80} />,
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
    position: 'bottom-right',
    icon: <FaExclamationTriangle size={80} />,
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
  const [selected, setSelected] = useState<HelpType>(null);

  const handleIconClick = (key: HelpType) => {
    setSelected(selected === key ? null : key);
  };

  const handleItemClick = (categoryKey: string, itemTitle: string) => {
    console.log(`Selected: ${categoryKey} - ${itemTitle}`);
    alert(`You selected: ${itemTitle}`);
  };

  return (
    <section className="hn-help-section">
      {/* MAIN HEADER - MATCHES HOME PAGE */}
      <header className="hn-main-header">
        <motion.div
          className="hn-header-title"
          initial={{ x: '-100%' }}
          animate={{ x: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <motion.span
            className="hn-help-word"
            whileHover={{
              backgroundColor: '#ff0000',
              color: '#fff',
              transition: { duration: 0.2 },
            }}
          >
            HELP!
          </motion.span>{' '}
          <span>NEARBY.</span>
        </motion.div>

        <motion.div
          className="hn-header-icon"
          initial={{ y: -800, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            transition: { duration: 1.2, ease: 'easeInOut' },
          }}
          whileHover={{
            y: -10,
            transition: { duration: 0.15 },
          }}
        >
          <FaMapMarkerAlt />
        </motion.div>

        <div className="hn-header-nav">
          <motion.button
            className="hn-nav-button"
            onClick={() => (window.location.href = '/about')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ABOUT
          </motion.button>
          <motion.button
            className="hn-nav-button"
            onClick={() => (window.location.href = '/')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            BACK TO MAIN
          </motion.button>
        </div>
      </header>

      <div className="hn-help-container">
        <header className="hn-help-header">
          <div className="hn-context-label">HELP NEARBY</div>

          <HoverZipPrompt
            onZipSubmit={(zip) => {
              localStorage.setItem('helpNearbyZip', zip);
              console.log('ZIP saved:', zip);
            }}
          />

          <h2 className="hn-primary-instruction">
            Choose the option that best matches your situation
          </h2>
        </header>

        {/* GRID WITH CENTER GAP */}
        <div className="hn-icon-wrapper-grid">
          {/* TOP ROW */}
          <div className="hn-grid-row">
            {/* HOUSING (TOP LEFT) */}
            <motion.div
              className={`hn-icon-item ${selected === 'housing' ? 'selected' : ''}`}
              onClick={() => handleIconClick('housing')}
              onMouseEnter={() => setHovered('housing')}
              onMouseLeave={() => setHovered(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <motion.div
                className="hn-icon-wrapper"
                animate={
                  hovered === 'housing' || selected === 'housing'
                    ? { y: -4 }
                    : { y: 0 }
                }
              >
                <FaHome size={80} />
              </motion.div>
              <div className="hn-icon-label">Housing</div>
            </motion.div>

            {/* CENTER GAP - INFO APPEARS HERE FOR TOP ROW */}
            <div className="hn-center-gap">
              <AnimatePresence mode="wait">
                {selected === 'housing' && (
                  <InfoPanel
                    key="housing"
                    items={CATEGORIES[0].items}
                    categoryKey="housing"
                    onClose={() => setSelected(null)}
                    onItemClick={handleItemClick}
                  />
                )}
                {selected === 'food' && (
                  <InfoPanel
                    key="food"
                    items={CATEGORIES[1].items}
                    categoryKey="food"
                    onClose={() => setSelected(null)}
                    onItemClick={handleItemClick}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* FOOD (TOP RIGHT) */}
            <motion.div
              className={`hn-icon-item ${selected === 'food' ? 'selected' : ''}`}
              onClick={() => handleIconClick('food')}
              onMouseEnter={() => setHovered('food')}
              onMouseLeave={() => setHovered(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <motion.div
                className="hn-icon-wrapper"
                animate={
                  hovered === 'food' || selected === 'food'
                    ? { y: -4 }
                    : { y: 0 }
                }
              >
                <FaUtensils size={80} />
              </motion.div>
              <div className="hn-icon-label">Food</div>
            </motion.div>
          </div>

          {/* BOTTOM ROW */}
          <div className="hn-grid-row">
            {/* CASH ASSISTANCE (BOTTOM LEFT) */}
            <motion.div
              className={`hn-icon-item ${selected === 'cash' ? 'selected' : ''}`}
              onClick={() => handleIconClick('cash')}
              onMouseEnter={() => setHovered('cash')}
              onMouseLeave={() => setHovered(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <motion.div
                className="hn-icon-wrapper"
                animate={
                  hovered === 'cash' || selected === 'cash'
                    ? { y: -4 }
                    : { y: 0 }
                }
              >
                <FaDollarSign size={80} />
              </motion.div>
              <div className="hn-icon-label">Cash assistance</div>
            </motion.div>

            {/* CENTER GAP - INFO APPEARS HERE FOR BOTTOM ROW */}
            <div className="hn-center-gap">
              <AnimatePresence mode="wait">
                {selected === 'cash' && (
                  <InfoPanel
                    key="cash"
                    items={CATEGORIES[2].items}
                    categoryKey="cash"
                    onClose={() => setSelected(null)}
                    onItemClick={handleItemClick}
                  />
                )}
                {selected === 'disaster' && (
                  <InfoPanel
                    key="disaster"
                    items={CATEGORIES[3].items}
                    categoryKey="disaster"
                    onClose={() => setSelected(null)}
                    onItemClick={handleItemClick}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* DISASTER RECOVERY (BOTTOM RIGHT) */}
            <motion.div
              className={`hn-icon-item ${selected === 'disaster' ? 'selected' : ''}`}
              onClick={() => handleIconClick('disaster')}
              onMouseEnter={() => setHovered('disaster')}
              onMouseLeave={() => setHovered(null)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <motion.div
                className="hn-icon-wrapper"
                animate={
                  hovered === 'disaster' || selected === 'disaster'
                    ? { y: -4 }
                    : { y: 0 }
                }
              >
                <FaExclamationTriangle size={80} />
              </motion.div>
              <div className="hn-icon-label">Disaster recovery</div>
            </motion.div>
          </div>
        </div>

        <p className="hn-footer-note">
          Your answers help narrow down public programs you may want to explore.
          Nothing is submitted automatically.
        </p>

        {/* HELP NEARBY BANNER */}
        <div className="hn-bottom-banner">
          <span className="hn-bottom-brand">HELP NEARBY</span>
          <FaMapMarkerAlt className="hn-bottom-icon" />
        </div>
      </div>
    </section>
  );
}

// INFO PANEL COMPONENT

function InfoPanel({
  items,
  categoryKey,
  onClose,
  onItemClick,
}: {
  items: { title: string; desc: string }[];
  categoryKey: string;
  onClose: () => void;
  onItemClick: (categoryKey: string, itemTitle: string) => void;
}) {
  return (
    <motion.div
      className="hn-info-panel"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <button className="hn-close-btn" onClick={onClose} aria-label="Close">
        <FaTimes size={18} />
      </button>

      <motion.div
        className="hn-reveal-stack"
        initial="hidden"
        animate="show"
        variants={{
          hidden: { opacity: 0 },
          show: {
            opacity: 1,
            transition: {
              staggerChildren: 0.1,
              delayChildren: 0.1,
            },
          },
        }}
      >
        {items.map((item) => (
          <motion.button
            key={item.title}
            className="hn-bordered-card"
            onClick={() => onItemClick(categoryKey, item.title)}
            variants={{
              hidden: { opacity: 0, y: 10 },
              show: { opacity: 1, y: 0 },
            }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            whileHover={{
              scale: 1.02,
              boxShadow: '0 6px 20px rgba(37, 99, 235, 0.2)',
            }}
            whileTap={{ scale: 0.98 }}
            type="button"
          >
            <div className="hn-card-title">{item.title}</div>
            <div className="hn-card-desc">{item.desc}</div>
          </motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}
