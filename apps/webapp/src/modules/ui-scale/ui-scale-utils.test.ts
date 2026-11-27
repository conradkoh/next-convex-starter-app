import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  applyUiScale,
  DEFAULT_UI_SCALE,
  normalizeUiScale,
  readStoredUiScale,
  UI_SCALE_CSS_VAR,
  UI_SCALE_PRESETS,
  UI_SCALE_STORAGE_KEY,
  type UiScale,
} from './ui-scale-utils';

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.style.removeProperty(UI_SCALE_CSS_VAR);
  vi.restoreAllMocks();
});

describe('normalizeUiScale', () => {
  it('keeps the approved preset order', () => {
    expect(UI_SCALE_PRESETS).toEqual([67, 75, 80, 90, 100, 110, 125]);
  });

  it.each([67, 75, 80, 90, 100, 110, 125])(
    'accepts the %i preset as a number and a string',
    (preset) => {
      expect(normalizeUiScale(preset)).toBe(preset);
      expect(normalizeUiScale(String(preset))).toBe(preset);
    }
  );

  it.each([999, '999', 'abc', null, undefined, 85, 100.5, '', '   '])(
    'falls back to the default for %o',
    (value) => {
      expect(normalizeUiScale(value)).toBe(DEFAULT_UI_SCALE);
    }
  );
});

describe('applyUiScale', () => {
  it.each([
    [67, '0.67'],
    [75, '0.75'],
    [80, '0.8'],
    [90, '0.9'],
    [100, '1'],
    [110, '1.1'],
    [125, '1.25'],
  ])('writes the %i%% ratio', (preset, expected) => {
    applyUiScale(preset as UiScale);
    expect(document.documentElement.style.getPropertyValue(UI_SCALE_CSS_VAR)).toBe(expected);
  });
});

describe('readStoredUiScale', () => {
  it('returns the stored preset', () => {
    window.localStorage.setItem(UI_SCALE_STORAGE_KEY, '125');
    expect(readStoredUiScale()).toBe(125);
  });

  it('falls back to the default for invalid or missing values', () => {
    window.localStorage.setItem(UI_SCALE_STORAGE_KEY, '999');
    expect(readStoredUiScale()).toBe(DEFAULT_UI_SCALE);

    window.localStorage.removeItem(UI_SCALE_STORAGE_KEY);
    expect(readStoredUiScale()).toBe(DEFAULT_UI_SCALE);
  });

  it('falls back to the default when storage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('storage blocked');
    });

    expect(readStoredUiScale()).toBe(DEFAULT_UI_SCALE);
  });
});
