import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { DisplaySettings } from './DisplaySettings';
import { UI_SCALE_CSS_VAR, UI_SCALE_STORAGE_KEY } from './ui-scale-utils';
import { UiScaleProvider } from './UiScaleProvider';

function renderSettings() {
  return render(
    <UiScaleProvider>
      <DisplaySettings />
    </UiScaleProvider>
  );
}

beforeEach(() => {
  window.localStorage.clear();
  document.documentElement.style.removeProperty(UI_SCALE_CSS_VAR);
});

afterEach(() => {
  window.localStorage.clear();
  document.documentElement.style.removeProperty(UI_SCALE_CSS_VAR);
});

describe('UiScaleProvider', () => {
  it('applies the stored scale after mount', async () => {
    window.localStorage.setItem(UI_SCALE_STORAGE_KEY, '125');

    renderSettings();

    expect(await screen.findByRole('radio', { name: '125%' })).toBeChecked();
    expect(document.documentElement.style.getPropertyValue(UI_SCALE_CSS_VAR)).toBe('1.25');
  });

  it('falls back to 100 for an invalid stored value', async () => {
    window.localStorage.setItem(UI_SCALE_STORAGE_KEY, '999');

    renderSettings();

    expect(await screen.findByRole('radio', { name: '100% (default)' })).toBeChecked();
    expect(document.documentElement.style.getPropertyValue(UI_SCALE_CSS_VAR)).toBe('1');
  });

  it('applies and persists a newly chosen scale', async () => {
    const user = userEvent.setup();

    renderSettings();

    await user.click(await screen.findByRole('radio', { name: '67%' }));

    expect(screen.getByRole('radio', { name: '67%' })).toBeChecked();
    expect(document.documentElement.style.getPropertyValue(UI_SCALE_CSS_VAR)).toBe('0.67');
    expect(window.localStorage.getItem(UI_SCALE_STORAGE_KEY)).toBe('67');
  });
});
