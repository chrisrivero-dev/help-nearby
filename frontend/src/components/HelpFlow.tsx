'use client';

import { useState } from 'react';
import {
  FaHome,
  FaUtensils,
  FaDollarSign,
  FaExclamationTriangle,
} from 'react-icons/fa';

type HelpType = 'housing' | 'food' | 'cash' | 'disaster' | null;

/* -------------------------------------------------------------------------- */
/* Main Flow                                                                   */
/* -------------------------------------------------------------------------- */

export default function HelpFlow() {
  const [selectedHelp, setSelectedHelp] = useState<HelpType>(null);

  return (
    <section className="hn-help-section">
      <div className="hn-help-card">

        {/* -------------------------------------------------- */}
        {/* STEP 1 — CHOICE GRID                               */}
        {/* -------------------------------------------------- */}
        {!selectedHelp && (
          <div className="hn-help-step">
            <div className="hn-help-header">
              <h2>What kind of help are you looking for?</h2>
              <p>Choose the option that best matches your situation.</p>
            </div>

            <div className="hn-choice-grid">

              {/* Housing (prototype card) */}
              <IconCard
                icon={<FaHome />}
                label="Housing"
                hint="Shelter, rent help, temporary housing"
                subOptions={[
                  {
                    label: 'Rent assistance',
                    description:
                      'Help paying rent or preventing eviction through local or state programs.',
                  },
                  {
                    label: 'Temporary housing',
                    description:
                      'Short-term housing placements while you search for something permanent.',
                  },
                  {
                    label: 'Emergency shelter',
                    description:
                      'Immediate shelter options for individuals or families in crisis.',
                  },
                ]}
                onClick={() => setSelectedHelp('housing')}
              />

              {/* Food */}
              <IconCard
                icon={<FaUtensils />}
                label="Food"
                hint="Food banks, meal programs, nutrition support"
                subOptions={[
                  {
                    label: 'Food banks',
                    description:
                      'Local food banks providing groceries at no cost.',
                  },
                  {
                    label: 'Meal programs',
                    description:
                      'Prepared meals offered by community organizations.',
                  },
                  {
                    label: 'Nutrition support',
                    description:
                      'Programs like SNAP or WIC that help cover food costs.',
                  },
                ]}
                onClick={() => setSelectedHelp('food')}
              />

              {/* Cash */}
              <IconCard
                icon={<FaDollarSign />}
                label="Cash assistance"
                hint="Emergency cash, relief funds"
                subOptions={[
                  {
                    label: 'Emergency cash',
                    description:
                      'Short-term financial assistance for urgent needs.',
                  },
                  {
                    label: 'Relief funds',
                    description:
                      'Public or nonprofit funds available during hardship.',
                  },
                  {
                    label: 'One-time grants',
                    description:
                      'Single-payment grants for specific situations.',
                  },
                ]}
                onClick={() => setSelectedHelp('cash')}
              />

              {/* Disaster */}
              <IconCard
                icon={<FaExclamationTriangle />}
                label="Disaster recovery"
                hint="Recovery, temporary aid, rebuilding"
                subOptions={[
                  {
                    label: 'Recovery aid',
                    description:
                      'Immediate help after a disaster to stabilize your situation.',
                  },
                  {
                    label: 'Temporary housing',
                    description:
                      'Short-term housing while repairs or rebuilding take place.',
                  },
                  {
                    label: 'Rebuilding help',
                    description:
                      'Longer-term assistance to repair or rebuild homes.',
                  },
                ]}
                onClick={() => setSelectedHelp('disaster')}
              />

            </div>

            <p className="hn-footer-note">
              Your answers help narrow down public programs you may want to explore.
              Nothing is submitted automatically.
            </p>
          </div>
        )}

        {/* -------------------------------------------------- */}
        {/* STEP 2 — FAKE “NEXT PAGE”                          */}
        {/* -------------------------------------------------- */}
        {selectedHelp && (
          <div className="hn-next-step">
            <h2>
              {selectedHelp === 'housing' && 'Housing assistance options'}
              {selectedHelp === 'food' && 'Food assistance options'}
              {selectedHelp === 'cash' && 'Cash assistance options'}
              {selectedHelp === 'disaster' && 'Disaster recovery options'}
            </h2>

            <p>
              This is where we guide people to official programs and resources.
            </p>

            <button
              className="hn-back-button"
              onClick={() => setSelectedHelp(null)}
            >
              ← Back
            </button>
          </div>
        )}

      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Icon Card Component (AidKit-style, manual control)                          */
/* -------------------------------------------------------------------------- */

function IconCard({
  icon,
  label,
  hint,
  subOptions,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  subOptions: {
    label: string;
    description: string;
  }[];
  onClick: () => void;
}) {
  const [index, setIndex] = useState(0);
  const current = subOptions[index];

  const prev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((i) => (i - 1 + subOptions.length) % subOptions.length);
  };

  const next = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIndex((i) => (i + 1) % subOptions.length);
  };

  return (
    <button className="hn-choice-card" onClick={onClick}>
      <div className="hn-choice-icon">{icon}</div>

      <div className="hn-choice-title">{label}</div>

      {/* Static summary */}
      <div className="hn-choice-hint">{hint}</div>

      {/* Manual rotator */}
      <div className="hn-card-rotator">
        <button
          className="hn-rotator-arrow"
          onClick={prev}
          aria-label="Previous option"
        >
          ←
        </button>

        <span className="hn-rotator-label">{current.label}</span>

        <button
          className="hn-rotator-arrow"
          onClick={next}
          aria-label="Next option"
        >
          →
        </button>
      </div>

      {/* Contextual helper text */}
      <div className="hn-card-helper">
        {current.description}
      </div>

      {/* Learn more pill */}
      <div className="hn-learn-more">
        Learn more <span className="hn-learn-arrow">→</span>
      </div>
    </button>
  );
}
