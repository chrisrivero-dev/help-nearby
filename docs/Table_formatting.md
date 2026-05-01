# Table Formatting & Styling Directive

**Stack:** TypeScript · Next.js · Prisma · PostgreSQL · shadcn/ui · Tailwind CSS · Framer Motion

---

## 1. Library Selection

### Decision Framework

| Scenario                         | Recommended Approach                               |
| -------------------------------- | -------------------------------------------------- |
| Simple read-only, < 200 rows     | Native `<table>` + shadcn/ui primitives            |
| Sortable, filterable, paginated  | **TanStack Table v8** (headless) + shadcn/ui cells |
| 10k+ rows, virtual scrolling     | TanStack Table + `@tanstack/react-virtual`         |
| Heavy inline editing, Excel-like | AG Grid Community (last resort — heavy bundle)     |

**Default to TanStack Table v8.** It is headless, pairs cleanly with Tailwind, has zero opinion on markup, and handles all use cases listed. Build a single shared `<DataTable />` wrapper that accepts a TanStack instance and renders shadcn-styled cells.

---

## 2. Structural Foundations

### Markup Contract

- Always use semantic `<table>`, `<thead>`, `<tbody>`, `<tfoot>`, `<th scope="col">`, `<td>`.
- Never use `<div>`-based table layouts unless rendering a virtual list — and even then, apply `role="grid"`, `role="row"`, `role="gridcell"`.
- `<th>` must always carry `scope="col"` or `scope="row"`. No exceptions.

### Container Pattern

```tsx
// components/data-table/data-table.tsx
<div className="relative w-full">
  {/* Scroll container — DO NOT remove overflow-x-auto */}
  <div className="overflow-x-auto rounded-md border border-border">
    <table className="w-full caption-bottom text-sm">...</table>
  </div>
</div>
```

- The outer `div` is the layout anchor — position sticky headers relative to this, not `<body>`.
- The scroll container carries `overflow-x-auto`. This is the single scroll boundary for the table.
- Never place `overflow: hidden` on the outer wrapper — it will clip sticky columns and dropdown portals.

---

## 3. Column Width Management

### Rules

1. **Never hardcode `px` widths on `<td>` or `<th>` directly.** Use `min-w-*`, `max-w-*`, and `w-*` via Tailwind on the `<col>` element in a `<colgroup>`, or as `style` props when dynamic.
2. Use `table-fixed` on the `<table>` element when column count is known and stable — it prevents layout thrash.
3. Use `table-auto` (default) when columns are unknown or content-driven.
4. For TanStack Table, set `size`, `minSize`, `maxSize` on column definitions — these map directly to `style={{ width }}` on cells.

```tsx
// Column definition example — TanStack Table v8
{
  accessorKey: 'name',
  header: 'Name',
  size: 200,       // base width in px
  minSize: 120,    // collapse floor
  maxSize: 400,    // stretch ceiling
  enableResizing: true,
}
```

### Flexible vs Fixed Columns

- **Fixed:** ID, date, status badge, action buttons. Use `w-[80px]` or `w-[120px]`.
- **Flexible:** Name, description, notes. Use `min-w-[160px]` + let them grow via `flex-1` or `w-auto`.
- **Never allow a text column to be zero-width.** Always pair a `min-w-*` with any flexible column.

---

## 4. Viewport & Responsive Behavior

### Mobile-First Strategy

Tables are inherently 2D — do not try to force them into a single-column card layout unless the dataset is trivially simple. Instead, apply one of these patterns based on complexity:

| Viewport       | Pattern                                              |
| -------------- | ---------------------------------------------------- |
| `xl` and above | Full table, all columns visible                      |
| `md` to `lg`   | Hide low-priority columns via `hidden md:table-cell` |
| `sm` and below | Horizontal scroll OR card/list mode toggle           |

### Column Visibility by Breakpoint (TanStack v8)

```tsx
// Define column visibility per breakpoint using a hook
const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
  updatedAt: false, // always hidden on mobile
  description: false, // controlled by breakpoint logic below
});

useEffect(() => {
  const mq = window.matchMedia("(min-width: 768px)");
  const handler = (e: MediaQueryListEvent) =>
    setColumnVisibility((prev) => ({ ...prev, description: e.matches }));
  mq.addEventListener("change", handler);
  setColumnVisibility((prev) => ({ ...prev, description: mq.matches }));
  return () => mq.removeEventListener("change", handler);
}, []);
```

### Scroll Behavior

- Horizontal scroll is always preferred over wrapping cell content.
- Add a subtle scroll shadow gradient to indicate overflow:

```tsx
// Scroll shadow overlay — position absolute, pointer-events-none
<div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-background to-transparent" />
```

---

## 5. Sticky Headers & Columns

### Sticky Header

```tsx
<thead className="sticky top-0 z-10 bg-background border-b border-border">
```

- `z-10` keeps the header above cell content during scroll.
- `bg-background` is required — without it, rows scroll behind a transparent header.
- Do not use `backdrop-blur` on sticky headers if the table is inside a modal — blur compositing creates visual artifacts.

### Sticky First Column (Row Labels / Actions)

```tsx
// On <th> and the corresponding <td>
className =
  "sticky left-0 z-[5] bg-background after:absolute after:right-0 after:top-0 after:h-full after:w-px after:bg-border";
```

- Use a pseudo-element border, not `border-r` — `border-r` disappears behind the scrolled content.
- `z-[5]` must be less than the sticky header's `z-10` so the header overlaps the column label on corner intersection.

---

## 6. Zoom & Scaling

### What Breaks at Zoom

- Fixed `px` heights on rows clip text at 150%+ zoom.
- `overflow: hidden` on cells clips content at zoom.
- Absolute-positioned dropdowns detach from their trigger cells.
- `border-collapse` combined with `sticky` causes double-border artifacts.

### Fixes

- Use `min-h-*` not `h-*` on `<tr>` and `<td>`.
- Use `border-separate` with `border-spacing-0` instead of `border-collapse` when sticky columns are present.
- All dropdown/popover content (select menus, comboboxes, date pickers) must render in a **portal** (`document.body`) — never inside the table DOM tree.
- Use `rem`-based font sizes only. No `px` font sizes in table cells.
- Test at 150%, 200%, and browser text-only zoom (Firefox: View → Zoom → Text Only Zoom).

---

## 7. Overflow & Text Truncation

### Cell Content Rules

| Content Type           | Strategy                                             |
| ---------------------- | ---------------------------------------------------- |
| Short identifiers, IDs | `whitespace-nowrap`                                  |
| Names, labels          | `truncate` + `title` attribute for full value        |
| Descriptions, notes    | `line-clamp-2` + expand on click/hover               |
| Numeric values         | `tabular-nums`, right-align, `whitespace-nowrap`     |
| Long freeform text     | Never raw in cell — use truncate + tooltip or drawer |

### Truncation Implementation

```tsx
// Truncated cell with native tooltip fallback
<td className="max-w-[200px]">
  <span className="block truncate" title={fullValue}>
    {fullValue}
  </span>
</td>
```

For rich tooltips, use shadcn `<Tooltip>` — but only when the content is non-trivial. Do not add tooltip overhead to every cell.

---

## 8. Inline Inputs & Dropdowns

This is the highest-risk area for rendering bugs. Follow strictly.

### General Rules

- **Inputs must never stretch row height unpredictably.** Use `h-8` (32px) inputs inside cells — not `h-10`.
- **Remove default input borders in cell context** and replace with a subtle focus ring: `border-transparent focus:border-primary focus:ring-1 focus:ring-primary`.
- Inline editing cells should visually appear as read-only text until focused/activated — avoid always-visible input chrome.

### Input Cell Pattern

```tsx
<td className="p-0">
  <input
    type="text"
    value={value}
    onChange={...}
    className={cn(
      "h-8 w-full bg-transparent px-3 text-sm",
      "border border-transparent rounded-none",
      "focus:outline-none focus:border-primary focus:ring-1 focus:ring-inset focus:ring-primary",
      "placeholder:text-muted-foreground"
    )}
  />
</td>
```

### Dropdown / Select Cell Pattern

**Critical:** Never render `<select>`, `<Popover>`, or `<DropdownMenu>` with their content inside `<td>`. The overflow clipping of the table will cut them off.

Use shadcn `<Popover>` with `modal={false}` and a portal strategy:

```tsx
// The trigger sits in the cell; content escapes to body via portal
<td className="p-0">
  <Popover>
    <PopoverTrigger asChild>
      <button className="h-8 w-full px-3 text-sm text-left flex items-center justify-between gap-1 hover:bg-muted/50 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-primary rounded-none">
        {selectedLabel}
        <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
      </button>
    </PopoverTrigger>
    <PopoverContent
      className="w-[200px] p-0"
      align="start"
      // Renders in portal by default — do not disable this
    >
      <Command>
        <CommandInput placeholder="Search..." />
        <CommandList>
          {options.map((opt) => (
            <CommandItem
              key={opt.value}
              onSelect={() => handleSelect(opt.value)}
            >
              {opt.label}
            </CommandItem>
          ))}
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</td>
```

### Z-Index Stack for Table Overlays

Establish a clear z-index contract project-wide:

```ts
// lib/z-index.ts
export const Z = {
  tableBase: 0,
  tableStickyCol: 5,
  tableStickyHeader: 10,
  tableDropdownPortal: 50,
  modal: 100,
  toast: 200,
} as const;
```

---

## 9. Sorting & Filtering

### Sorting

- Sort state lives in TanStack Table (`sortingState`). Persist to URL params via `nuqs` for shareable sort state.
- Column header click area must be full-width — avoid small icon-only click targets.
- Show sort direction with an icon (`ArrowUp`, `ArrowDown`, `ArrowUpDown` from lucide-react). Animate direction change with Framer Motion `AnimatePresence`.

```tsx
// Animated sort icon
<AnimatePresence mode="wait">
  <motion.span
    key={column.getIsSorted() as string}
    initial={{ opacity: 0, y: -4 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 4 }}
    transition={{ duration: 0.12 }}
  >
    {column.getIsSorted() === "asc" ? (
      <ArrowUp />
    ) : column.getIsSorted() === "desc" ? (
      <ArrowDown />
    ) : (
      <ArrowUpDown />
    )}
  </motion.span>
</AnimatePresence>
```

### Filtering

- Global filter: debounce input by 300ms before updating TanStack filter state.
- Column filters: render in a filter row (`<tr>` below `<thead>`) or in a filter panel drawer — never inline above the table in a way that shifts the table's top position (breaks sticky header offset).
- Server-side filtering: pass filter state to Prisma `where` clauses via tRPC or Server Actions. Do not filter 10k rows client-side.

---

## 10. Pagination

### Rules

- Always paginate server-side for datasets > 500 rows.
- Use cursor-based pagination (Prisma `cursor` + `take`) over offset pagination for large tables — offset degrades with deep pages.
- Expose `pageSize` control: [10, 25, 50, 100]. Default to 25.
- Show total row count and current range: "Showing 26–50 of 1,240".
- Pagination controls sit **outside** the scroll container — below the table, full width.

```tsx
// Prisma cursor pagination pattern
const rows = await prisma.entity.findMany({
  take: pageSize + 1, // fetch one extra to know if next page exists
  cursor: cursor ? { id: cursor } : undefined,
  skip: cursor ? 1 : 0,
  orderBy: { id: "asc" },
});
const hasNextPage = rows.length > pageSize;
const data = hasNextPage ? rows.slice(0, -1) : rows;
const nextCursor = hasNextPage ? data[data.length - 1].id : null;
```

---

## 11. Row States & Visual Feedback

### Required States

| State                    | Implementation                                                             |
| ------------------------ | -------------------------------------------------------------------------- |
| Hover                    | `hover:bg-muted/50` on `<tr>`                                              |
| Selected                 | `data-[state=selected]:bg-primary/10` via TanStack row selection           |
| Focused row (keyboard)   | `focus-visible:outline focus-visible:outline-2 focus-visible:ring-primary` |
| Loading row (optimistic) | Skeleton shimmer via `animate-pulse bg-muted`                              |
| Error row                | `bg-destructive/10 border-l-2 border-destructive`                          |
| Disabled row             | `opacity-50 pointer-events-none`                                           |

### Framer Motion Row Entry

For paginated data loads, stagger row entry:

```tsx
<motion.tr
  key={row.id}
  initial={{ opacity: 0, y: 6 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.15, delay: index * 0.03 }}
>
```

Cap the delay at ~15 rows (`Math.min(index, 15) * 0.03`) so the last rows don't wait 2+ seconds.

---

## 12. Accessibility

- All interactive column headers must be `<button>` elements inside `<th>`, not the `<th>` itself.
- Every `<table>` must have an `aria-label` or be associated with a `<caption>`.
- Checkbox columns for row selection: `aria-label="Select row"` on each checkbox, `aria-label="Select all"` on the header checkbox.
- Keyboard navigation: `Tab` moves between interactive cells; `Enter` activates inline edit; `Escape` cancels. Implement with `onKeyDown` handlers.
- Color alone must never convey row state — always pair color with an icon or text label.

---

## 13. Performance Guardrails

- **Virtual scrolling** is required for > 500 visible rows. Use `@tanstack/react-virtual` with a fixed `estimateSize` of your row height.
- Never `memo` every cell individually as a first pass. Profile first. Over-memoization causes its own overhead.
- Use `React.memo` on the row component, not individual cells.
- Server Components (Next.js App Router): Fetch initial data in the Server Component, pass to a `"use client"` `<DataTable />` wrapper. Do not fetch table data inside a Client Component on mount.
- Avoid `useEffect` for data fetching in table components. Use Server Actions or tRPC query hooks.

---

## 14. Common Anti-Patterns — Do Not Do

| Anti-Pattern                                       | Why It Breaks                                                                                    |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `overflow: hidden` on table wrapper                | Clips sticky elements and dropdown portals                                                       |
| `position: relative` on `<td>` with a portal child | Portal escapes to body but calculates position relative to `<td>`, causes misalignment at scroll |
| Rendering `<select>` natively inside cells         | Cannot be styled consistently; clips at table boundaries                                         |
| `border-collapse` + `sticky` columns together      | Double-border artifacts, border disappears on scroll in Chromium                                 |
| `h-[fixed]` on rows                                | Clips content at zoom, breaks with dynamic content                                               |
| Hardcoded column widths in `px` on `<td>` directly | Ignored when `table-fixed` is set; use `<colgroup>` or TanStack `size`                           |
| Filtering/sorting 10k rows client-side             | Main thread jank; always delegate to Prisma/DB                                                   |
| No `key` on rows or using array index as `key`     | Framer Motion and React reconciliation bugs on sort/filter                                       |

---

## 15. Checklist Before Shipping a Table

```
[ ] overflow-x-auto on scroll container
[ ] sticky header with z-index and bg-background
[ ] All dropdowns/popovers render via portal
[ ] min-w on all flexible columns
[ ] text truncation on long-content columns with title or tooltip
[ ] Tested at 150% and 200% browser zoom
[ ] Tested at 375px viewport width (iPhone SE)
[ ] Keyboard navigable — Tab, Enter, Escape
[ ] aria-label on table
[ ] scope="col" on all <th>
[ ] Loading, empty, and error states handled
[ ] Server-side pagination if dataset > 500 rows
[ ] Row keys are stable IDs, not array indices
[ ] Sort state persisted to URL
[ ] No inline <select> — all dropdowns use Popover + Command
```
