# Display Size (UI scale)

Profile → **Display Size** lets each device choose a UI scale of 67 / 75 / 80 / 90 / 100 / 110 / 125 % (default 100 %). The preference is per device, stored in `localStorage` under `ui-scale` as a plain integer string (for example `"125"`), and is not synced to the account. The code lives in `apps/webapp/src/modules/ui-scale/`.

## How it works

- `applyUiScale` writes a unitless ratio to the `--ui-scale` custom property on `<html>`, and `globals.css` converts it to the root font size:

  ```css
  html {
    font-size: calc(var(--ui-scale, 1) * 100%);
  }
  ```

  Tailwind v4 spacing, text and most layout utilities are `rem`-based, so the whole app rescales from this one seam. Switching the mechanism later (for example to CSS `zoom`) only requires changing `applyUiScale`.

- `uiScaleScript` runs with `strategy="beforeInteractive"` in the root layout, so a stored scale is applied before first paint and there is no flash of the 100 % size.
- `normalizeUiScale` accepts only the seven presets. A missing or invalid stored value (`999`, `abc`) falls back to 100 % both before and after hydration.
- The Profile control (`DisplaySettings`) changes the scale live; the rescale is the only confirmation (no toast or "saved" message).

## What scales and what does not

- `rem`-based spacing, text, control heights and layout utilities scale with the setting.
- `px` utilities, `px` borders, and `vh`/`dvh` units do not scale. That is accepted for this mechanism.
- CSS media queries resolve against the browser's initial font size, so `sm:`/`md:` breakpoints do not move with the root scale. The Display Size control therefore uses a rem-based `auto-fit` grid and no breakpoints; avoid adding breakpoint-based layout inside scaled surfaces.
- On viewports ≤ 640 px, `globals.css` intentionally shrinks the `--text-*` tokens, so text is smallest at 67 % on a phone. This is an expected consequence of the preset.

## Accessibility

- The control is an author-provided scaling mechanism, not a replacement for browser or OS zoom. WCAG 1.4.4 is served by leaving zoom uncapped: the root viewport does not set `maximumScale` (a `maximum-scale` below 2 fails WCAG ACT rule b4f0c3).
- Selection is conveyed by the filled radio dot, `border-primary` and `bg-accent` — never colour alone — and every card keeps a 44 CSS px minimum height at every preset, so the control that reverses the setting stays usable.
