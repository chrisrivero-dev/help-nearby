import React from 'react';

export default function Home() {
  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-4">
        Welcome to the Project Starter Kit!
      </h1>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Stack Overview</h2>
        <ul className="list-disc list-inside">
          <li>Backend: Python 3.12 + Ruff linting, FastAPI</li>
          <li>Frontend: Next.js (App Router) + TypeScript</li>
          <li>State: React‑Query, Zustand</li>
          <li>Data fetching: Axios (see src/api/client.ts)</li>
          <li>Styling: Tailwind‑compatible classes, Prettier</li>
          <li>Testing: Jest & React Testing Library</li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Next Steps</h2>
        <ol className="list-decimal list-inside">
          <li>Set env vars (e.g., NEXT_PUBLIC_API_URL).</li>
          <li>Run <code>npm run format</code> to apply Prettier.</li>
          <li>Run <code>npm test</code> to see the example test pass.</li>
          <li>Start dev server: <code>npm run dev</code>.</li>
          <li>Add pages under <code>src/app/</code> and UI components under <code>src/components/</code>.</li>
        </ol>
      </section>
    </main>
  );
}
