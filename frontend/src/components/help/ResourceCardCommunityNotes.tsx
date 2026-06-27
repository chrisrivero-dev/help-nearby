'use client';

import { useState } from 'react';
import type { FC } from 'react';
import type { CommunityTip } from '@/lib/community/types';
import { useTheme } from '@/components/useTheme';

interface Props {
  tips: CommunityTip[];
}

export const ResourceCardCommunityNotes: FC<Props> = ({ tips }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [showAll, setShowAll] = useState(false);

  const noteBg = isDark ? '#0a0a0a' : '#f7f7f5';
  const noteBorder = isDark ? '#1e1e1e' : '#e8e8e4';
  const mutedText = isDark ? '#7a7a7a' : '#888';
  const noteText = isDark ? '#c4c4c4' : '#333333';

  if (tips.length === 0) return null;

  const displayed = showAll ? tips : tips.slice(0, 2);
  const overflow = tips.length - 2;

  return (
    <div style={{ marginTop: '0.5rem' }}>
      <div
        style={{
          background: noteBg,
          border: `1px solid ${noteBorder}`,
          padding: '0.55rem 0.7rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.45rem',
        }}
      >
        <span
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.58rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: mutedText,
          }}
        >
          COMMUNITY NOTES · REVIEWED BY HELP NEARBY
        </span>

        {displayed.map((tip) => (
          <div key={tip.id}>
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.7rem',
                color: noteText,
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              {tip.body}
            </p>
            {(tip.submitterName || tip.visitedOn) && (
              <span
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.6rem',
                  color: mutedText,
                  display: 'block',
                  marginTop: '0.18rem',
                }}
              >
                {tip.submitterName && `— ${tip.submitterName}`}
                {tip.visitedOn && ` · ${tip.visitedOn}`}
              </span>
            )}
          </div>
        ))}

        {!showAll && overflow > 0 && (
          <button
            type="button"
            onClick={() => setShowAll(true)}
            style={{
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.62rem',
              color: mutedText,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textAlign: 'left',
            }}
          >
            +{overflow} more note{overflow > 1 ? 's' : ''}
          </button>
        )}
      </div>
    </div>
  );
};
