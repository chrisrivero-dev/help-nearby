import React from 'react';

export default function Home() {
  return (
    <main className="container mx-auto p-8">
      <section className="max-w-2xl">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          Find local help without guessing.
        </h1>

        <p className="text-lg mb-8">
          We bring together local assistance options to make it easier to see
          where to start.
        </p>

        <div className="flex items-center gap-4 mb-6">
          <button
            type="button"
            className="px-5 py-3 rounded-lg font-semibold border"
            aria-label="Explore help options"
          >
            Explore help options
          </button>

          <span className="text-sm opacity-80">
            No accounts. No uploads. No personal documents.
          </span>
        </div>

        <p className="text-sm opacity-80">
          This tool helps you find where to start. It does not provide official
          advice or submit applications. Applications and decisions happen on
          official sites.
        </p>
      </section>
    </main>
  );
}
