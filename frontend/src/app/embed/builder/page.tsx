'use client';

import type { CSSProperties, FC } from 'react';
import { useEffect, useMemo, useState } from 'react';

const CATEGORY_OPTIONS = [
  { id: 'food', label: 'Food' },
  { id: 'health', label: 'Health' },
  { id: 'cooling', label: 'Cooling' },
  { id: 'recreation', label: 'Parks & Community' },
];

const ACCENT_PRESETS = ['#f59e0b', '#1d4ed8', '#16a34a', '#dc2626'];

const DEFAULT_HEIGHT = 620;

const BuilderPage: FC = () => {
  const [zip, setZip] = useState('90012');
  const [categories, setCategories] = useState<string[]>([
    'food',
    'health',
    'cooling',
  ]);
  const [radius, setRadius] = useState(10);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [accent, setAccent] = useState(ACCENT_PRESETS[0]);
  const [label, setLabel] = useState('');
  const [height, setHeight] = useState(DEFAULT_HEIGHT);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('https://helpnearby.co');

  useEffect(() => {
    if (typeof window !== 'undefined') setOrigin(window.location.origin);
  }, []);

  const query = useMemo(() => {
    const qs = new URLSearchParams();
    if (zip) qs.set('zip', zip);
    if (categories.length > 0) qs.set('categories', categories.join(','));
    if (radius !== 10) qs.set('radius', String(radius));
    if (theme === 'dark') qs.set('theme', 'dark');
    if (accent !== ACCENT_PRESETS[0]) qs.set('accent', accent.replace('#', ''));
    if (label.trim()) qs.set('label', label.trim());
    return qs.toString();
  }, [zip, categories, radius, theme, accent, label]);

  const embedPath = `/embed${query ? `?${query}` : ''}`;
  const snippet = `<iframe
  src="${origin}${embedPath}"
  width="100%"
  height="${height}"
  style="border:0;border-radius:16px;"
  title="Help Nearby resource widget"
  allow="geolocation"
></iframe>`;

  const toggleCategory = (id: string) => {
    setCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
    );
  };

  const copySnippet = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — user can select the text manually.
    }
  };

  const labelStyle: CSSProperties = {
    display: 'block',
    fontFamily: "'Poppins', sans-serif",
    fontWeight: 700,
    fontSize: '0.66rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#666',
    margin: '0 0 0.4rem',
  };

  const inputStyle: CSSProperties = {
    width: '100%',
    padding: '0.55rem 0.7rem',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.82rem',
    border: '1.5px solid #d8d8d8',
    background: '#fafafa',
    color: '#111',
    outline: 'none',
    boxSizing: 'border-box',
  };

  const fieldStyle: CSSProperties = { marginBottom: '1.1rem' };

  return (
    <main
      style={{
        fontFamily: "'Poppins', sans-serif",
        background: '#fafafa',
        color: '#111',
        minHeight: '100vh',
        padding: '2.5rem 1.5rem 4rem',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <header style={{ marginBottom: '2rem' }}>
          <h1
            style={{
              fontWeight: 800,
              fontSize: '1.5rem',
              letterSpacing: '-0.01em',
              margin: '0 0 0.5rem',
            }}
          >
            Help Nearby Embed Builder
          </h1>
          <p
            style={{
              fontSize: '0.82rem',
              color: '#666',
              lineHeight: 1.7,
              maxWidth: 620,
              margin: 0,
            }}
          >
            Configure a source-backed resource widget for your organization’s
            website, preview it live, and copy the embed code. Data comes from
            public datasets where available, with source attribution on every
            listing. Strongest current coverage: Southern California — check
            the preview for your area before embedding.
          </p>
        </header>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(min(380px, 100%), 1fr))',
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          {/* Config form */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e4e4e4',
              padding: '1.5rem',
            }}
          >
            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="builder-zip">
                Default ZIP
              </label>
              <input
                id="builder-zip"
                type="text"
                inputMode="numeric"
                maxLength={5}
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, ''))}
                style={inputStyle}
              />
            </div>

            <div style={fieldStyle}>
              <span style={labelStyle}>Categories shown</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {CATEGORY_OPTIONS.map((c) => {
                  const on = categories.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      onClick={() => toggleCategory(c.id)}
                      aria-pressed={on}
                      style={{
                        padding: '0.35rem 0.7rem',
                        fontFamily: "'Poppins', sans-serif",
                        fontWeight: 700,
                        fontSize: '0.64rem',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        background: on ? '#111' : '#f5f5f5',
                        color: on ? '#fff' : '#777',
                        border: '1px solid #d8d8d8',
                        cursor: 'pointer',
                      }}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="builder-radius">
                Search radius: {radius} miles
              </label>
              <input
                id="builder-radius"
                type="range"
                min={2}
                max={50}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <div style={fieldStyle}>
              <span style={labelStyle}>Theme</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {(['light', 'dark'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    aria-pressed={theme === t}
                    style={{
                      padding: '0.35rem 0.9rem',
                      fontFamily: "'Poppins', sans-serif",
                      fontWeight: 700,
                      fontSize: '0.64rem',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      background: theme === t ? '#111' : '#f5f5f5',
                      color: theme === t ? '#fff' : '#777',
                      border: '1px solid #d8d8d8',
                      cursor: 'pointer',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={fieldStyle}>
              <span style={labelStyle}>Accent color</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {ACCENT_PRESETS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setAccent(c)}
                    aria-label={`Accent color ${c}`}
                    aria-pressed={accent === c}
                    style={{
                      width: 28,
                      height: 28,
                      background: c,
                      border:
                        accent === c ? '2.5px solid #111' : '1px solid #d8d8d8',
                      cursor: 'pointer',
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={fieldStyle}>
              <label style={labelStyle} htmlFor="builder-label">
                Widget title (optional)
              </label>
              <input
                id="builder-label"
                type="text"
                maxLength={60}
                placeholder="e.g. Community Resources Near You"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: 0 }}>
              <label style={labelStyle} htmlFor="builder-height">
                Embed height: {height}px
              </label>
              <input
                id="builder-height"
                type="range"
                min={420}
                max={900}
                step={20}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Snippet */}
            <div
              style={{
                marginTop: '1.4rem',
                paddingTop: '1.2rem',
                borderTop: '1px solid #ececec',
              }}
            >
              <span style={labelStyle}>Embed code</span>
              <pre
                style={{
                  fontFamily: 'var(--font-geist-mono), monospace',
                  fontSize: '0.68rem',
                  lineHeight: 1.6,
                  background: '#111',
                  color: '#d4d4d4',
                  padding: '0.9rem 1rem',
                  margin: '0 0 0.6rem',
                  overflowX: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {snippet}
              </pre>
              <button
                onClick={copySnippet}
                style={{
                  padding: '0.55rem 1.2rem',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.68rem',
                  letterSpacing: '0.08em',
                  background: copied ? '#16a34a' : '#111',
                  color: '#fff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                {copied ? 'COPIED ✓' : 'COPY EMBED CODE'}
              </button>
            </div>
          </div>

          {/* Live preview */}
          <div>
            <span style={labelStyle}>Live preview</span>
            <iframe
              key={`${embedPath}-${height}`}
              src={embedPath}
              width="100%"
              height={height}
              style={{
                border: '1px solid #e4e4e4',
                borderRadius: 16,
                background: '#fff',
                display: 'block',
              }}
              title="Help Nearby widget preview"
            />
            <p
              style={{
                fontSize: '0.66rem',
                color: '#999',
                lineHeight: 1.6,
                marginTop: '0.7rem',
              }}
            >
              The preview shows live results from connected public datasets.
              Source attribution and the disclaimer footer are part of the
              widget and cannot be removed.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BuilderPage;
