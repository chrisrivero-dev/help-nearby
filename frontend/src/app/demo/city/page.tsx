'use client';

import type { CSSProperties, FC } from 'react';

// Mock municipal page used to demonstrate the Help Nearby embed widget in a
// realistic context. Deliberately generic — "Example City" is fictional and
// the page is watermarked so screenshots cannot imply a real partnership.

const DEMO_EMBED_SRC =
  '/embed?zip=90012&categories=food,health,cooling&label=Community%20Resources%20Near%20You';

const serif: CSSProperties = {
  fontFamily: "Georgia, 'Times New Roman', serif",
};

const DemoCityPage: FC = () => {
  return (
    <main
      style={{
        background: '#f3f4f1',
        color: '#1f2937',
        minHeight: '100vh',
        paddingBottom: '4rem',
      }}
    >
      {/* Demonstration watermark */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          background: '#b45309',
          color: '#ffffff',
          textAlign: 'center',
          padding: '0.5rem 1rem',
          fontFamily: "'Poppins', sans-serif",
          fontWeight: 800,
          fontSize: '0.7rem',
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}
      >
        Demonstration — not a real city or partnership
      </div>

      {/* Mock city header */}
      <header
        style={{
          background: '#1e3a5f',
          color: '#ffffff',
          padding: '1.4rem 1.5rem',
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                ...serif,
                fontSize: '1.35rem',
                fontWeight: 700,
                letterSpacing: '0.02em',
              }}
            >
              City of Example
            </div>
            <div
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.66rem',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                opacity: 0.75,
                marginTop: '0.2rem',
              }}
            >
              Community Services Department
            </div>
          </div>
          <nav
            style={{
              display: 'flex',
              gap: '1.2rem',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.72rem',
              opacity: 0.85,
            }}
            aria-label="Mock navigation (non-functional)"
          >
            <span>Home</span>
            <span>Services</span>
            <span style={{ borderBottom: '2px solid #f59e0b' }}>
              Community Resources
            </span>
            <span>Contact</span>
          </nav>
        </div>
      </header>

      {/* Page body */}
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '2.2rem 1.5rem 0' }}>
        <h1
          style={{
            ...serif,
            fontSize: '1.7rem',
            fontWeight: 700,
            margin: '0 0 0.7rem',
          }}
        >
          Community Resources
        </h1>
        <p
          style={{
            ...serif,
            fontSize: '0.95rem',
            lineHeight: 1.75,
            color: '#4b5563',
            maxWidth: 640,
            margin: '0 0 2rem',
          }}
        >
          Residents can use the search tool below to find nearby food
          assistance, health centers, and cooling centers. Listings come from
          public datasets where available and include directions and a link to
          the original source.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(min(420px, 100%), 1fr))',
            gap: '2rem',
            alignItems: 'start',
          }}
        >
          {/* The embedded widget — exactly as a partner would paste it */}
          <iframe
            src={DEMO_EMBED_SRC}
            width="100%"
            height={620}
            style={{
              border: 0,
              borderRadius: 16,
              background: '#fff',
              boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
              display: 'block',
            }}
            title="Help Nearby resource widget"
            allow="geolocation"
          />

          {/* Mock sidebar content to make the page feel real */}
          <aside>
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e4e0',
                padding: '1.3rem 1.4rem',
                marginBottom: '1.2rem',
              }}
            >
              <h2
                style={{
                  ...serif,
                  fontSize: '1.05rem',
                  margin: '0 0 0.6rem',
                }}
              >
                About this tool
              </h2>
              <p
                style={{
                  ...serif,
                  fontSize: '0.85rem',
                  lineHeight: 1.7,
                  color: '#4b5563',
                  margin: 0,
                }}
              >
                This resource finder is powered by Help Nearby, an independent
                source-backed local aid discovery tool. It draws on public
                datasets — health centers, food banks, cooling centers, and
                parks — and shows source attribution where available. It is
                not an official government emergency alert system.
              </p>
            </div>
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e4e0',
                padding: '1.3rem 1.4rem',
              }}
            >
              <h2
                style={{
                  ...serif,
                  fontSize: '1.05rem',
                  margin: '0 0 0.6rem',
                }}
              >
                Embed this on your site
              </h2>
              <p
                style={{
                  ...serif,
                  fontSize: '0.85rem',
                  lineHeight: 1.7,
                  color: '#4b5563',
                  margin: '0 0 0.8rem',
                }}
              >
                Any city, nonprofit, clinic, school, or community organization
                can configure and embed this widget with a single iframe
                snippet — no account, no API keys.
              </p>
              <a
                href="/embed/builder"
                style={{
                  display: 'inline-block',
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 800,
                  fontSize: '0.7rem',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: '#111',
                  color: '#fff',
                  padding: '0.6rem 1.1rem',
                  textDecoration: 'none',
                }}
              >
                Open the embed builder →
              </a>
            </div>
          </aside>
        </div>

        {/* Footer disclaimer */}
        <p
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.66rem',
            color: '#9ca3af',
            lineHeight: 1.7,
            marginTop: '2.5rem',
            paddingTop: '1.2rem',
            borderTop: '1px solid #e2e4e0',
            textAlign: 'center',
          }}
        >
          This page is a demonstration created by Help Nearby. “City of
          Example” is fictional. No partnership, endorsement, or government
          affiliation is implied. Resource data shown is live and comes from
          public datasets where available.
        </p>
      </div>
    </main>
  );
};

export default DemoCityPage;
