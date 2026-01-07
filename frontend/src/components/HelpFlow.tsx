'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FaHome,
  FaUtensils,
  FaDollarSign,
  FaExclamationTriangle,
} from 'react-icons/fa';

// prettier-ignore
type HelpType =
  | 'housing'
  | 'food'
  | 'cash'
  | 'disaster'
  | null;

export default function HelpFlow() {
  const [selectedHelp, setSelectedHelp] = useState<HelpType>(null);

  return (
    <section className="max-w-5xl mx-auto px-6 py-24">
      {/* -------------------------------------------------- */}
      {/* STEP 1 — ICON SELECTION                            */}
      {/* -------------------------------------------------- */}
      {!selectedHelp && (
        <div className="space-y-10">
          <h2 className="text-3xl font-medium">
            What kind of help are you looking for?
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
        </div>
      )}

      {/* -------------------------------------------------- */}
      {/* STEP 2 — ABOUT / WHAT HAPPENS NEXT                 */}
      {/* -------------------------------------------------- */}
      {selectedHelp && (
        <div className="mt-24 space-y-12 max-w-3xl">
          <h2 className="text-3xl font-medium">
            Here’s how we help you find a place to start
          </h2>

          <p className="text-lg text-neutral-600">
            Help Nearby helps you explore assistance programs that may be
            relevant based on what you share. We organize public information so
            you can see where to start without guessing.
          </p>

          {/* STEP FLOW */}
          <div className="space-y-6">
            <Step
              number={1}
              title="We ask a few simple questions"
              description="Location and situation help narrow down relevant programs."
            />

            <Step
              number={2}
              title="We show possible starting points"
              description="You’ll see links to official sites that match your needs."
            />

            <Step
              number={3}
              title="You decide what to explore"
              description="Applications and decisions always happen on official program websites."
            />
          </div>

          {/* TRUST BOUNDARY */}
          <p className="text-sm text-neutral-500">
            We don’t collect documents, submit applications, or determine
            eligibility. This tool is for guidance only.
          </p>

          {/* NEXT QUESTION PLACEHOLDER */}
          <div className="pt-6 border-t">
            <p className="text-lg font-medium">
              What best describes your situation?
            </p>
            <p className="text-sm text-neutral-500">
              (Next step — options will appear here)
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------ */
/* Reusable components                                           */
/* ------------------------------------------------------------ */

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
    <button
      onClick={onClick}
      className="group rounded-xl border border-neutral-300 p-6 text-left hover:border-black transition"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <div className="font-medium">{label}</div>
      <div className="text-sm text-neutral-500 mt-1">{hint}</div>
    </button>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <div className="flex gap-4">
      <div className="text-neutral-400 font-mono">{number}.</div>
      <div>
        <div className="font-medium">{title}</div>
        <div className="text-neutral-600 text-sm">{description}</div>
      </div>
    </div>
  );
}
