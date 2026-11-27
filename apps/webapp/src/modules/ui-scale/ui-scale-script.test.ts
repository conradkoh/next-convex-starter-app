import { afterEach, describe, expect, it } from 'vitest';

import { uiScaleScript } from './ui-scale-script';
import { UI_SCALE_CSS_VAR, UI_SCALE_STORAGE_KEY } from './ui-scale-utils';

function runScript() {
  new Function(uiScaleScript)();
}

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.style.removeProperty(UI_SCALE_CSS_VAR);
});

describe('uiScaleScript', () => {
  it.each([
    ['67', '0.67'],
    ['100', '1'],
    ['125', '1.25'],
  ])('applies the stored %s before hydration', (stored, expected) => {
    window.localStorage.setItem(UI_SCALE_STORAGE_KEY, stored);

    runScript();

    expect(document.documentElement.style.getPropertyValue(UI_SCALE_CSS_VAR)).toBe(expected);
  });

  it.each([null, '', '999', 'abc', '100.5', '85'])('falls back to 100%% for %o', (stored) => {
    if (stored !== null) {
      window.localStorage.setItem(UI_SCALE_STORAGE_KEY, stored);
    }

    runScript();

    expect(document.documentElement.style.getPropertyValue(UI_SCALE_CSS_VAR)).toBe('1');
  });
});
