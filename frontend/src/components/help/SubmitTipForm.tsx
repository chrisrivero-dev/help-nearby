'use client';

import { useState, useRef } from 'react';
import type { FC } from 'react';
import type { NearbyResource } from '@/lib/resources/schema';
import { useTheme } from '@/components/useTheme';

interface Props {
  resource: NearbyResource;
  onClose: () => void;
}

type FormState = 'idle' | 'submitting' | 'success' | 'error';

export const SubmitTipForm: FC<Props> = ({ resource, onClose }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [body, setBody] = useState('');
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [visitedOn, setVisitedOn] = useState('');
  const [formState, setFormState] = useState<FormState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const honeypotRef = useRef<HTMLInputElement>(null);

  const cardBg = isDark ? '#141414' : '#f9f9f9';
  const border = isDark ? '#252525' : '#e0e0e0';
  const cardText = isDark ? '#f4f4f4' : '#111111';
  const mutedText = isDark ? '#666' : '#888';
  const gold = '#fbbf24';

  const MAX = 280;
  const remaining = MAX - body.length;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;

    setFormState('submitting');
    setErrorMsg('');

    try {
      const res = await fetch('/api/community-tips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceSnapshot: {
            name: resource.name,
            address: resource.address,
            category: resource.category,
            sourceName: resource.sourceName,
          },
          body: body.trim(),
          submitterName: submitterName.trim() || undefined,
          submitterEmail: submitterEmail.trim() || undefined,
          visitedOn: visitedOn || undefined,
          website: honeypotRef.current?.value || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error === 'emergency') {
          setErrorMsg(data.message);
        } else if (res.status === 429) {
          setErrorMsg('Too many submissions. Please try again later.');
        } else {
          setErrorMsg(data?.error ?? 'Something went wrong. Please try again.');
        }
        setFormState('error');
        return;
      }

      setFormState('success');
    } catch {
      setErrorMsg('Connection error. Please try again.');
      setFormState('error');
    }
  }

  if (formState === 'success') {
    return (
      <div
        style={{
          padding: '0.75rem 1rem',
          background: cardBg,
          border: `1px solid ${border}`,
          marginTop: '0.5rem',
        }}
      >
        <p
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.72rem',
            color: cardText,
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Thanks — every submission is reviewed by a Help Nearby admin before it
          appears.{' '}
          <span style={{ color: mutedText }}>
            For emergencies, call 911. For local resources, call 211.
          </span>
        </p>
        <button
          type="button"
          onClick={onClose}
          style={{
            marginTop: '0.5rem',
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.65rem',
            color: mutedText,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
          }}
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        padding: '0.75rem 1rem',
        background: cardBg,
        border: `1px solid ${border}`,
        marginTop: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
      }}
    >
      {/* Honeypot — hidden from real users */}
      <input
        ref={honeypotRef}
        name="website"
        type="text"
        tabIndex={-1}
        aria-hidden="true"
        style={{ display: 'none' }}
        autoComplete="off"
      />

      <div style={{ position: 'relative' }}>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX))}
          placeholder="Practical tip — e.g. 'Side entrance on Oak St, bring your ID, open until 5pm on weekdays.'"
          required
          rows={3}
          style={{
            width: '100%',
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.72rem',
            color: cardText,
            background: isDark ? '#111' : '#fff',
            border: `1px solid ${border}`,
            padding: '0.5rem 0.6rem',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            lineHeight: 1.55,
          }}
        />
        <span
          style={{
            position: 'absolute',
            bottom: '0.35rem',
            right: '0.5rem',
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.6rem',
            color: remaining < 20 ? '#ef4444' : mutedText,
          }}
        >
          {remaining}
        </span>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          value={submitterName}
          onChange={(e) => setSubmitterName(e.target.value)}
          placeholder="First name (optional)"
          maxLength={60}
          style={{
            flex: 1,
            minWidth: 100,
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.68rem',
            color: cardText,
            background: isDark ? '#111' : '#fff',
            border: `1px solid ${border}`,
            padding: '0.35rem 0.5rem',
            outline: 'none',
          }}
        />
        <input
          type="date"
          value={visitedOn}
          onChange={(e) => setVisitedOn(e.target.value)}
          title="When were you there?"
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.68rem',
            color: cardText,
            background: isDark ? '#111' : '#fff',
            border: `1px solid ${border}`,
            padding: '0.35rem 0.5rem',
            outline: 'none',
          }}
        />
      </div>

      <input
        type="email"
        value={submitterEmail}
        onChange={(e) => setSubmitterEmail(e.target.value)}
        placeholder="Email (optional — never shown publicly)"
        maxLength={200}
        style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: '0.68rem',
          color: cardText,
          background: isDark ? '#111' : '#fff',
          border: `1px solid ${border}`,
          padding: '0.35rem 0.5rem',
          outline: 'none',
        }}
      />

      {errorMsg && (
        <p
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontSize: '0.68rem',
            color: '#ef4444',
            margin: 0,
          }}
        >
          {errorMsg}
        </p>
      )}

      <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
        <button
          type="submit"
          disabled={formState === 'submitting' || !body.trim()}
          style={{
            fontFamily: "'Poppins', sans-serif",
            fontWeight: 700,
            fontSize: '0.65rem',
            letterSpacing: '0.08em',
            color: '#000',
            background: gold,
            border: 'none',
            padding: '0.35rem 0.8rem',
            cursor: formState === 'submitting' ? 'wait' : 'pointer',
            opacity: !body.trim() ? 0.5 : 1,
          }}
        >
          {formState === 'submitting' ? 'SENDING…' : 'SUBMIT TIP'}
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
  );
};
