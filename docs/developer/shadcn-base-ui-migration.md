# Migrating shadcn/ui from Radix UI to Base UI

Developer guide for migrating the project's shadcn/ui component library from Radix UI primitives to the new Base UI backend. Based on the community migration guide at [github.com/shadcn-ui/ui/discussions/9562](https://github.com/shadcn-ui/ui/discussions/9562).

---

## Background

shadcn/ui originally built its headless primitives on **Radix UI**. The library now offers an alternative backend called **Base UI** (`@base-ui/react`) — developed by the MUI team — which provides similar primitives with a slightly different API surface.

The migration is **opt-in**: your existing Radix-based components continue to work; you migrate components one at a time.

**Why migrate?**

- Base UI is actively developed and positions as the long-term direction for shadcn/ui
- Smaller runtime footprint per-primitive
- More explicit positioning API via Floating UI (replaces Radix's internal positioning)

---

## Current State

| Item           | Value                                             |
| -------------- | ------------------------------------------------- |
| Style          | `new-york` (Radix UI backend)                     |
| Components     | 26 components in `apps/webapp/src/components/ui/` |
| Radix packages | 16 `@radix-ui/react-*` packages                   |

---

## Migration Strategy

> **Do NOT do a big-bang replacement.** The Radix UI and Base UI APIs differ in ways that require per-component adaptation. Migrate components individually, in dependency order.

### Recommended Order

1. **Independent atomic components** — no internal dependencies (e.g., Button, Badge, Skeleton)
2. **Composite components** — depend on other local UI components (e.g., Card, Alert)
3. **Business components** — built on top of local UI (e.g., fixed-size-dialog)
4. **Native Radix extensions** — components that extend Radix APIs directly (e.g., AlertDialog, DropdownMenu)
5. **Global regression** — test all components in light/dark/system mode

---

## Method A: CLI (Recommended)

### Step 1: Update `components.json`

In `apps/webapp/components.json`, change the style:

```json
{
  "style": "base-vega"
}
```

### Step 2: Overwrite components via CLI

```bash
cd apps/webapp

# Overwrite all components at once
pnpm dlx shadcn@latest add --all --overwrite

# Or overwrite specific components
pnpm dlx shadcn@latest add button --overwrite
pnpm dlx shadcn@latest add dialog --overwrite
```

> The CLI fetches the Base UI version of each component from the shadcn registry and overwrites the existing file.

---

## Method B: Manual Migration

1. Install the Base UI package:

   ```bash
   cd apps/webapp && pnpm add @base-ui/react
   ```

2. Copy the Base UI component code from [ui.shadcn.com](https://ui.shadcn.com/) into the corresponding `src/components/ui/<component>.tsx` files.

---

## Key API Changes to Watch For

### Remove `asChild` prop

Base UI renders differently from Radix. **Globally remove `asChild`** from all component usages:

```tsx
// Before (Radix)
<Button asChild>
  <Link href="/app">Go</Link>
</Button>

// After (Base UI) — compose directly
<Link href="/app" className={buttonVariants()}>Go</Link>
```

### Checkbox — type and indeterminate

```tsx
// Before
checked={someBoolean | "indeterminate"}

// After
checked={someBoolean}   // boolean only
indeterminate={true}    // separate prop for partial selection
```

### ToggleGroup — value and selection mode

```tsx
// Before (Radix) — value is string or string[]
<ToggleGroup value="a">

// After (Base UI) — value must always be array; use `multiple` for multi-select
<ToggleGroup value={["a"]} multiple={false}>
```

### Form components — migrate to `Field`

Base UI introduces a `Field` component to replace the existing `Form` system. This is the largest breaking change and affects any component built on top of `react-hook-form`'s shadcn `Form`. Refer to the [official docs](https://base-ui.com/react/components/field) for the migration path.

### Positioning — Floating UI replaces Radix positioning

Any component that positions a floating element (Popover, DropdownMenu, Select, Tooltip) now uses **Floating UI** internally. Custom positioning code that references Radix's `data-[side=...]` selectors needs updating:

```css
/* Before (Radix) */
[data-state=open].radix-popper { ... }

/* After (Base UI / Floating UI) */
[data-open] { ... }
```

---

## Cleanup

Once all components are verified and stable, remove the legacy Radix packages:

```bash
cd apps/webapp
pnpm remove \
  @radix-ui/react-alert-dialog \
  @radix-ui/react-checkbox \
  @radix-ui/react-collapsible \
  @radix-ui/react-dialog \
  @radix-ui/react-dropdown-menu \
  @radix-ui/react-label \
  @radix-ui/react-popover \
  @radix-ui/react-progress \
  @radix-ui/react-radio-group \
  @radix-ui/react-scroll-area \
  @radix-ui/react-select \
  @radix-ui/react-separator \
  @radix-ui/react-slot \
  @radix-ui/react-switch \
  @radix-ui/react-tabs \
  @radix-ui/react-tooltip
```

> Keep `@radix-ui/react-icons` — it is an icon package, not a primitive, and is still used throughout the project.

---

## Testing Checklist

After migrating each component, verify:

- [ ] Component renders correctly in **light mode**
- [ ] Component renders correctly in **dark mode**
- [ ] Component renders correctly in **system mode**
- [ ] Keyboard navigation works
- [ ] Animations/transitions work (open/close states)
- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Existing tests pass (`pnpm test`)

---

## Reference

- [GitHub Discussion: Shadcn UI Migration Guide — Radix UI to Base UI](https://github.com/shadcn-ui/ui/discussions/9562)
- [Base UI Official Docs](https://base-ui.com/react/overview)
- [Floating UI Docs](https://floating-ui.com)
- [Reference migration project (Vite)](https://github.com/yluiop123/vite-shadcn) — compare `radix-ui` vs `main` branches
