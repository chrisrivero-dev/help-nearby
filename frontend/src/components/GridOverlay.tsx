import type { FC, CSSProperties } from 'react';

type GridOverlayProps = {
  /** distance between grid lines (in px) */
  step?: number;
  /** overlay opacity (0‑1) */
  opacity?: number;
  /** optional background colour (default rgba‑black) */
  color?: string;
};

export const GridOverlay: FC<GridOverlayProps> = ({
  step = 100,
  opacity = 0.15,
  color = '#000',
}) => {
  const overlayStyle: CSSProperties = {
    position: 'absolute',
    inset: 0, // top/right/bottom/left = 0
    pointerEvents: 'none', // lets clicks pass through
    backgroundImage: `
      repeating-linear-gradient(
        to right,
        ${color} ${opacity},
        ${color} ${opacity} 1px,
        transparent 1px,
        transparent ${step}px
      ),
      repeating-linear-gradient(
        to bottom,
        ${color} ${opacity},
        ${color} ${opacity} 1px,
        transparent 1px,
        transparent ${step}px
      )
    `,
    zIndex: 999, // on top of everything else
  };

  return <div style={overlayStyle} />;
};
