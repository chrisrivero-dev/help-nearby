'use client';

import { useState } from 'react';
import HelpFlow from '@/components/HelpFlow';
import { normalizeLocation } from '@/lib/location/normalizeLocation';
import type { NormalizedLocation } from '@/lib/location/types';
import ShelterResults from '@/components/results/ShelterResults';

/* =====================
   TYPES
===================== */

type HelpCategory = 'housing' | 'food' | 'cash' | 'disaster';

/* =====================
   PAGE
===================== */

export default function HelpPage() {
  // ✅ STATE LIVES HERE (the brain)
  const [zip, setZip] = useState<string | null>(null);
  const [location, setLocation] = useState<NormalizedLocation | null>(null);
  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);

  const showResults = Boolean(location && category && subcategory);

  /* =====================
     ZIP HANDLER
  ===================== */

  function handleZipSubmit(inputZip: string) {
    const resolved = normalizeLocation(inputZip);

    if (!resolved.isValid) {
      alert('Please enter a valid ZIP code');
      return;
    }

    setZip(inputZip);
    setLocation(resolved);
    localStorage.setItem('helpNearbyLocation', JSON.stringify(resolved));
  }

  /* =====================
     RENDER
  ===================== */

  return (
    <main className="min-h-screen bg-neutral-50 flex justify-center">
      <div className="w-full max-w-6xl px-6">
        {/* 🔹 SHOW GRID (DEFAULT STATE) */}
        {!showResults && (
          <HelpFlow
            locationReady={!!location}
            onZipSubmit={handleZipSubmit}
            onCategorySelect={setCategory}
            onSubcategorySelect={setSubcategory}
          />
        )}

        {/* 🔹 CENTERED RESULTS VIEW */}
        {showResults && category === 'housing' && subcategory === 'shelter' && (
          <div className="min-h-[70vh] flex items-start justify-center mt-12">
            <div className="w-full max-w-3xl bg-white border rounded-lg shadow-lg p-6">
              <h3 className="text-2xl font-semibold mb-2">
                Shelter options near {location!.city}, {location!.stateCode}
              </h3>

              <p className="text-sm text-gray-600 mb-6">
                Showing emergency shelter options based on your ZIP code.
              </p>

              <ShelterResults location={location!} />

              <button
                className="mt-6 text-sm text-blue-600 hover:underline"
                onClick={() => {
                  setCategory(null);
                  setSubcategory(null);
                }}
              >
                ← Back to options
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
