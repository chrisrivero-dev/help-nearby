import type {
  DetailDescriptor,
  PanelGrounding,
} from '@/components/help/DashboardContext';
import type { LocationState } from '@/components/help/LocationContext';

export interface GroundingInput {
  location: LocationState;
  detail: DetailDescriptor | null;
  panelGrounding: Record<string, PanelGrounding>;
}

const locationLine = (loc: LocationState): string | null => {
  if (!loc.isValid) return null;
  const place = [loc.city, loc.state].filter(Boolean).join(', ');
  const bits = [place || undefined, loc.zip || undefined].filter(Boolean);
  const coords =
    Number.isFinite(loc.latitude) && Number.isFinite(loc.longitude)
      ? `(${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)})`
      : undefined;
  if (coords) bits.push(coords);
  return bits.length ? bits.join(' ') : null;
};

const activePanels = (panelGrounding: Record<string, PanelGrounding>) =>
  Object.values(panelGrounding).filter((p) => p.items.length > 0);

/**
 * Build the system prompt that grounds the chat in the user's current page
 * context, layered by priority:
 *   1. Role + how to reference openable options via [[open:<id>]] markers
 *   2. Location
 *   3. The item currently open in the DetailView (highest-precedence focus)
 *   4. Each panel's filtered list + active filters
 *
 * Returns null when there's nothing meaningful to ground, so callers can skip
 * injecting an empty system message.
 */
export const buildGroundingSystemPrompt = ({
  location,
  detail,
  panelGrounding,
}: GroundingInput): string | null => {
  const sections: string[] = [];

  const loc = locationLine(location);
  if (loc) sections.push(`USER LOCATION: ${loc}`);

  if (detail) {
    sections.push(
      `CURRENTLY OPEN (the user is looking at this): ${
        detail.groundingSummary ?? detail.title
      } [[open:${detail.id}]]`,
    );
  }

  for (const panel of activePanels(panelGrounding)) {
    const header: string[] = [`${panel.label.toUpperCase()} NEARBY`];
    if (panel.filters?.query) header.push(`search="${panel.filters.query}"`);
    if (panel.filters?.categories?.length)
      header.push(`categories: ${panel.filters.categories.join(', ')}`);
    const shown = panel.items.length;
    const more =
      panel.totalCount > shown
        ? ` (showing ${shown} of ${panel.totalCount})`
        : '';
    const lines = panel.items.map(
      (item) => `- ${item.groundingText} [[open:${item.descriptor.id}]]`,
    );
    sections.push(`${header.join(' · ')}${more}:\n${lines.join('\n')}`);
  }

  // Nothing to ground beyond a bare role — skip injecting a system message.
  if (sections.length === 0) return null;

  const intro =
    'You are the assistant for HELP! NEARBY, an app that helps people find local ' +
    'resources. Use the context below to answer. When you recommend a specific ' +
    'option that appears in a list below, append its marker [[open:<id>]] right ' +
    'after naming it so the user can open its details. Only use ids that appear ' +
    "below — never invent ids, addresses, phone numbers, or hours. If the context " +
    "doesn't cover the question, say so plainly.";

  return [intro, ...sections].join('\n\n');
};

/**
 * Deterministic, model-free readout of what the chat is currently grounded in —
 * location and which panels are active. Rendered locally by the "verify context"
 * button so grounding can be confirmed without relying on a (possibly tiny)
 * model to read it back.
 */
export const summarizeGrounding = ({
  location,
  detail,
  panelGrounding,
}: GroundingInput): string => {
  const lines: string[] = ['Grounding check — what the chat can see right now:'];

  lines.push(`• Location: ${locationLine(location) ?? 'not set'}`);

  const panels = activePanels(panelGrounding);
  if (panels.length === 0) {
    lines.push('• Active panels: none');
  } else {
    lines.push('• Active panels:');
    for (const p of panels) {
      const bits = [`${p.totalCount} result${p.totalCount === 1 ? '' : 's'}`];
      if (p.filters?.query) bits.push(`search="${p.filters.query}"`);
      if (p.filters?.categories?.length)
        bits.push(p.filters.categories.join(', '));
      lines.push(`   – ${p.label} (${bits.join('; ')})`);
    }
  }

  if (detail) lines.push(`• Currently open: ${detail.title}`);

  return lines.join('\n');
};
