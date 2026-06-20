'use client';

import { useState } from 'react';
import type { FC } from 'react';
import type { NearbyResource } from '@/lib/resources/schema';
import { useTheme } from '@/components/useTheme';

interface Props {
  resource: NearbyResource;
  onClose: () => void;
}

const ISSUE_TYPES = [
  { value: 'wrong_hours', label: 'Wrong hours' },
  { value: 'closed', label: 'Appears to be closed / permanently closed' },
  { value: 'wrong_phone', label: 'Wrong phone number' },
  { value: 'wrong_address', label: 'Wrong address' },
  { value: 'not_offering_service', label: 'No longer offering this service' },
  { value: 'other', label: 'Other issue' },
] as const;

type IssueType = (typeof ISSUE_TYPES)[number]['value'];
type FormState = 'idle' | 'submitting' | 'success' | 'error';

export const ReportListingIssueModal: FC<Props> = ({ resource, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [issueType, setIssueType] = useState<IssueType | ''>('');
  const [detail, setDetail] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const bg = isDark ? '#0d0d0d' : '#f9f9f9';
  const border = isDark ? '#252525' : '#e0e0e0';
  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#666' : '#888';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!issueType) return;

    setFormState('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/resource-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceSnapshot: {
            name: resource.name,
            address: resource.address,
          },
          issueType,
          detail: detail.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data?.error ?? 'Something went wrong.');
        setFormState('error');
        return;
      }

      setFormState('success');
    } catch {
      setErrorMsg('Connection error. Please try again.');
      setFormState('error');
    }
  }

  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        padding: '0.75rem 1rem',
        marginTop: '0.5rem',
      }}
      role="group"
      aria-labelledby="report-title"
    >
        <h2
          id="report-title"
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 800,
            fontSize: '0.72rem',
            letterSpacing: '0.12em',
            color: cardText,
            margin: '0 0 0.25rem 0',
          }}
        >
          REPORT LISTING ISSUE
        </h2>
        <p
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.68rem',
            color: mutedText,
            margin: '0 0 1rem 0',
          }}
        >
          {resource.name}
        </p>

        {formState === 'success' ? (
          <div>
            <p
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.72rem',
                color: cardText,
                margin: '0 0 1rem 0',
                lineHeight: 1.6,
              }}
            >
              Thanks — a Help Nearby admin will review this report.
            </p>
            <button
              type="button"
              onClick={onClose}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontWeight: 700,
                fontSize: '0.65rem',
                letterSpacing: '0.08em',
                color: cardText,
                background: 'none',
                border: `1px solid ${border}`,
                padding: '0.35rem 0.8rem',
                cursor: 'pointer',
              }}
            >
              CLOSE
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.65rem',
                  color: mutedText,
                  marginBottom: '0.4rem',
                  letterSpacing: '0.06em',
                }}
              >
                WHAT IS THE ISSUE?
              </legend>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                {ISSUE_TYPES.map((it) => (
                  <label
                    key={it.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      fontFamily: "'Poppins', sans-serif",
                      fontSize: '0.7rem',
                      color: cardText,
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="radio"
                      name="issueType"
                      value={it.value}
                      checked={issueType === it.value}
                      onChange={() => setIssueType(it.value)}
                      style={{ accentColor: '#fbbf24' }}
                    />
                    {it.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value.slice(0, 500))}
              placeholder="Optional details (what you observed, when)"
              rows={3}
              style={{
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.68rem',
                color: cardText,
                background: isDark ? '#111' : '#fff',
                border: `1px solid ${border}`,
                padding: '0.4rem 0.6rem',
                resize: 'vertical',
                outline: 'none',
              }}
            />

            {errorMsg && (
              <p style={{ fontFamily: "'Poppins', sans-serif", fontSize: '0.68rem', color: '#ef4444', margin: 0 }}>
                {errorMsg}
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.6rem' }}>
              <button
                type="submit"
                disabled={!issueType || formState === 'submitting'}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontWeight: 700,
                  fontSize: '0.65rem',
                  letterSpacing: '0.08em',
                  color: '#000',
                  background: '#fbbf24',
                  border: 'none',
                  padding: '0.35rem 0.8rem',
                  cursor: !issueType ? 'default' : 'pointer',
                  opacity: !issueType ? 0.5 : 1,
                }}
              >
                {formState === 'submitting' ? 'SENDING…' : 'REPORT'}
              </button>
              <button
                type="button"
                onClick={onClose}
                style={{
                  fontFamily: "'Poppins', sans-serif",
                  fontSize: '0.65rem',
                  color: mutedText,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
    </div>
  );
};
