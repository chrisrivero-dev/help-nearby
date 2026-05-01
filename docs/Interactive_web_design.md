# Interactive Web Design: Best Practices Guide

### Scroll Physics · Layout · Page Transitions · Motion

> **For coding agents**: This guide is structured as a reference. Each section identifies the concept, the rule, and the implementation pattern. Use section headers as anchors when navigating.

---

## Table of Contents

1. [Mental Model: The Motion Contract](#1-mental-model-the-motion-contract)
2. [Layout Foundations](#2-layout-foundations)
3. [Scroll Architecture](#3-scroll-architecture)
4. [Scroll Physics & Parallax](#4-scroll-physics--parallax)
5. [Morph & Scale Animations](#5-morph--scale-animations)
6. [Page & Route Transitions](#6-page--route-transitions)
7. [Framer Motion Patterns](#7-framer-motion-patterns)
8. [Performance Rules](#8-performance-rules)
9. [Accessibility Constraints](#9-accessibility-constraints)
10. [Common Mistakes](#10-common-mistakes)
11. [Quick Reference Cheatsheet](#11-quick-reference-cheatsheet)

---

## 1. Mental Model: The Motion Contract

Every interaction on a page is a **promise to the user**. Motion should:

- **Confirm** actions (button press → visual feedback)
- **Orient** the user (where they came from, where they're going)
- **Direct attention** (what to look at next)
- **Convey hierarchy** (what is primary, what is secondary)

Motion that does none of these is decoration. Decoration has a cost — performance, cognitive load, accessibility — and should be minimized.

### The Three Motion Layers

| Layer     | Purpose                                        | Tool                                        |
| --------- | ---------------------------------------------- | ------------------------------------------- |
| **Micro** | Feedback, hover, focus states                  | CSS transitions / Framer `whileHover`       |
| **Meso**  | In-page reveals, scroll-driven changes         | Framer `useScroll`, `useInView`, `motion`   |
| **Macro** | Route/page transitions, full-screen animations | Framer `AnimatePresence`, layout animations |

Each layer has its own timing budget. Never let micro animations bleed into meso territory.

---

## 2. Layout Foundations

### Grid Strategy

Define a grid before any component. Motion applied to a broken layout looks wrong no matter how polished.

- Use **CSS Grid** for page-level structure; **Flexbox** for component internals.
- Establish a consistent spacing scale (4px base, multiples of 4 or 8).
- Define viewport-aware containers: `max-width` + centered margin + responsive padding.
- Avoid fixed heights on containers that hold dynamic content — use `min-height`.

### Z-Index Architecture

Establish a named z-index scale at the design system level. Unmanaged z-index is the most common cause of broken transitions and overlapping motion layers.

```css
/* _layers.css */
:root {
  --z-base: 0;
  --z-content: 10;
  --z-sticky: 100;
  --z-overlay: 200;
  --z-modal: 300;
  --z-toast: 400;
}
```

### Scroll Container Clarity

**One scroll axis per viewport at a time.** If horizontal scroll exists, it should be explicit and isolated. Mixed-axis scroll causes disorientation and breaks physics-based interactions.

- Identify your scroll container: `window` vs a DOM element. Framer Motion's `useScroll` accepts a `container` ref — use it when scrolling inside a div.
- Avoid `overflow: hidden` on `body` or `html` unless inside a modal/overlay. It breaks scroll-linked animations.

---

## 3. Scroll Architecture

### Page Types and Their Scroll Contracts

| Page Type                    | Scroll Behavior                            | Notes                                  |
| ---------------------------- | ------------------------------------------ | -------------------------------------- |
| **Long-form content**        | Native scroll, no hijacking                | Let the browser handle it              |
| **Storytelling / narrative** | Scroll-linked animation, controlled pacing | Use `useScroll` with `scrollYProgress` |
| **Landing page**             | Section-based reveals + parallax accents   | `useInView` per section                |
| **App / dashboard**          | Minimal scroll animation, content-first    | Motion should not compete with data    |

### Scroll Hijacking: When to Avoid It

Scroll hijacking (overriding native scroll behavior) is high-risk. Only use it when:

- The experience is explicitly a "scroll story" or immersive presentation
- You have full control over scroll speed and can match native feel
- You have implemented keyboard and accessibility fallbacks

If in doubt, use scroll-**linked** animation (elements respond to scroll position) rather than scroll-**controlled** navigation (scroll drives page advancement).

---

## 4. Scroll Physics & Parallax

### Core Principle: Depth Through Differential Velocity

Parallax works because objects at different depths move at different speeds relative to the viewer. The rule:

- **Background layers**: move slower than scroll (factor `0.2`–`0.5`)
- **Foreground layers**: move faster than scroll (factor `1.2`–`1.8`)
- **Content layer**: moves at native scroll speed (factor `1.0`)

### Framer Motion Scroll Linking

```tsx
// Scroll-linked parallax
const { scrollYProgress } = useScroll();
const y = useTransform(scrollYProgress, [0, 1], ["0%", "-20%"]);

// Section-scoped scroll
const ref = useRef(null);
const { scrollYProgress } = useScroll({
  target: ref,
  offset: ["start end", "end start"],
});
```

### `useTransform` Mapping

`useTransform` maps an input range to an output range. Use it for:

- `y` / `x` translations (parallax)
- `opacity` (fade in/out on scroll)
- `scale` (zoom effects)
- `rotate` (rotation tied to scroll)

```tsx
const opacity = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], [0, 1, 1, 0]);
const scale = useTransform(scrollYProgress, [0, 0.5], [0.8, 1]);
```

### Spring Physics for Smoothing

Raw scroll values are jerky. Apply `useSpring` to smooth scroll-linked motion:

```tsx
const rawY = useTransform(scrollYProgress, [0, 1], [0, -200]);
const smoothY = useSpring(rawY, { stiffness: 80, damping: 20, mass: 0.5 });
```

**Spring tuning reference:**

| Feel            | Stiffness | Damping |
| --------------- | --------- | ------- |
| Snappy          | 200–400   | 20–30   |
| Balanced        | 80–150    | 15–20   |
| Slow / weighted | 30–60     | 10–15   |
| Bouncy          | 200–400   | 5–10    |

### Scroll-Triggered Reveals (not linked, just triggered)

Use `whileInView` or `useInView` for elements that animate **once** when they enter the viewport. Do not use `useScroll` for this — it adds unnecessary overhead.

```tsx
<motion.div
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.6, ease: "easeOut" }}
/>
```

`once: true` is critical for performance — prevents re-triggering as the user scrolls back.

---

## 5. Morph & Scale Animations

Two distinct pattern families. Different tools, different triggers, different failure modes.

---

### Pattern A: Scroll-Driven Layout Morph

**Use case**: An element changes its size, position, and role as the user scrolls — e.g., a map centered on screen that grows to fill the top half of the viewport on scroll.

**What's actually happening**: The element transitions between two layout states (small + centered → large + top-anchored) tied to `scrollYProgress`. This is **not** a `layoutId` transition — it's a scroll-linked style interpolation.

#### Strategy

The element must be `position: fixed` or `position: sticky` during the morph. You cannot animate `width`/`height`/`top` with `useTransform` directly (layout properties trigger reflow). Instead:

- Use `scale` to simulate size growth
- Use `y` / `x` to simulate repositioning
- Use `border-radius` to transition between card and panel states
- Use `transformOrigin` to control which point the scale expands from

#### Implementation

```tsx
// Parent section must be tall enough to give scroll room
// The sticky wrapper holds position; the inner element morphs

const sectionRef = useRef(null);
const { scrollYProgress } = useScroll({
  target: sectionRef,
  offset: ["start start", "end start"], // pin from section top to section bottom
});

// Map grows from ~40% width centered → 100% width at top
const scale = useTransform(scrollYProgress, [0, 1], [0.4, 1]);
const borderRadius = useTransform(scrollYProgress, [0, 1], [16, 0]);
const y = useTransform(scrollYProgress, [0, 1], ["30vh", "0vh"]);

const smoothScale = useSpring(scale, { stiffness: 60, damping: 18 });
const smoothY = useSpring(y, { stiffness: 60, damping: 18 });

return (
  <section ref={sectionRef} style={{ height: "200vh" }}>
    {" "}
    {/* tall section = scroll room */}
    <div style={{ position: "sticky", top: 0, height: "100vh" }}>
      <motion.div
        style={{
          scale: smoothScale,
          y: smoothY,
          borderRadius: borderRadius,
          transformOrigin: "top center",
          width: "100%",
          height: "50vh",
        }}
      >
        <MapComponent />
      </motion.div>
    </div>
  </section>
);
```

#### Key Rules

- **`position: sticky` + tall parent** is the standard technique for scroll-pinned morphs. The sticky container holds while the parent scrolls past.
- **`transformOrigin`** is critical. A map growing to fill the top half should expand from `"top center"`, not the default `"center center"`.
- **`offset`** on `useScroll` controls when the animation window starts and ends relative to the section. `["start start", "end start"]` = animate while section top is at viewport top, stop when section bottom hits viewport top.
- Avoid animating actual CSS `width`/`height`. Use `scale` + `transformOrigin` to fake it without triggering layout.

#### Border Radius Morphing

When a card-shaped element becomes a full-bleed panel, the border radius must collapse to `0`. Animate it via `useTransform`:

```tsx
const radius = useTransform(scrollYProgress, [0, 0.8], ["20px", "0px"]);

<motion.div style={{ borderRadius: radius }} />;
```

---

### Pattern B: Portal / Scale-to-Fill Transition (Click-Triggered)

**Use case**: Clicking a shape on screen causes it to expand and fill the viewport, transitioning the user "through" it into a new view.

**What's actually happening**: The clicked element scales up to cover `100vw × 100vh`, then the next view fades or slides in underneath. The shape acts as a mask/cover for the transition.

#### Two Sub-Patterns

**Sub-pattern 1 — `layoutId` Hero Expansion** (element persists across routes)

Best when the element exists on both the source and destination pages. Framer morphs position, size, and border-radius automatically.

```tsx
// Source page: the portal shape
<motion.div
  layoutId="portal-card"
  onClick={() => router.push('/destination')}
  style={{ width: 300, height: 300, borderRadius: 24, background: "#111", cursor: "pointer" }}
/>

// Destination page: the same element, now full-screen
<motion.div
  layoutId="portal-card"
  style={{ width: "100vw", height: "100vh", borderRadius: 0, background: "#111" }}
/>
```

Framer animates everything between the two automatically. Wrap both pages in a shared `<LayoutGroup>`. This is the highest-fidelity approach.

**Sub-pattern 2 — Imperative Scale-to-Fill** (no route change, or element doesn't persist)

When `layoutId` isn't available (the element only exists on one page), use imperative animation with `useAnimate` to scale the element to cover the screen, then trigger the view change.

```tsx
const [scope, animate] = useAnimate();
const ref = useRef<HTMLDivElement>(null);

const handleClick = async () => {
  const el = ref.current;
  if (!el) return;

  const rect = el.getBoundingClientRect();

  // Calculate scale needed to cover full viewport from this element's position
  const scaleX = window.innerWidth / rect.width;
  const scaleY = window.innerHeight / rect.height;
  const scale = Math.max(scaleX, scaleY) * 1.1; // 1.1 = overshoot to ensure full coverage

  await animate(
    el,
    {
      scale,
      borderRadius: 0,
      // Translate so the expansion covers the viewport, not just scales in place
      x: window.innerWidth / 2 - (rect.left + rect.width / 2),
      y: window.innerHeight / 2 - (rect.top + rect.height / 2),
    },
    {
      duration: 0.55,
      ease: [0.76, 0, 0.24, 1],
    },
  );

  // Trigger route or view change after cover is complete
  router.push("/destination");
};

return (
  <div ref={scope}>
    <motion.div
      ref={ref}
      onClick={handleClick}
      style={{
        width: 280,
        height: 280,
        borderRadius: 16,
        background: "#0f0f0f",
      }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
    />
  </div>
);
```

#### Easing for Portal Transitions

The easing on expansion matters enormously. The feel should be **fast start, decelerate into fill**:

```tsx
ease: [0.76, 0, 0.24, 1]; // Sharp snap — aggressive, high-impact
ease: [0.43, 0.13, 0.23, 0.96]; // Smoother, more cinematic
```

Avoid `easeInOut` — the slow start reads as hesitation, which undermines the sense of "entering" something.

#### Reverse Portal (Exit / Collapse-Out)

For navigating back, reverse the animation: the element starts full-screen and collapses back to the card shape at its origin.

```tsx
// On destination page mount, animate from full-screen back to card bounds
// Pass the source element's DOMRect via router state or a shared store

const handleBack = async () => {
  await animate(
    coverEl,
    {
      scale: 1,
      borderRadius: 16,
      x: originRect.left - window.innerWidth / 2 + originRect.width / 2,
      y: originRect.top - window.innerHeight / 2 + originRect.height / 2,
    },
    { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  );

  router.back();
};
```

---

### Morph Animation Decision Tree

```
Is the element present on both source and destination?
  └── YES → layoutId (automatic morph, cleanest)
  └── NO  → imperative scale-to-fill (useAnimate)

Is the morph triggered by scroll or by click?
  └── SCROLL → sticky parent + useScroll + useTransform on scale/y/borderRadius
  └── CLICK  → layoutId hero expansion OR imperative scale-to-fill

Does the element need to simulate growing to fill the top half (not full screen)?
  └── Use transformOrigin: "top center" + scale + sticky container
  └── Do NOT animate actual width/height

Is the shape irregular (not a rectangle)?
  └── Use clip-path animation via CSS or GSAP (Framer has limited clip-path support)
  └── SVG path morphing: use GSAP MorphSVG or Framer's SVG path interpolation
```

---

### `clip-path` Morphing (Shape-to-Shape)

For non-rectangular portals — circles, diamonds, custom shapes — `clip-path` is the right tool. CSS transitions handle it natively if the number of points is equal between states.

```css
.portal {
  clip-path: circle(80px at center);
  transition: clip-path 0.6s cubic-bezier(0.76, 0, 0.24, 1);
}

.portal.expanded {
  clip-path: circle(150vw at center); /* covers entire viewport */
}
```

In Framer Motion, use `animate` with `clipPath`:

```tsx
<motion.div
  initial={{ clipPath: "circle(140px at 50% 50%)" }}
  animate={{ clipPath: "circle(150vw at 50% 50%)" }}
  transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
/>
```

**Rule**: Both `clip-path` values must use the same shape function (`circle`, `polygon`, `inset`) and the same number of vertices. Mismatched shapes will not interpolate — they will cut instantly.

---

## 6. Page & Route Transitions

### The AnimatePresence Contract

`AnimatePresence` enables exit animations. Without it, components unmount immediately and exit animations are skipped.

```tsx
<AnimatePresence mode="wait">
  <motion.div
    key={router.pathname}
    initial="hidden"
    animate="visible"
    exit="exit"
    variants={pageVariants}
  >
    {children}
  </motion.div>
</AnimatePresence>
```

- `mode="wait"`: exiting component finishes before entering component starts. Use for page transitions.
- `mode="sync"`: both animate simultaneously. Use for overlapping UI elements.
- `mode="popLayout"`: exiting element is popped out of flow before exit. Use for list reordering.

### Page Transition Patterns

**Fade** — lowest cognitive overhead, safest default:

```tsx
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};
```

**Slide** — communicates directionality (forward/back):

```tsx
const slideVariants = (direction: 1 | -1) => ({
  hidden: { x: direction * 60, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: { duration: 0.4, ease: "easeOut" } },
  exit: { x: direction * -60, opacity: 0, transition: { duration: 0.3 } },
});
```

**Scale + Fade** — depth, used for modals and drill-down:

```tsx
const scaleVariants = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
  exit: { scale: 0.97, opacity: 0, transition: { duration: 0.2 } },
};
```

### Shared Layout Transitions

When the same element exists on two routes (e.g., a card that expands into a detail page), use `layoutId` to morph between them:

```tsx
// List view
<motion.div layoutId={`card-${id}`} />

// Detail view
<motion.div layoutId={`card-${id}`} />
```

Framer automatically animates position, size, and border-radius between the two. This is the highest-impact transition pattern available.

### Scroll Position on Route Change

Always reset scroll position on route change unless the UX explicitly requires preserving it.

```tsx
// Next.js App Router
useEffect(() => {
  window.scrollTo(0, 0);
}, [pathname]);
```

---

## 7. Framer Motion Patterns

### Variants System

Use **variants** for all but the simplest animations. They enable:

- Coordinated parent/child timing via `staggerChildren`
- Clean separation of animation state from component logic
- Reusable animation definitions

```tsx
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};
```

Children inherit `initial` and `animate` from the parent automatically when using variants.

### Gesture States

```tsx
<motion.button
  whileHover={{ scale: 1.03 }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: "spring", stiffness: 400, damping: 17 }}
/>
```

Keep gesture animations **proportional** — large elements get smaller scale changes, small elements get larger ones.

### Layout Animations

For elements that change size or position without route changes (accordions, filtering, reordering):

```tsx
<motion.div layout>{/* Content that changes size */}</motion.div>
```

Wrap in `<LayoutGroup>` when multiple components participate in the same layout shift.

### `useMotionValue` for Direct Manipulation

For cursor-following, drag-linked, or imperative animations:

```tsx
const x = useMotionValue(0);
const y = useMotionValue(0);
const rotateX = useTransform(y, [-100, 100], [15, -15]);
const rotateY = useTransform(x, [-100, 100], [-15, 15]);
```

Avoid reading `useMotionValue` in render — use `useTransform` or `motionValue.get()` in event handlers.

---

## 8. Performance Rules

### What to Animate

**Safe (GPU-composited, no layout recalculation):**

- `transform` (translate, scale, rotate)
- `opacity`
- `filter` (with caution — can be expensive)

**Avoid animating:**

- `width`, `height`, `top`, `left`, `margin`, `padding`
- Any property that triggers layout recalculation

Framer Motion's `x`, `y`, `scale`, `rotate` all map to CSS `transform` under the hood — always prefer them over positional properties.

### `will-change`

Apply only to elements that are actively animating. Do not apply globally.

```css
.animating-element {
  will-change: transform, opacity;
}
```

Remove `will-change` after animation completes. Persistent `will-change` wastes GPU memory.

### Lazy-Loading Motion

For heavy scroll-driven pages, defer non-critical motion components:

```tsx
const HeavyParallaxSection = dynamic(() => import("./HeavyParallaxSection"), {
  ssr: false,
});
```

### Reduce Motion — The Performance Bonus

Respecting `prefers-reduced-motion` also eliminates expensive animations for affected users, improving both accessibility and performance simultaneously.

```tsx
const prefersReduced = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

const variants = {
  hidden: { opacity: 0, y: prefersReduced ? 0 : 30 },
  visible: { opacity: 1, y: 0 },
};
```

---

## 9. Accessibility Constraints

### Core Rules

1. **Never use motion as the sole means of conveying information.** Color, text, and structure must stand independently.
2. **Focus management on route transitions.** Move focus to the new page's main heading after transition completes.
3. **Respect `prefers-reduced-motion`**. All non-essential motion must be suppressible.
4. **No infinite animations without user control**. Provide pause mechanisms for anything that loops.
5. **Scroll hijacking must have keyboard alternatives.** Arrow keys, tab, and page-down must still work logically.

### Focus After Transition

```tsx
const headingRef = useRef<HTMLHeadingElement>(null);

useEffect(() => {
  headingRef.current?.focus();
}, [pathname]);

// In JSX
<h1 ref={headingRef} tabIndex={-1}>
  Page Title
</h1>;
```

---

## 10. Common Mistakes

| Mistake                                           | Problem                                           | Fix                                                                |
| ------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| Animating `height: auto` directly                 | Layout thrash, inconsistent behavior              | Use `motion.div` with `layout` prop                                |
| Stacking multiple `AnimatePresence`               | Conflicting exit states                           | Use one `AnimatePresence` per exit group                           |
| `useScroll` on every component                    | Redundant event listeners                         | Lift to parent, pass `scrollYProgress` down                        |
| `whileInView` with `once: false`                  | Re-triggers on scroll back, jarring               | Use `once: true` for reveal animations                             |
| Spring on opacity transitions                     | Opacity springback looks wrong                    | Use `duration`-based easing for opacity                            |
| No `key` on `AnimatePresence` children            | Exit animation never fires                        | Always provide unique `key`                                        |
| Parallax on mobile without reduced-motion check   | Nausea-inducing on mobile                         | Disable parallax under `768px` or `prefers-reduced-motion`         |
| `layout` on deeply nested trees                   | Expensive — recalculates full subtree             | Use `layoutId` for targeted morphing instead                       |
| Animating `width`/`height` for scroll morph       | Triggers layout reflow every frame                | Use `scale` + `transformOrigin` instead                            |
| Mismatched `clip-path` shape functions            | No interpolation, instant cut                     | Both states must use same shape + same vertex count                |
| `layoutId` morph without `LayoutGroup`            | Elements don't find each other across routes      | Wrap shared layout context in `<LayoutGroup>`                      |
| Scale-to-fill without calculating viewport offset | Element scales from center, not from click origin | Calculate `x`/`y` translation to align center with viewport center |

---

## 11. Quick Reference Cheatsheet

### Timing Guidelines

| Animation Type          | Duration           | Easing                                     |
| ----------------------- | ------------------ | ------------------------------------------ |
| Micro (hover, tap)      | 100–200ms          | `easeOut` or spring                        |
| Reveal (fade, slide in) | 300–600ms          | `easeOut`, cubic bezier                    |
| Page transition         | 250–400ms          | `easeInOut`                                |
| Portal / scale-to-fill  | 400–600ms          | `[0.76, 0, 0.24, 1]` sharp snap            |
| Scroll morph            | Continuous         | Spring-smoothed (stiffness 60, damping 18) |
| Scroll-linked parallax  | Continuous         | Spring-smoothed                            |
| Loading states          | 600–1200ms looping | `linear` or `easeInOut`                    |

### Easing Reference

```tsx
// Common cubic bezier curves
ease: "easeOut"; // Default — most reveals
ease: "easeInOut"; // Symmetric transitions
ease: [0.16, 1, 0.3, 1]; // Expo out — fast then settle
ease: [0.43, 0.13, 0.23, 0.96]; // Smooth deceleration
ease: [0.76, 0, 0.24, 1]; // Sharp snap
```

### Framer Motion Import Map

```tsx
import {
  motion, // Animated HTML/SVG elements
  AnimatePresence, // Exit animations
  useScroll, // Scroll position tracking
  useTransform, // Map motion values
  useSpring, // Physics smoothing
  useMotionValue, // Imperative motion values
  useInView, // Viewport detection
  useAnimate, // Imperative animation sequences
  LayoutGroup, // Shared layout context
  Reorder, // Drag-to-reorder lists
} from "framer-motion";
```

### Decision Tree: Which Tool to Use

```
Need to animate on scroll?
  ├── Element just needs to appear → whileInView (once: true)
  └── Element moves with scroll → useScroll + useTransform + useSpring

Need to morph an element on scroll (size + position change)?
  ├── Rectangular element (card → panel) → sticky parent + scale + transformOrigin + borderRadius
  └── Non-rectangular shape → clip-path animation (CSS or Framer)

Need a portal / scale-to-fill transition on click?
  ├── Element exists on both source + destination → layoutId hero expansion
  └── Element only on source page → useAnimate imperative scale + translate to cover viewport

Need to animate between routes?
  ├── Simple fade/slide → AnimatePresence + pageVariants
  └── Element persists across routes → layoutId (+ LayoutGroup)

Need to animate layout changes?
  ├── Single element size change → layout prop
  └── Element moves between positions → layoutId + LayoutGroup

Need physics feel?
  └── useSpring or transition: { type: "spring", stiffness, damping }
```

---

_Last updated: April 2026 | Stack reference: Framer Motion v11+, React 18+, Next.js App Router_
