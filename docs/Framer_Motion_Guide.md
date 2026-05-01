# Framer Motion — Coding Agent Directive & Reference Guide

> **Agent Directive**: When implementing animations in React projects using Framer Motion, strictly follow the patterns, syntax, and priority rules in this document. Do not invent prop names. Do not use deprecated APIs. Default to `motion` components over imperative controls unless state-driven animation is explicitly required.

---

# Framer Motion — Animation Styles Reference Table

---

## 1. Mount / Unmount

| Style | Props Used | Effect | Key Notes |
|---|---|---|---|
| Fade in | `initial={{ opacity: 0 }}` `animate={{ opacity: 1 }}` | Element fades in on mount | Simplest entry animation |
| Fade out | `exit={{ opacity: 0 }}` | Element fades out on unmount | Requires `AnimatePresence` |
| Slide up | `initial={{ y: 30 }}` `animate={{ y: 0 }}` | Rises into position from below | Pair with opacity for polish |
| Slide down | `initial={{ y: -30 }}` `animate={{ y: 0 }}` | Drops into position from above | Common for dropdowns |
| Slide in from left | `initial={{ x: -40 }}` `animate={{ x: 0 }}` | Enters from left edge | Drawer / sidebar patterns |
| Slide in from right | `initial={{ x: 40 }}` `animate={{ x: 0 }}` | Enters from right edge | Panel transitions |
| Scale up | `initial={{ scale: 0.85 }}` `animate={{ scale: 1 }}` | Grows into full size | Modal / card reveals |
| Scale down | `initial={{ scale: 1.1 }}` `animate={{ scale: 1 }}` | Shrinks to natural size | Zoom-out entrance |
| Blur in | `initial={{ filter: "blur(8px)" }}` `animate={{ filter: "blur(0px)" }}` | Sharpens into focus | Hero text, image loads |
| Rotate in | `initial={{ rotate: -10, opacity: 0 }}` `animate={{ rotate: 0, opacity: 1 }}` | Tilts into upright position | Playful, card-like feel |
| Flip in (Y) | `initial={{ rotateY: 90 }}` `animate={{ rotateY: 0 }}` | Flips in from side | Card flip reveals |
| Flip in (X) | `initial={{ rotateX: 90 }}` `animate={{ rotateX: 0 }}` | Flips in from top/bottom | Page turn effect |
| Skew entrance | `initial={{ skewX: 10, opacity: 0 }}` `animate={{ skewX: 0, opacity: 1 }}` | Shears then straightens | Editorial / dynamic feel |
| Height expand | `initial={{ height: 0 }}` `animate={{ height: "auto" }}` | Accordion open | Use `layout` prop as alternative |
| Clip reveal | `initial={{ clipPath: "inset(0 100% 0 0)" }}` `animate={{ clipPath: "inset(0 0% 0 0)" }}` | Wipes in from left | Text / banner reveal |

---

## 2. Hover & Tap Interactions

| Style | Props Used | Effect | Key Notes |
|---|---|---|---|
| Scale up on hover | `whileHover={{ scale: 1.05 }}` | Enlarges on cursor enter | Universal button/card pattern |
| Scale down on tap | `whileTap={{ scale: 0.95 }}` | Shrinks on press | Tactile press feedback |
| Lift on hover | `whileHover={{ y: -4, boxShadow: "..." }}` | Elevates element upward | Card lift with shadow |
| Color shift on hover | `whileHover={{ backgroundColor: "#..." }}` | Background or text color transitions | Use with `transition: tween` |
| Rotate nudge | `whileHover={{ rotate: 3 }}` | Slight tilt on hover | Icon, badge interactions |
| Border glow | `whileHover={{ boxShadow: "0 0 0 2px #0070f3" }}` | Outline glow appears | Focus ring alternative |
| Icon spin | `whileHover={{ rotate: 180 }}` | Full or partial rotation | Toggle icons, arrows |
| Underline expand | `whileHover={{ scaleX: 1 }}` `initial={{ scaleX: 0 }}` | Underline grows from left | Nav link hover effect |
| Opacity dim | `whileHover={{ opacity: 0.7 }}` | Dims on hover | Image overlays, subtle links |
| Focus ring | `whileFocus={{ boxShadow: "0 0 0 3px rgba(...)" }}` | Ring appears on keyboard focus | Accessibility interactions |

---

## 3. Keyframe (Multi-Step)

| Style | Props Used | Effect | Key Notes |
|---|---|---|---|
| Bounce | `animate={{ y: [0, -20, 0] }}` | Jumps and returns | Add `repeat: Infinity` for loop |
| Pulse scale | `animate={{ scale: [1, 1.08, 1] }}` | Rhythmic breathing scale | Loading states, live indicators |
| Shake / error | `animate={{ x: [0, -10, 10, -8, 8, 0] }}` | Horizontal rattle | Form validation failure |
| Color cycle | `animate={{ backgroundColor: ["#f00", "#0f0", "#00f"] }}` | Cycles through colors | Status lights, mood indicators |
| Fade pulse | `animate={{ opacity: [1, 0.4, 1] }}` | Dims and recovers repeatedly | Skeleton loaders |
| Heartbeat | `animate={{ scale: [1, 1.15, 1, 1.1, 1] }}` `transition={{ times: [0, 0.2, 0.4, 0.6, 1] }}` | Double-pump beat | Like/heart interactions |
| Rubber band | `animate={{ scaleX: [1, 1.3, 0.85, 1.05, 1] }}` | Stretches and snaps back | Elastic feel on tap |
| Path draw | `animate={{ pathLength: [0, 1] }}` | SVG stroke draws progressively | Icon reveals, loaders |
| Rotation loop | `animate={{ rotate: 360 }}` `transition={{ repeat: Infinity, ease: "linear" }}` | Continuous spin | Loading spinners |
| Float | `animate={{ y: [0, -8, 0] }}` `transition={{ repeat: Infinity, duration: 3 }}` | Gentle vertical drift | Illustration accents |

---

## 4. Scroll-Triggered

| Style | Props Used | Effect | Key Notes |
|---|---|---|---|
| Fade up on enter | `whileInView={{ opacity: 1, y: 0 }}` `initial={{ opacity: 0, y: 40 }}` | Rises in as it scrolls into view | Section reveals |
| Fade in on enter | `whileInView={{ opacity: 1 }}` `initial={{ opacity: 0 }}` | Appears when visible | Content blocks |
| Scale in on enter | `whileInView={{ scale: 1 }}` `initial={{ scale: 0.9 }}` | Grows into view | Cards, images |
| Slide from left | `whileInView={{ x: 0 }}` `initial={{ x: -60 }}` | Enters from left on scroll | Feature rows |
| Slide from right | `whileInView={{ x: 0 }}` `initial={{ x: 60 }}` | Enters from right on scroll | Alternating layouts |
| Staggered list reveal | Variants with `staggerChildren` on parent | Children animate in sequence | Feature lists, grids |
| Blur to focus | `whileInView={{ filter: "blur(0px)" }}` `initial={{ filter: "blur(6px)" }}` | Sharpens on scroll enter | Image reveals |
| Rotate into position | `whileInView={{ rotate: 0 }}` `initial={{ rotate: -5 }}` | Straightens as it enters | Tilted card correction |
| Once vs repeat | `viewport={{ once: true }}` vs `once: false` | Controls if animation re-triggers on scroll back | `once: true` for reveals |
| Threshold control | `viewport={{ amount: 0.5 }}` | Sets how much of element must be visible | Prevents premature trigger |

---

## 5. Scroll-Linked (Parallax / Progress)

| Style | Props Used | Effect | Key Notes |
|---|---|---|---|
| Vertical parallax | `useScroll` + `useTransform(scrollY, [0, 500], [0, -150])` | Element moves at different rate than scroll | Background layers, hero images |
| Horizontal parallax | `useTransform(scrollY, [...], [...])` mapped to `x` | Lateral drift on vertical scroll | Diagonal composition sections |
| Opacity on scroll | `useTransform(scrollY, [0, 300], [1, 0])` via `style` | Fades as user scrolls | Hero text fade-out |
| Scale on scroll | `useTransform(scrollYProgress, [0, 1], [1, 1.3])` | Grows as page scrolls | Zoom background effect |
| Reading progress bar | `scrollYProgress` → `scaleX` on fixed bar | Horizontal bar tracks read progress | Top-of-page progress indicator |
| Sticky reveal | `useTransform` controlling `y` to counteract scroll | Element appears stationary while page moves | Pinned content sections |
| Rotate on scroll | `useTransform(scrollY, [0, 1000], [0, 360])` | Spins in relation to scroll depth | Decorative icons, logos |
| Color shift on scroll | `useTransform` mapped to color stops | Color changes as section scrolls | Navbar background transitions |
| Text clip reveal | `useTransform` on `clipPath` or `x` | Text uncovers as user scrolls | Editorial typography |
| Spring smoothing | Wrap `useTransform` output in `useSpring` | Adds physical lag to scroll tracking | Reduces mechanical feel |

---

## 6. Variants & Stagger

| Style | Props Used | Effect | Key Notes |
|---|---|---|---|
| Stagger children | `staggerChildren: 0.1` in parent transition | Children animate in sequence | Lists, grids, nav items |
| Delay children | `delayChildren: 0.3` | Waits before starting child animations | After parent completes |
| Parent before children | `when: "beforeChildren"` | Parent fully animates, then children begin | Container-first reveals |
| Children before parent | `when: "afterChildren"` | All children finish, then parent exits | Exit choreography |
| Named state switching | `animate="visible"` / `animate="hidden"` | Toggle between defined variant states | Multi-state UI components |
| Cascade fade | Staggered `opacity: 0 → 1` per child | Sequential fade through list | Menu items, card grids |
| Cascade slide | Staggered `y: 20 → 0` per child | Sequential rise through list | Feature sections |
| Reverse stagger on exit | `staggerDirection: -1` | Children exit last-to-first | Stack unwind effects |
| Variant inheritance | Children inherit `initial` / `animate` from parent | No need to repeat props on each child | Clean component trees |
| Dynamic stagger delay | `custom` prop + function variants | Per-item delay based on index or data | Non-uniform timing |

---

## 7. Layout Animations

| Style | Props Used | Effect | Key Notes |
|---|---|---|---|
| Size change | `layout` prop | Animates width/height changes automatically | Accordion, expanding cards |
| Position change | `layout` prop | Animates reflow when order changes | Reorderable lists |
| Shared element transition | `layoutId="id"` | Same element morphs between two locations | Tab indicators, card-to-modal |
| Contained layout | `layout="position"` | Only animates position, not size | Prevents unwanted stretching |
| Size-only layout | `layout="size"` | Only animates size, not position | Stable-position expandables |
| List reorder | `layout` on each `motion.li` | Smooth reorder when array changes | Drag-to-sort lists |
| Corrected child scale | `layoutId` with nested `motion` children | Prevents distortion during parent resize | Text inside morphing containers |
| Tab underline | `layoutId` on indicator div | Underline slides between active tabs | Navigation tabs |
| Card-to-fullscreen | `layoutId` on card + expanded view | Card expands into full modal smoothly | Product / portfolio detail |
| Layout dependency | `layoutDependency={value}` | Forces re-measure when external state changes | Third-party DOM mutations |

---

## 8. Drag

| Style | Props Used | Effect | Key Notes |
|---|---|---|---|
| Free drag | `drag` | Follows pointer freely in 2D | No constraints |
| Axis-locked drag | `drag="x"` or `drag="y"` | Constrains to single axis | Sliders, carousels |
| Bounded drag | `dragConstraints={{ left, right, top, bottom }}` | Limits travel to pixel bounds | Contained UI zones |
| Parent-bounded drag | `dragConstraints={ref}` | Constrains within a parent element | Card sorters |
| Snap back | `dragConstraints={{ left: 0, right: 0 }}` + `dragElastic` | Returns to origin on release | Toggle knobs |
| Elastic overscroll | `dragElastic={0.2}` | Resistance beyond constraints | Natural rubber-band feel |
| Momentum throw | `dragMomentum={true}` (default) | Continues sliding after release | Carousel momentum |
| Swipe to dismiss | `onDragEnd` checking `info.offset.x` | Removes element past threshold | Notification cards |
| Drag while scale | `whileDrag={{ scale: 1.05 }}` | Enlarges while being dragged | Lifted card effect |
| Velocity on release | `onDragEnd((e, info) => info.velocity)` | Read throw velocity for custom logic | Custom inertia behavior |

---

## 9. Imperative Control (`useAnimation`)

| Style | Props Used | Effect | Key Notes |
|---|---|---|---|
| Trigger on event | `controls.start({...})` | Fires animation from handler | Button click, form submit |
| Awaited sequence | `await controls.start(...)` chained | Animations run in strict order | Multi-step intro sequences |
| Stop mid-animation | `controls.stop()` | Halts current animation immediately | Cancel on user action |
| Reset to initial | `controls.set({...})` | Snaps to value without animating | Pre-animation state reset |
| Variant trigger | `controls.start("variantName")` | Triggers named variant state | Works with defined variant maps |
| Error shake | Keyframe `x` array via `controls.start` | Shake triggered on validation fail | Async form feedback |
| Entrance on load | `useEffect(() => controls.start(...), [])` | Fires on component mount | Programmatic entrance |
| Conditional play | Logic gate before `controls.start` | Conditionally animates based on state | Permission / auth gates |
| Interrupt and restart | `controls.stop()` then `controls.start()` | Interrupts and re-triggers | Hover + click combos |
| External trigger | Pass `controls` to child via prop | Parent drives child animation | Cross-component orchestration |

---

## 10. SVG Path

| Style | Props Used | Effect | Key Notes |
|---|---|---|---|
| Line draw | `pathLength: 0 → 1` | Stroke draws progressively | Icon reveals, underlines |
| Reverse draw | `pathLength: 1 → 0` | Stroke erases progressively | Exit or undo feedback |
| Offset march | `pathOffset` animated | Stroke appears to travel along path | Dashed-line motion |
| Spacing change | `pathSpacing` animated | Dash gap changes over time | Morphing dash patterns |
| Checkmark reveal | `pathLength` on multi-segment path | Draws confirmation check | Form success states |
| Logo trace | Sequential `pathLength` per `motion.path` | Each path draws in order | Brand reveal animations |
| Fill transition | `fill` animated via keyframes | Shape fills with color | Progress fill, gauge |
| Stroke color shift | `stroke` animated | Stroke color transitions | Status change feedback |
| Combined draw + fade | `pathLength` + `opacity` | Draws in while fading up | Polished icon entrance |
| Loop trace | `pathLength: [0, 1]` + `repeat: Infinity` | Continuously redraws | Loading indicators |

---

## 11. Transition Types

| Type | Config | Behavior | Best For |
|---|---|---|---|
| Spring (default) | `type: "spring"`, `stiffness`, `damping`, `mass` | Physics-based overshoot and settle | Interactive elements, gesture response |
| Tween | `type: "tween"`, `duration`, `ease` | Time-based, predictable curve | Page transitions, opacity, color |
| Inertia | `type: "inertia"`, `velocity`, `power` | Decelerating momentum from velocity | Post-drag coasting |
| Just (instant) | `type: "just"` | No animation, immediate value set | State resets, skip animation |
| Linear ease | `ease: "linear"` | Constant speed | Looping spins, progress bars |
| Ease out | `ease: "easeOut"` | Fast start, slow end | Entrance animations |
| Ease in | `ease: "easeIn"` | Slow start, fast end | Exit animations |
| Back ease | `ease: "backOut"` | Slight overshoot then settle | Playful entrances |
| Anticipate | `ease: "anticipate"` | Pulls back then launches | Energetic interactions |
| Custom bezier | `ease: [0.16, 1, 0.3, 1]` | Fully custom curve | Brand-specific motion feel |

---

## 12. Reduced Motion

| Style | Props Used | Effect | Key Notes |
|---|---|---|---|
| Detect OS preference | `useReducedMotion()` | Returns `true` if user has reduced motion on | Gate all animation logic |
| Disable transforms | Set `y: 0`, `x: 0`, `scale: 1` when reduced | No positional movement | Preserve opacity transitions |
| Shorten duration | `duration: reduceMotion ? 0.01 : 0.5` | Near-instant for motion-sensitive users | Never fully remove opacity change |
| Skip keyframes | Replace array with final value when reduced | No looping or bounce | Static end-state only |
| Variant swap | Different variant object based on flag | Full alternate animation set | Clean separation of motion modes |

## Core Framework Rules

### Installation & Import
```bash
npm install framer-motion
```

```tsx
// Named import — always use this pattern
import { motion, AnimatePresence, useAnimation, useInView, useScroll, useTransform } from "framer-motion";
```

### The `motion` Component
Every HTML/SVG element has a `motion` counterpart. Swap native elements 1:1.

```tsx
// Native
<div className="box" />

// Motion equivalent
<motion.div className="box" />
```

Supported: `motion.div`, `motion.span`, `motion.button`, `motion.svg`, `motion.path`, `motion.li`, `motion.section`, `motion.img`, `motion.a`, etc.

### Custom Components
Wrap with `motion()` factory for non-DOM components.

```tsx
const MotionCard = motion(Card);
<MotionCard animate={{ opacity: 1 }} />
```

---

## Animation Type Index

---

### 1. Mount / Unmount Animations

**Effect**: Element animates in when rendered, out when removed from DOM.

**Required wrapper**: `AnimatePresence` — must wrap any conditionally rendered `motion` component to capture exit animations.

**Props**: `initial`, `animate`, `exit`

```tsx
import { motion, AnimatePresence } from "framer-motion";

function Modal({ isOpen }: { isOpen: boolean }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          Modal Content
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**Agent Rules**:
- `AnimatePresence` must be outside the conditional, not inside.
- Child must have a stable `key` prop when rendering lists.
- `mode="wait"` staggers exit before enter; `mode="sync"` runs both simultaneously.

```tsx
<AnimatePresence mode="wait">
  {step === 0 && <motion.div key="step-0" ... />}
  {step === 1 && <motion.div key="step-1" ... />}
</AnimatePresence>
```

---

### 2. Hover & Tap Interactions

**Effect**: Responds to pointer states — scale, color, shadow, position shifts.

**Props**: `whileHover`, `whileTap`, `whileFocus`

```tsx
<motion.button
  whileHover={{ scale: 1.05, backgroundColor: "#1a1a2e" }}
  whileTap={{ scale: 0.97 }}
  transition={{ type: "spring", stiffness: 400, damping: 20 }}
>
  Click Me
</motion.button>
```

**Effect Variants**:

| Interaction | Recommended Values |
|---|---|
| Lift on hover | `whileHover={{ y: -4, boxShadow: "0 12px 24px rgba(0,0,0,0.15)" }}` |
| Scale press | `whileTap={{ scale: 0.95 }}` |
| Color shift | `whileHover={{ color: "#ff6b6b" }}` |
| Rotate nudge | `whileHover={{ rotate: 2 }}` |

**Agent Rules**:
- `transition` on the parent controls ALL gesture transitions unless overridden per-prop.
- Do not combine `whileHover` on both parent and child without explicit transition isolation.
- Use `spring` type for physical feel; `tween` for precision timing.

---

### 3. Keyframe Animations

**Effect**: Multi-step value sequences — bounce, pulse, path draws, color cycling.

**Syntax**: Pass an array to any animatable prop.

```tsx
// Bounce
<motion.div
  animate={{ y: [0, -20, 0] }}
  transition={{ duration: 0.6, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
/>

// Color cycle
<motion.div
  animate={{ backgroundColor: ["#ff0080", "#7928ca", "#0070f3"] }}
  transition={{ duration: 3, repeat: Infinity, repeatType: "mirror" }}
/>

// Scale pulse
<motion.div
  animate={{ scale: [1, 1.08, 1] }}
  transition={{ duration: 1.2, repeat: Infinity }}
/>
```

**`times` array**: Maps each keyframe to a progress point (0–1).

```tsx
animate={{ x: [0, 100, 50, 0] }}
transition={{ times: [0, 0.4, 0.7, 1], duration: 1.5 }}
```

---

### 4. Scroll-Triggered Animations

**Effect**: Elements animate when they enter the viewport. Two approaches: `useInView` (React hook) or `whileInView` (declarative prop).

#### 4a. Declarative — `whileInView`

```tsx
<motion.section
  initial={{ opacity: 0, y: 40 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, amount: 0.3 }}
  transition={{ duration: 0.5, ease: "easeOut" }}
>
  Content
</motion.section>
```

`viewport.once: true` — fires once, stays animated.
`viewport.amount` — fraction of element visible before triggering (0–1).

#### 4b. Imperative — `useInView`

```tsx
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

function Section() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : 30 }}
      transition={{ duration: 0.4 }}
    />
  );
}
```

**Agent Rules**:
- Prefer `whileInView` for static scroll reveals. Use `useInView` when logic depends on visibility state in JS.
- `margin` on `useInView` uses CSS margin string syntax — offsets the trigger boundary.

---

### 5. Scroll-Linked Animations (Parallax / Progress)

**Effect**: Animation values are directly tied to scroll position — parallax, progress bars, sticky effects.

**Hooks**: `useScroll`, `useTransform`, `useSpring`

```tsx
import { useScroll, useTransform, useSpring, motion } from "framer-motion";

function ParallaxHero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -150]);

  return <motion.div style={{ y }}>Hero Content</motion.div>;
}
```

**Progress Bar**:

```tsx
function ReadingProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

  return (
    <motion.div
      style={{
        scaleX,
        transformOrigin: "left",
        height: 4,
        background: "#0070f3",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
      }}
    />
  );
}
```

**`useTransform` signature**:
```tsx
const output = useTransform(inputValue, [inputFrom, inputTo], [outputFrom, outputTo]);
// Multi-range:
const opacity = useTransform(scrollY, [0, 200, 400], [1, 0.5, 0]);
```

**Agent Rules**:
- Always use `style` prop — not `animate` — for scroll-linked values. `animate` is state-based; `style` accepts motion values directly.
- Wrap in `useSpring` to smooth out scroll jitter when needed.

---

### 6. Variants — Orchestrated & Staggered Animations

**Effect**: Named animation states shared across a component tree. Parent controls propagation and stagger timing to children.

**Why use variants**: Eliminates prop drilling of animation values. Enables stagger, `delayChildren`, and `when` ordering.

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

function List({ items }: { items: string[] }) {
  return (
    <motion.ul variants={containerVariants} initial="hidden" animate="visible">
      {items.map((item) => (
        <motion.li key={item} variants={itemVariants}>
          {item}
        </motion.li>
      ))}
    </motion.ul>
  );
}
```

**`when` prop** — controls parent/child sequencing:
```tsx
transition: {
  when: "beforeChildren", // parent animates first, then children
  staggerChildren: 0.08,
}
```

**Agent Rules**:
- Child components only need `variants` — they inherit `initial` and `animate` from the parent automatically.
- Variant keys must match exactly between parent and child definitions.
- `staggerChildren` staggers by index order in DOM.

---

### 7. Layout Animations

**Effect**: Automatically animates an element between layout positions when its size or position changes — no manual position tracking needed.

**Props**: `layout`, `layoutId`

#### 7a. `layout` — Single Element Reflow

```tsx
// Animates when flex/grid layout shifts (e.g., toggling a sidebar)
<motion.div layout style={{ width: isOpen ? 300 : 80 }}>
  Sidebar
</motion.div>
```

#### 7b. `layoutId` — Shared Element Transition

Animates the same element morphing between two different render locations (tabs, cards, modals).

```tsx
// Tab indicator that slides between active tabs
{tabs.map((tab) => (
  <button key={tab.id} onClick={() => setActive(tab.id)}>
    {tab.label}
    {active === tab.id && (
      <motion.div layoutId="tab-underline" className="underline" />
    )}
  </button>
))}
```

```tsx
// Card expanding to modal
function Card({ id, isSelected }: { id: string; isSelected: boolean }) {
  return (
    <motion.div layoutId={`card-${id}`} className={isSelected ? "modal" : "card"}>
      <motion.h2 layoutId={`title-${id}`}>Title</motion.h2>
    </motion.div>
  );
}
```

**Agent Rules**:
- `layoutId` must be globally unique across the entire rendered tree.
- Wrap `layoutId` transitions in `AnimatePresence` if elements conditionally mount/unmount.
- Use `layout="position"` or `layout="size"` to constrain what gets animated.
- Add `layoutDependency` to force re-evaluation when external state changes position.

---

### 8. Gesture-Driven Drag

**Effect**: Element follows pointer drag. Supports constraints, momentum, and snap.

**Props**: `drag`, `dragConstraints`, `dragElastic`, `dragMomentum`, `onDragEnd`

```tsx
// Free drag
<motion.div drag whileDrag={{ scale: 1.05 }} />

// Constrained drag (pixel bounds)
<motion.div
  drag
  dragConstraints={{ left: -100, right: 100, top: -50, bottom: 50 }}
/>

// Constrained to parent ref
const containerRef = useRef(null);

<div ref={containerRef}>
  <motion.div drag dragConstraints={containerRef} />
</div>
```

**Snap back to origin**:
```tsx
<motion.div
  drag
  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
  dragElastic={0.2}
/>
```

**On release handler**:
```tsx
<motion.div
  drag="x"
  onDragEnd={(event, info) => {
    if (info.offset.x > 100) dismissItem();
  }}
/>
```

---

### 9. Imperative Animation Control — `useAnimation`

**Effect**: Trigger animations programmatically — on events, async sequences, or external state.

```tsx
import { motion, useAnimation } from "framer-motion";

function ShakeOnError() {
  const controls = useAnimation();

  async function handleSubmit() {
    const isValid = validate();
    if (!isValid) {
      await controls.start({
        x: [0, -10, 10, -8, 8, 0],
        transition: { duration: 0.4 },
      });
    }
  }

  return (
    <motion.div animate={controls}>
      <input />
      <button onClick={handleSubmit}>Submit</button>
    </motion.div>
  );
}
```

**Sequence**:
```tsx
async function sequence() {
  await controls.start({ opacity: 1, y: 0 });
  await controls.start({ scale: 1.1 });
  controls.start({ scale: 1 });
}
```

**Agent Rules**:
- `controls.start()` returns a Promise — use `await` to chain sequences.
- Pass variant name strings: `controls.start("visible")` — works with defined variants.
- Use `controls.stop()` to halt mid-animation.

---

### 10. SVG Path Animations

**Effect**: Draw SVG paths progressively — line drawing, logo reveals, icon strokes.

**Props**: `pathLength`, `pathOffset`, `pathSpacing` (all motion values 0–1)

```tsx
<motion.svg viewBox="0 0 100 100">
  <motion.path
    d="M 10,50 L 90,50"
    stroke="#0070f3"
    strokeWidth={4}
    fill="none"
    initial={{ pathLength: 0 }}
    animate={{ pathLength: 1 }}
    transition={{ duration: 1.5, ease: "easeInOut" }}
  />
</motion.svg>
```

**Checkmark draw**:
```tsx
<motion.path
  d="M 10 40 L 35 65 L 90 15"
  stroke="green"
  strokeWidth={5}
  fill="none"
  strokeLinecap="round"
  initial={{ pathLength: 0, opacity: 0 }}
  animate={{ pathLength: 1, opacity: 1 }}
  transition={{ duration: 0.6, delay: 0.2 }}
/>
```

---

### 11. Transition Configuration Reference

Applied via the `transition` prop on any `motion` component.

#### Spring (physical, reactive)
```tsx
transition={{ type: "spring", stiffness: 300, damping: 24, mass: 1 }}
```
| Param | Effect |
|---|---|
| `stiffness` | Higher = snappier response |
| `damping` | Higher = less oscillation |
| `mass` | Higher = slower, heavier feel |
| `bounce` | 0–1 shorthand for damping ratio |

#### Tween (time-based, precise)
```tsx
transition={{ type: "tween", duration: 0.4, ease: "easeOut" }}
```

**Easing options**: `"linear"`, `"easeIn"`, `"easeOut"`, `"easeInOut"`, `"circIn"`, `"circOut"`, `"backIn"`, `"backOut"`, `"anticipate"`, cubic bezier array `[0.16, 1, 0.3, 1]`

#### Repeat
```tsx
transition={{
  repeat: Infinity,         // or a count: 3
  repeatType: "loop",       // "loop" | "reverse" | "mirror"
  repeatDelay: 0.5,
}}
```

#### Per-Property Transitions
```tsx
<motion.div
  animate={{ x: 100, opacity: 1 }}
  transition={{
    x: { type: "spring", stiffness: 200 },
    opacity: { duration: 0.3, ease: "easeIn" },
  }}
/>
```

---

### 12. Reduced Motion Accessibility

**Always implement**. Framer Motion provides `useReducedMotion` to detect OS-level preference.

```tsx
import { useReducedMotion } from "framer-motion";

function AnimatedCard() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: reduceMotion ? 0 : 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5 }}
    />
  );
}
```

**Agent Rule**: Every animation implementation must include a `useReducedMotion` check. Disable transforms; keep opacity transitions at short durations if motion is reduced.

---

## Animatable CSS Properties — Quick Reference

| Category | Properties |
|---|---|
| Transform | `x`, `y`, `z`, `rotate`, `rotateX`, `rotateY`, `scale`, `scaleX`, `scaleY`, `skew`, `skewX`, `skewY` |
| Visibility | `opacity` |
| Color | `color`, `backgroundColor`, `borderColor`, `fill`, `stroke` |
| Dimension | `width`, `height`, `borderRadius`, `padding`, `margin` |
| Shadow | `boxShadow`, `textShadow`, `filter` |
| SVG | `pathLength`, `pathOffset`, `pathSpacing`, `strokeDasharray` |

**Agent Rule**: Use shorthand transform props (`x`, `y`, `scale`) over `transform` strings. Framer Motion optimizes these with GPU compositing automatically.

---

## Anti-Patterns — Do Not Use

| Anti-Pattern | Correct Approach |
|---|---|
| Animating `left`/`top` CSS | Use `x`/`y` transform props |
| Nesting `AnimatePresence` arbitrarily | One `AnimatePresence` per conditional tree |
| Missing `key` on list children | All `motion` list children need stable `key` |
| Using `animate` for scroll-linked values | Use `style` prop with motion values from `useTransform` |
| `layoutId` duplicated in DOM | `layoutId` must be unique across entire tree |
| No `useReducedMotion` check | Always implement accessibility fallback |
| Animating `width`/`height` manually | Use `layout` prop for size-change animations |

---
