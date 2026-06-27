// Segment of an assistant message: either literal text or an [[open:<id>]]
// marker the chat panel renders as a clickable chip.
export type MessageSegment =
  | { type: 'text'; text: string }
  | { type: 'marker'; id: string };

const MARKER_RE = /\[\[open:([^\]]+)\]\]/g;

/**
 * Split assistant text into ordered text/marker segments so the chat panel can
 * render prose inline and `[[open:<id>]]` markers as clickable chips. Malformed
 * or unmatched brackets are left untouched as plain text.
 */
export const parseDetailMarkers = (content: string): MessageSegment[] => {
  const segments: MessageSegment[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(MARKER_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) {
      segments.push({ type: 'text', text: content.slice(lastIndex, start) });
    }
    const id = match[1].trim();
    if (id) segments.push({ type: 'marker', id });
    lastIndex = start + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: 'text', text: content.slice(lastIndex) });
  }

  return segments;
};
