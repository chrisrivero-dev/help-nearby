# Implementation Plan

## Overview

Fix the MapPanel component's choppy scroll animation, tile rendering gaps, and horizontal centering issues using a **dual-layer Leaflet strategy** combined with physics-based scroll interpolation. A background tile layer at full native size provides a solid, gap-free tile surface. A foreground interactive map scales via compositor-only `transform: scale()` driven by `@use-gesture/react`'s inertia-damped scroll tracking. Tile invalidation is suppressed during scroll and re-enabled after deceleration settles. The map stays perfectly centered through `translateX()` motion values computed from the scale factor.

## Types

### New Types

```typescript
// Scroll morph return type
interface ScrollMorphValues {
  scale: MotionValue<number>; // 1.0 → maxScale based on scroll
  translateX: MotionValue<number>; // Centering offset for scale origin
  backgroundY: MotionValue<number>; // Parallax offset for BG tiles
  opacity: MotionValue<number>; // Fade for foreground map
}

// Tile stabilizer configuration
interface TileStabilizerConfig {
  mapInstance: import("leaflet").Map | null;
  scrollActive: boolean;
  debounceMs?: number; // Default: 150
}

// Map layer interface for dual-layer rendering
interface MapLayerProps {
  theme: "dark" | "light";
  className?: string;
  zIndex?: number;
  interactive?: boolean; // false for BG layer, true for FG layer
}
```

## Files

### New Files

1. **`frontend/src/hooks/useScrollMorph.ts`** — Custom hook that computes physics-based scroll interpolation for the map panel morph animation. Uses `@use-gesture/react`'s `useScroll` with high mass (2.0) and damping (8) for Locomotive Scroll-like inertia. Returns `{ scale, translateX, backgroundY, opacity }` motion values.

2. **`frontend/src/hooks/useMapTileStabilizer.ts`** — Hook that prevents Leaflet tile flicker during scroll by:
   - Calling `map.dragging.disable()` / `enable()` during scroll activity
   - Setting `map.getContainer().style.background` to the current theme color
   - Debouncing re-enable by 200ms after scroll settles

3. **`frontend/src/components/MapPanel/MapPanel.tsx`** — Simplified MapPanel without the outer `motion.div` wrapper. Exports the pure map logic (search, geolocation, markers, TileLayer) without any scroll animation. Exposes `mapInstanceRef` for the parent to access.

4. **`frontend/src/components/MapPanel/MapPanelBackground.tsx`** — Renders a **non-interactive** Leaflet map instance at full native size behind the foreground map. Never scales or animates. Its sole purpose is to fill any visual gaps with pre-rendered tiles. Uses `interactive={false}` on the Leaflet container.

5. **`frontend/src/components/MapPanel/MapPanelForeground.tsx`** — The **interactive** Leaflet map wrapped in a `motion.div` with `transform: scale()` + `translateX()`. Receives motion values from `useScrollMorph`. Applies `pointer-events: auto` for full interactivity.

6. **`frontend/src/components/MapPanel/MapPanelViewport.tsx`** — The outer container that composites the dual-layer approach. Handles:
   - `transform-origin: top center` for scale expansion
   - `overflow: hidden` to contain the scaled map
   - `position: sticky` + `z-index: 200` for layering
   - Solid `background-color` matching the theme (fills gaps during load)

### Modified Files

1. **`frontend/src/app/page.tsx`** — Refactored:
   - Remove `mapWidth` and `mapHeight` `useTransform` motion values.
   - Replace nested `motion.div` wrapper with `MapPanelViewport` component.
   - Wire `useScrollMorph` to `smoothScrollProgress` with the scroll range `[0, 0.25]`.
   - Maximum scale set to `2.5` (map expands from covering the full viewport to covering the top 50% = 2x height + width expansion for perspective).
   - Pass `mapInstanceRef` down for tile access.

2. **`frontend/src/components/MapPanel.tsx`** — Simplified:
   - Remove the outer `motion.div` entrance animation from `MapContent`.
   - The `MapProvider` / `useMapContext` context system is preserved and exported.
   - All search, geolocation, and marker logic remains unchanged.

### Modified Files

1. **`frontend/src/app/page.tsx`** — Major refactor:
   - Remove the `mapWidth` and `mapHeight` `useTransform` motion values.
   - Remove the nested `motion.div` that wraps `MapPanel` with width/height morphing.
   - Replace with a static-size container that uses the new `useScrollMorph` hook for all scroll-driven transforms.
   - Update the sticky positioning strategy to use `top: 0` with `z-index: 200` for the map layer.
   - Add `transform-origin: top center` for proper scale expansion.

2. **`frontend/src/components/MapPanel.tsx`** — Simplified:
   - Remove the outer `motion.div` wrapper from `MapContent` component (the `initial/animate` entrance animation).
   - Add solid background color matching the theme to the map container style.
   - Add `-webkit-transform: optimize-levitate` and `will-change: transform` for GPU acceleration.
   - Keep all internal map logic (search, geolocation, markers) unchanged.

## Functions

### New Functions

1. **`useScrollMorph(scrollYProgress: MotionValue<number>, scrollRange: [number, number])`** in `useScrollMorph.ts`:
   - **Parameters**: `scrollYProgress` from `useScroll()`, `scrollRange` defining the scroll window for the morph.
   - **Returns**: Object `{ scale: MotionValue<number>, translateX: MotionValue<number>, backgroundY: MotionValue<number> }`.
   - **Purpose**: Computes the scale factor, horizontal translation, and vertical background offset based on scroll progress. Uses `useGesture`'s scroll damping for physics-based interpolation.
   - **Scale range**: `1.0` (collapsed) → `2.5` (fully expanded to cover viewport).
   - **translateX**: Centers the map by computing the offset needed as the map visually expands.
   - **backgroundY**: Parallax offset for a seamless tile background.

2. **`useMapTileStabilizer(mapInstance: Map | null)`** in `useMapTileStabilizer.ts`:
   - **Parameters**: Leaflet map instance.
   - **Purpose**: During scroll, temporarily disables tile invalidation and dragging to prevent flicker. Re-enables after scroll settles using a debounced toggle.
   - **Key logic**: Calls `map.dragging.disable()` on scroll start, `map.dragging.enable()` on scroll end (debounced 150ms). Sets `map.getContainer().style.background` to theme color.

### New Components

1. **`MapPanelViewport`** in `MapPanelViewport.tsx`:
   - Props: `mapInstanceRef`, `theme`
   - Renders `MapPanelBackground` + `MapPanelForeground` composited via absolute positioning.
   - Foreground receives `style={{ transform: useSpring(scale, config), translateX: translateX }}`.

2. **`MapPanelBackground`** in `MapPanelBackground.tsx`:
   - Props: `theme`
   - Renders a Leaflet map with `interactive={false}` at full container size.
   - Same `TileLayer` URL as the foreground (theme-aware).
   - `z-index: 0`, positioned absolutely behind the foreground.

3. **`MapPanelForeground`** in `MapPanelForeground.tsx`:
   - Props: `mapInstanceRef`, `theme`, `scrollMorphValues`
   - Wraps the full `MapContent` logic (with search, markers, etc.) in a `motion.div`.
   - `z-index: 1`, `position: relative`.
   - `transform: scale() + translateX()` from motion values.
   - `will-change: transform` + `-webkit-transform: optimize-levitate`.

### Modified Functions

1. **`MapContent` component** in `MapPanel.tsx`:
   - Remove: entrance animation props (`initial`, `animate`, `transition`) from the outer `motion.div`.
   - Add: `background` style matching the current theme to prevent white gaps.

## Classes

No new React classes/components beyond the new files listed above. Leaflet's existing `Map`, `TileLayer`, `Marker`, and `Popup` classes are used unchanged.

## Dependencies

### New Dependencies

1. **`@use-gesture/react`** (v10.x) — Installed via npm/pnpm. Provides `useScroll` with built-in inertia/damping physics for smooth scroll interpolation. This replaces the manual spring damping approach and gives Locomotive Scroll-like behavior.

### Version Changes

No existing dependency version changes required. All changes are additive.

## Testing

1. **Visual inspection testing**: Manually verify in browser:
   - Map panel scrolls smoothly with no chop/jitter during scroll.
   - No white tile gaps appear during scroll, map drag, or re-render.
   - Map stays horizontally centered at all scale levels.
   - Map remains fully interactive (click, zoom, drag) after scroll completes.

2. **Performance testing**:
   - Chrome DevTools Performance tab: Record a scroll session. Verify no layout/paint flashes during scroll — only composite layers.
   - Memory: Verify no tile cache bloat from repeated invalidation.

3. **Regression testing**:
   - Map search (ZIP code) still works after scroll.
   - Geolocation button still works.
   - Theme toggle still updates map tile layer correctly.
   - All existing tests in `frontend/src/__tests__/` still pass.

## Implementation Order

1. Install `@use-gesture/react` dependency.
2. Create `frontend/src/hooks/useScrollMorph.ts` with the scroll morph hook.
3. Create `frontend/src/hooks/useMapTileStabilizer.ts` with the tile stabilizer hook.
4. Create `frontend/src/components/MapPanel/MapPanel.tsx` (simplified, no animation wrapper).
5. Create `frontend/src/components/MapPanel/MapPanelMask.tsx` (mask-based morph layer).
6. Create `frontend/src/components/MapPanel/MapPanelContainer.tsx` (centering wrapper).
7. Refactor `frontend/src/app/page.tsx` to use the new hooks and components.
8. Update the original `frontend/src/components/MapPanel.tsx` (remove motion wrapper, add background color).
