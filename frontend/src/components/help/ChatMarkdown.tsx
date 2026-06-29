'use client';

import type { CSSProperties, FC } from 'react';
import { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { DetailDescriptor } from './DashboardContext';

interface ChatMarkdownProps {
  content: string;
  isDark: boolean;
  /** Openable items by id, so `[[open:<id>]]` markers become clickable chips. */
  descriptorsById: Map<string, DetailDescriptor>;
  onOpen: (descriptor: DetailDescriptor) => void;
}

// Custom link scheme used to smuggle openable-item markers through Markdown: an
// `[[open:<id>]]` marker is rewritten to a normal link `[Title](open:<id>)`, then
// the `a` renderer below turns any `open:` link back into a detail chip.
const OPEN_HREF_PREFIX = 'open:';
const MARKER_RE = /\[\[open:([^\]]+)\]\]/g;

// Escape characters that would otherwise break Markdown link-text syntax.
const escapeLinkText = (s: string) => s.replace(/[\\[\]]/g, '\\$&');

/**
 * Rewrite `[[open:<id>]]` markers into Markdown links so they render inline
 * within prose. Unknown ids are dropped (matching the prior chip behavior of
 * rendering nothing for a stale id).
 */
const injectOpenLinks = (
  content: string,
  descriptorsById: Map<string, DetailDescriptor>,
): string =>
  content.replace(MARKER_RE, (_match, rawId: string) => {
    const id = rawId.trim();
    const descriptor = descriptorsById.get(id);
    if (!descriptor) return '';
    return `[${escapeLinkText(descriptor.title)}](${OPEN_HREF_PREFIX}${encodeURIComponent(
      id,
    )})`;
  });

/**
 * Render an assistant message as Markdown (GFM: tables, lists, strikethrough,
 * autolinks), themed to match the chat panel. Raw HTML is intentionally not
 * enabled, so model output can't inject markup. `[[open:<id>]]` markers become
 * clickable chips that open the referenced item in the DetailView.
 */
export const ChatMarkdown: FC<ChatMarkdownProps> = ({
  content,
  isDark,
  descriptorsById,
  onOpen,
}) => {
  const cardText = isDark ? '#dedede' : '#111111';
  const mutedText = isDark ? '#7a7a7a' : '#888';
  const divider = isDark ? '#2a2a2a' : '#e4e4e4';
  const linkColor = isDark ? '#93c5fd' : '#1d4ed8';
  const codeBg = isDark ? '#0d0d0d' : '#f3f3f3';
  const codeText = isDark ? '#e6e6e6' : '#1a1a1a';

  const source = useMemo(
    () => injectOpenLinks(content, descriptorsById),
    [content, descriptorsById],
  );

  const components = useMemo<Components>(() => {
    const codeFont =
      "'SFMono-Regular', ui-monospace, 'JetBrains Mono', Menlo, monospace";
    const blockSpacing: CSSProperties = { margin: '0 0 0.55rem' };

    return {
      p: ({ children }) => <p style={{ ...blockSpacing, lineHeight: 1.6 }}>{children}</p>,
      h1: ({ children }) => (
        <h1 style={{ margin: '0.2rem 0 0.5rem', fontSize: '0.95rem', fontWeight: 800 }}>
          {children}
        </h1>
      ),
      h2: ({ children }) => (
        <h2 style={{ margin: '0.2rem 0 0.5rem', fontSize: '0.88rem', fontWeight: 800 }}>
          {children}
        </h2>
      ),
      h3: ({ children }) => (
        <h3 style={{ margin: '0.2rem 0 0.45rem', fontSize: '0.8rem', fontWeight: 700 }}>
          {children}
        </h3>
      ),
      ul: ({ children }) => (
        <ul style={{ ...blockSpacing, paddingLeft: '1.2rem', lineHeight: 1.55 }}>
          {children}
        </ul>
      ),
      ol: ({ children }) => (
        <ol style={{ ...blockSpacing, paddingLeft: '1.2rem', lineHeight: 1.55 }}>
          {children}
        </ol>
      ),
      li: ({ children }) => <li style={{ margin: '0.15rem 0' }}>{children}</li>,
      strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
      em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
      hr: () => (
        <hr style={{ border: 'none', borderTop: `1px solid ${divider}`, margin: '0.7rem 0' }} />
      ),
      blockquote: ({ children }) => (
        <blockquote
          style={{
            margin: '0 0 0.55rem',
            paddingLeft: '0.7rem',
            borderLeft: `3px solid ${divider}`,
            color: mutedText,
          }}
        >
          {children}
        </blockquote>
      ),
      pre: ({ children }) => (
        <pre
          style={{
            ...blockSpacing,
            background: codeBg,
            color: codeText,
            padding: '0.7rem 0.85rem',
            borderRadius: 6,
            overflowX: 'auto',
            fontFamily: codeFont,
            fontSize: '0.7rem',
            lineHeight: 1.5,
          }}
        >
          {children}
        </pre>
      ),
      code: ({ className, children }) => {
        const text = String(children ?? '');
        const isBlock = Boolean(className) || text.includes('\n');
        if (isBlock) {
          // Inside <pre> — let the pre own the surface; keep code unstyled.
          return <code style={{ fontFamily: codeFont }}>{children}</code>;
        }
        return (
          <code
            style={{
              fontFamily: codeFont,
              fontSize: '0.72rem',
              background: codeBg,
              color: codeText,
              padding: '0.05rem 0.3rem',
              borderRadius: 4,
            }}
          >
            {children}
          </code>
        );
      },
      a: ({ href, children }) => {
        // Openable-item chip: `open:<id>` links resolve back to a detail item.
        if (href?.startsWith(OPEN_HREF_PREFIX)) {
          const id = decodeURIComponent(href.slice(OPEN_HREF_PREFIX.length));
          const descriptor = descriptorsById.get(id);
          if (!descriptor) return <>{children}</>;
          return (
            <button
              type="button"
              onClick={() => onOpen(descriptor)}
              title={`Open ${descriptor.title}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                margin: '0 0.15rem',
                padding: '0.1rem 0.4rem',
                fontFamily: "'Poppins', sans-serif",
                fontSize: '0.7rem',
                fontWeight: 700,
                color: '#000',
                background: '#E0A800',
                border: `1px solid ${isDark ? '#a16207' : '#111111'}`,
                borderRadius: 4,
                cursor: 'pointer',
                verticalAlign: 'baseline',
              }}
            >
              {descriptor.title}
            </button>
          );
        }
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: linkColor, textDecoration: 'underline' }}
          >
            {children}
          </a>
        );
      },
    };
  }, [isDark, mutedText, divider, linkColor, codeBg, codeText, descriptorsById, onOpen]);

  return (
    <div style={{ color: cardText }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </ReactMarkdown>
    </div>
  );
};
