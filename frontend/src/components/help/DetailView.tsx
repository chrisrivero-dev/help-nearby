'use client';

import type { FC } from 'react';
import { useDetail } from './DashboardContext';
import type { DetailDescriptor } from './DashboardContext';
import { ResourceDetailRenderer } from './ResourceDetailView';

// Registry of detail renderers keyed by `DetailDescriptor.kind`. Adding a new
// panel-driven detail view = register one renderer here; no other change to the
// dispatcher or chat grounding is needed.
type DetailRenderer = FC<{
  descriptor: DetailDescriptor<never>;
  onClose: () => void;
}>;

const DETAIL_RENDERERS: Record<string, DetailRenderer> = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resource: ResourceDetailRenderer as any,
};

/**
 * Universal detail pane. Renders whichever item a panel pushed into the shared
 * detail channel, dispatching on `kind`. Renders nothing when no item is open.
 */
export const DetailView: FC = () => {
  const { detail, closeDetail } = useDetail();
  if (!detail) return null;

  const Renderer = DETAIL_RENDERERS[detail.kind];
  if (!Renderer) return null;

  return <Renderer descriptor={detail as DetailDescriptor<never>} onClose={closeDetail} />;
};
