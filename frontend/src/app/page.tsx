'use client';

import { useState } from 'react';

export default function Home() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(1);

  return (
    <main className="max-w-5xl mx-auto px-6 py-24">
      {/* Landing view */}
      {!started && (
        <section className="space-y-6">
          <h1 className="text-5xl font-semibold tracking-tight">
            Find local help without guessing
          </h1>

          <p className="text-lg text-neutral-600 max-w-xl">
            Answer a few simple questions to see which assistance programs may be
            relevant near you.
          </p>

          <button
            onClick={() => {
              setStarted(true);
              setStep(1);
            }}
            className="inline-flex items-center rounded-full px-6 py-3 text-white bg-black hover:bg-neutral-800 transition"
          >
            Explore help options →
          </button>

          <p className="text-sm text-neutral-500">
            We don’t collect documents or submit applications. Official
            applications happen on program sites.
          </p>
        </section>
      )}

      {/* Question flow */}
      {started && (
        <section className="space-y-10">
          <h2 className="text-3xl font-medium">
            First, let’s understand your situation
          </h2>

          {/* Step 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-lg">
                What kind of help are you looking for?
              </p>

              <div className="flex flex-wrap gap-3">
                {['Housing', 'Food', 'Cash assistance', 'Disaster recovery'].map(
                  (label) => (
                    <button
                      key={label}
                      onClick={() => setStep(2)}
                      className="px-4 py-2 rounded-full border border-neutral-300 hover:border-black transition"
                    >
                      {label}
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {/* Step 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-lg">Where are you currently located?</p>

              <select
                onChange={() => setStep(3)}
                className="border border-neutral-300 rounded-lg px-4 py-2 max-w-xs"
                defaultValue=""
              >
                <option value="" disabled>
                  Select a location
                </option>
                <option>Los Angeles County</option>
                <option>Orange County</option>
                <option>New York City</option>
              </select>
            </div>
          )}

          {/* Step 3 (placeholder for now) */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-lg">
                Thanks — we can now show relevant starting points.
              </p>

              <p className="text-sm text-neutral-500 max-w-xl">
                This tool helps you find where to start. It does not determine
                eligibility or submit applications.
              </p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
