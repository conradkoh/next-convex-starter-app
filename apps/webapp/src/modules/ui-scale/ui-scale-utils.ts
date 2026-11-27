/**
 * Display Size (UI scale) preference utilities.
 *
 * The whole app scales from three touchpoints that must stay in sync:
 * `applyUiScale` writes a unitless ratio to `--ui-scale` on the document root,
 * `uiScaleScript` applies the stored value before first paint, and the `html`
 * rule in `apps/webapp/src/app/globals.css` turns the ratio into the root font
 * size. Switching the mechanism later (for example to CSS `zoom`) means
 * changing all three, not only `applyUiScale`.
 */

export const UI_SCALE_PRESETS = [67, 75, 80, 90, 100, 110, 125] as const;

export type UiScale = (typeof UI_SCALE_PRESETS)[number];

export const DEFAULT_UI_SCALE: UiScale = 100;

/** localStorage key holding the chosen preset as a plain integer string, e.g. "125". */
export const UI_SCALE_STORAGE_KEY = 'ui-scale';

/** Custom property on <html> that `globals.css` reads for the root font size. */
export const UI_SCALE_CSS_VAR = '--ui-scale';

function toNumericScale(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value !== 'string' || value.trim() === '') {
    return Number.NaN;
  }

  return Number(value);
}

/**
 * Accepts a number or numeric string that exactly matches a preset.
 * Everything else (missing, malformed, non-integer, off-preset) becomes 100.
 */
export function normalizeUiScale(value: unknown): UiScale {
  const numeric = toNumericScale(value);

  return (UI_SCALE_PRESETS as readonly number[]).includes(numeric)
    ? (numeric as UiScale)
    : DEFAULT_UI_SCALE;
}

/** Applies the preset to the whole app. No-op during SSR. */
export function applyUiScale(scale: UiScale): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.documentElement.style.setProperty(UI_SCALE_CSS_VAR, String(scale / 100));
}

/** Reads the stored preset after mount; storage failures fall back to 100. */
export function readStoredUiScale(): UiScale {
  if (typeof window === 'undefined') {
    return DEFAULT_UI_SCALE;
  }

  try {
    return normalizeUiScale(window.localStorage.getItem(UI_SCALE_STORAGE_KEY));
  } catch {
    return DEFAULT_UI_SCALE;
  }
}
