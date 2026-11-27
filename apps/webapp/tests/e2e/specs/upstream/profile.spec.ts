import { expect } from '@playwright/test';

import { test } from '../../fixtures/auth.fixture';
import { ProfilePage } from '../../pages/profile.page';
import { TAG_NAV, TAG_UPSTREAM } from '../../support/tags';

const PRESETS = [67, 75, 80, 90, 100, 110, 125] as const;
const VIEWPORT_WIDTHS = [375, 768, 1280] as const;

test.describe('Profile Page', { tag: [TAG_UPSTREAM, TAG_NAV] }, () => {
  test('shows profile sections when authenticated', async ({ authenticatedPage }) => {
    const profilePage = new ProfilePage(authenticatedPage);
    await profilePage.navigate();

    await expect(profilePage.heading).toBeVisible();
    await expect(profilePage.accountInformationHeading).toBeVisible();
  });

  test('places Display Size after Theme Preferences with 100% selected', async ({
    authenticatedPage,
  }) => {
    const profilePage = new ProfilePage(authenticatedPage);
    await profilePage.navigate();

    await expect(profilePage.themePreferencesHeading).toBeVisible();
    await expect(profilePage.displaySizeHeading).toBeVisible();
    await expect(profilePage.displaySizeGroup).toBeVisible();

    const themeBox = await profilePage.themePreferencesHeading.boundingBox();
    const displaySizeBox = await profilePage.displaySizeHeading.boundingBox();
    if (!themeBox || !displaySizeBox) {
      throw new Error('Expected Theme Preferences and Display Size headings to render');
    }
    expect(displaySizeBox.y).toBeGreaterThan(themeBox.y);

    await expect(profilePage.displaySizeGroup.getByRole('radio')).toHaveCount(PRESETS.length);
    for (const preset of PRESETS) {
      await expect(profilePage.displaySizeOption(preset)).toBeVisible();
    }
    await expect(profilePage.displaySizeOption(100)).toBeChecked();
  });

  test('rescales the app to 125% and restores it after reload', async ({ authenticatedPage }) => {
    const profilePage = new ProfilePage(authenticatedPage);
    await profilePage.navigate();

    const unscaledWidth = await profilePage.headingWidth();

    await profilePage.displaySizeOption(125).click();

    await expect(profilePage.displaySizeOption(125)).toBeChecked();
    await expect.poll(() => profilePage.rootFontSizePx()).toBeCloseTo(20, 1);
    await expect
      .poll(async () => (await profilePage.headingWidth()) / unscaledWidth)
      .toBeGreaterThan(1.2);
    await expect
      .poll(async () => (await profilePage.headingWidth()) / unscaledWidth)
      .toBeLessThan(1.3);

    await authenticatedPage.reload();
    await expect(profilePage.heading).toBeVisible();
    await expect(profilePage.displaySizeOption(125)).toBeChecked();
    await expect.poll(() => profilePage.rootFontSizePx()).toBeCloseTo(20, 1);
    await expect
      .poll(async () => (await profilePage.headingWidth()) / unscaledWidth)
      .toBeGreaterThan(1.2);

    await expect(profilePage.displaySizeMessages).toHaveCount(0);
  });

  test('falls back to 100% for an invalid stored value', async ({ authenticatedPage }) => {
    const profilePage = new ProfilePage(authenticatedPage);
    await authenticatedPage.addInitScript(() => window.localStorage.setItem('ui-scale', '999'));

    await profilePage.navigate();

    await expect(profilePage.displaySizeOption(100)).toBeChecked();
    await expect.poll(() => profilePage.rootFontSizePx()).toBeCloseTo(16, 1);
  });

  test('moves to the next preset with the arrow keys', async ({ authenticatedPage }) => {
    const profilePage = new ProfilePage(authenticatedPage);
    await profilePage.navigate();

    const unscaledWidth = await profilePage.headingWidth();

    await profilePage.displaySizeOption(100).focus();
    await authenticatedPage.keyboard.press('ArrowRight');

    await expect(profilePage.displaySizeOption(110)).toBeChecked();
    await expect(profilePage.displaySizeOption(110)).toBeFocused();
    await expect
      .poll(async () => (await profilePage.headingWidth()) / unscaledWidth)
      .toBeGreaterThan(1.05);
  });

  test('keeps every display size reachable at every supported width', async ({
    authenticatedPage,
  }) => {
    const profilePage = new ProfilePage(authenticatedPage);

    for (const width of VIEWPORT_WIDTHS) {
      await authenticatedPage.setViewportSize({ width, height: 667 });
      await profilePage.navigate();

      for (const preset of PRESETS) {
        await profilePage.displaySizeOption(preset).click();
        await expect(profilePage.displaySizeOption(preset)).toBeChecked();

        for (const option of PRESETS) {
          const bounds = await profilePage.displaySizeOptionBounds(option);
          expect(bounds.x).toBeGreaterThanOrEqual(0);
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
          expect(await profilePage.displaySizeCardHeight(option)).toBeGreaterThanOrEqual(44);
        }

        const hasHorizontalOverflow = await authenticatedPage.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth
        );
        expect(hasHorizontalOverflow).toBe(false);
      }
    }
  });

  test('does not cap page zoom in the viewport meta', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/app/profile');

    const content = await authenticatedPage
      .locator('meta[name="viewport"]')
      .getAttribute('content');

    expect(content).toBeTruthy();
    expect(content).not.toContain('maximum-scale');
  });
});
