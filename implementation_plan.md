# Implementation Plan

## Overview

Implement scroll parallax and physics effects for the homepage where the MapPanel expands and snaps to fill the top half of the viewport on the second page, with header sliding up and out of view when scrolling down. The clock maintains its position relative to the page content.

## Types

No new types required. Using existing Framer Motion hook types:

- `useScroll` - Returns `scrollY`, `scrollYProgress`
- `useTransform` - Transforms scroll values to CSS properties
- `useSpring` - Physics-based animation values
- `useInertia` - Momentum-based scroll effects

## Files

### New Files

None

### Modified Files

- `frontend/src/app/page.tsx` - Complete rewrite of scroll animations

### Files to Delete/Move

None

### Configuration Updates

None

## Functions

### New Functions

1. `createSpringConfig(stiffness: number, damping: number, mass: number)` - Apple-quality spring configuration
2. `getScrollDirection(scrollY: MotionValue<number>)` - Detect scroll direction for header behavior

### Modified Functions

None

### Removed Functions

None

## Classes

### New Classes

None

### Modified Classes

None

### Removed Classes

None

## Dependencies

- `framer-motion@12.29.2` - Already installed (includes `useSpring`, `useInertia`)

## Testing

- Verify header slides up and disappears when scrolling down
- Verify MapPanel expands to fill top half of viewport when scrolled into position
- Verify snap behavior works smoothly with physics
- Verify clock position remains consistent
- Verify scrollWheelZoom is disabled on map (already implemented)

## Implementation Order

1. Update page.tsx with header slide-up logic (detect scroll direction)
2. Implement MapPanel snap behavior with scroll-snap CSS
3. Add physics-based spring effects using useSpring
4. Update clock positioning to scroll with content
5. Test and refine spring configurations for Apple-quality feel
