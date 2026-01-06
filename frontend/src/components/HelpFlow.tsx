'use client';

import { useState } from 'react';
import {
  FaHome,
  FaUtensils,
  FaDollarSign,
  FaExclamationTriangle,
} from 'react-icons/fa';

type HelpType = 'housing' | 'food' | 'cash' | 'disaster' | null;

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
              <IconCard
                icon={<FaHome />}
                label="Housing"
                hint="Shelter, rent help, temporary housing"
                onClick={() => setSelectedHelp('housing')}
              />

              <IconCard
                icon={<FaUtensils />}
                label="Food"
                hint="Food banks, meal programs, nutrition support"
                onClick={() => setSelectedHelp('food')}
              />

              <IconCard
                icon={<FaDollarSign />}
                label="Cash assistance"
                hint="Emergency cash, relief funds"
                onClick={() => setSelectedHelp('cash')}
              />

              <IconCard
                icon={<FaExclamationTriangle />}
                label="Disaster recovery"
                hint="Recovery, temporary aid, rebuilding"
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
/* Reusable components                                                        */
/* -------------------------------------------------------------------------- */

function IconCard({
  icon,
  label,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button className="hn-choice-card" onClick={onClick}>
      <div className="hn-choice-icon">{icon}</div>
      <div className="hn-choice-title">{label}</div>
      <div className="hn-choice-hint">{hint}</div>
    </button>
  );
}
