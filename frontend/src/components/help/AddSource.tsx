'use client';

import type { CSSProperties, FC, FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { ResourceCategory } from '@/lib/resources/schema';
import { CATEGORY_LABELS } from '@/lib/resources/categories';

interface AddSourceProps {
  isDark: boolean;
  onClose: () => void;
  onAdded: () => void;
}

const initialState = {
  name: '',
  phone: '',
  website: '',
  category: 'shelter' as ResourceCategory,
  customCategoryLabel: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  websiteHoneypot: '',
};

export const AddSource: FC<AddSourceProps> = ({ isDark, onClose, onAdded }) => {
  const [form, setForm] = useState(initialState);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>(
    'idle',
  );
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const categories = useMemo(
    () => Object.keys(CATEGORY_LABELS) as ResourceCategory[],
    [],
  );

  const cardText = isDark ? '#ededed' : '#111111';
  const mutedText = isDark ? '#a3a3a3' : '#555555';
  const border = isDark ? '#2a2a2a' : '#dddddd';
  const inputBackground = isDark ? '#0a0a0a' : '#ffffff';

  const setField = (field: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    setMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const inputStyle: CSSProperties = {
    width: '100%',
    minWidth: 0,
    border: `1px solid ${border}`,
    background: inputBackground,
    color: cardText,
    padding: '0.48rem 0.55rem',
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.72rem',
    outline: 'none',
    borderRadius: 4,
  };

  const labelStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.24rem',
    minWidth: 0,
    fontFamily: "'Poppins', sans-serif",
    fontSize: '0.64rem',
    fontWeight: 800,
    letterSpacing: '0.04em',
    color: mutedText,
    textTransform: 'uppercase',
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('submitting');
    setError(null);

    try {
      const res = await fetch('/api/custom-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      };
      if (!res.ok) {
        setError(data.error ?? 'Could not add source. Please try again.');
        setStatus('idle');
        return;
      }
      setStatus('success');
      setForm(initialState);
      await onAdded();
      window.setTimeout(onClose, 450);
    } catch {
      setError('Could not add source. Please try again.');
      setStatus('idle');
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-source-title"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        zIndex: 2147483647,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        background: 'rgba(0,0,0,0.48)',
        isolation: 'isolate',
      }}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
        style={{
          width: 'min(540px, 100%)',
          maxHeight: 'min(760px, calc(100vh - 2rem))',
          overflowY: 'auto',
          background: isDark ? '#121212' : '#ffffff',
          color: cardText,
          border: `1px solid ${border}`,
          borderRadius: 8,
          boxShadow: '0 20px 60px rgba(0,0,0,0.36)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.8rem',
            padding: '0.95rem 1rem',
            borderBottom: `1px solid ${border}`,
          }}
        >
          <div>
            <h2
              id="add-source-title"
              style={{
                margin: 0,
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.86rem',
                fontWeight: 900,
                letterSpacing: '0.08em',
              }}
            >
              ADD CUSTOM SOURCE
            </h2>
            <p
              style={{
                margin: '0.25rem 0 0',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.68rem',
                color: mutedText,
                lineHeight: 1.45,
              }}
            >
              Add a source-backed resource missing from official feeds.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add source modal"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 30,
              height: 30,
              border: `1px solid ${border}`,
              borderRadius: 4,
              background: 'transparent',
              color: mutedText,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <X size={15} />
          </button>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '0.72rem',
            padding: '1rem',
          }}
        >
          <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>
            Name
            <input
              required
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Phone
            <input
              type="tel"
              value={form.phone}
              onChange={(event) => setField('phone', event.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            Category
            <select
              value={form.category}
              onChange={(event) =>
                setField('category', event.target.value as ResourceCategory)
              }
              style={inputStyle}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </label>
          <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>
            Custom Category Label
            <input
              value={form.customCategoryLabel}
              onChange={(event) =>
                setField('customCategoryLabel', event.target.value)
              }
              placeholder="Optional"
              style={inputStyle}
            />
          </label>
          <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>
            Link
            <input
              required
              type="url"
              value={form.website}
              onChange={(event) => setField('website', event.target.value)}
              placeholder="https://..."
              style={inputStyle}
            />
          </label>
          <label style={{ ...labelStyle, gridColumn: '1 / -1' }}>
            Street
            <input
              value={form.address}
              onChange={(event) => setField('address', event.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            City
            <input
              value={form.city}
              onChange={(event) => setField('city', event.target.value)}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            State
            <input
              value={form.state}
              onChange={(event) => setField('state', event.target.value)}
              maxLength={40}
              style={inputStyle}
            />
          </label>
          <label style={labelStyle}>
            ZIP
            <input
              value={form.zip}
              onChange={(event) => setField('zip', event.target.value)}
              inputMode="numeric"
              style={inputStyle}
            />
          </label>
          <input
            tabIndex={-1}
            autoComplete="off"
            value={form.websiteHoneypot}
            onChange={(event) =>
              setField('websiteHoneypot', event.target.value)
            }
            style={{
              position: 'absolute',
              left: -9999,
              width: 1,
              height: 1,
            }}
            aria-hidden="true"
          />
        </div>

        {(error || status === 'success') && (
          <div
            style={{
              margin: '0 1rem',
              padding: '0.62rem 0.7rem',
              border: `1px solid ${
                error ? (isDark ? '#7f1d1d' : '#fecaca') : '#86efac'
              }`,
              background: error
                ? isDark
                  ? '#1a0d0d'
                  : '#fff1f2'
                : isDark
                  ? '#07150b'
                  : '#f0fdf4',
              color: error ? (isDark ? '#fecaca' : '#991b1b') : '#15803d',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.7rem',
              lineHeight: 1.45,
            }}
          >
            {error ?? 'Source added.'}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.55rem',
            padding: '1rem',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              border: `1px solid ${border}`,
              background: 'transparent',
              color: mutedText,
              padding: '0.48rem 0.72rem',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.7rem',
              fontWeight: 800,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={status === 'submitting'}
            style={{
              border: '1px solid #fbbf24',
              background: '#fbbf24',
              color: '#111111',
              padding: '0.48rem 0.8rem',
              borderRadius: 4,
              cursor: status === 'submitting' ? 'not-allowed' : 'pointer',
              opacity: status === 'submitting' ? 0.65 : 1,
              fontFamily: "'Poppins', sans-serif",
              fontSize: '0.7rem',
              fontWeight: 900,
            }}
          >
            {status === 'submitting' ? 'Adding...' : 'Add Source'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
};
