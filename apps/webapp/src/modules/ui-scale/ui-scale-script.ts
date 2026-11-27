import {
  DEFAULT_UI_SCALE,
  UI_SCALE_CSS_VAR,
  UI_SCALE_PRESETS,
  UI_SCALE_STORAGE_KEY,
} from './ui-scale-utils';

/**
 * Pre-hydration application of the stored Display Size preference.
 *
 * Injected with `strategy="beforeInteractive"` in the root layout so the stored
 * scale is applied before first paint (no flash of the 100% size). The preset
 * list is inlined from `UI_SCALE_PRESETS`; anything that is not an exact preset
 * falls back to `DEFAULT_UI_SCALE`, mirroring `normalizeUiScale`.
 */
export const uiScaleScript = `
(() => {
  var presets = ${JSON.stringify(UI_SCALE_PRESETS)};
  var stored = null;
  try {
    stored = window.localStorage.getItem(${JSON.stringify(UI_SCALE_STORAGE_KEY)});
  } catch (error) {
    stored = null;
  }
  var value = stored === null || String(stored).trim() === '' ? NaN : Number(stored);
  var scale = presets.indexOf(value) === -1 ? ${DEFAULT_UI_SCALE} : value;
  document.documentElement.style.setProperty(${JSON.stringify(UI_SCALE_CSS_VAR)}, String(scale / 100));
})();
`;
