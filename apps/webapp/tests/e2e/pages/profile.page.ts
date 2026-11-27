import { expect, type Locator, type Page } from '@playwright/test';

import { BasePage } from './base.page';

export class ProfilePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Profile', exact: true });
  }

  get accountInformationHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Account Information' });
  }

  get themePreferencesHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Theme Preferences' });
  }

  get displaySizeHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Display Size' });
  }

  get displaySizeGroup(): Locator {
    return this.page.getByRole('radiogroup', { name: 'Display Size' });
  }

  get displaySizeMessages(): Locator {
    return this.displaySizeHeading.locator('..').locator('[role="alert"], [role="status"]');
  }

  displaySizeOption(percent: number): Locator {
    return this.displaySizeGroup.getByRole('radio', { name: new RegExp(`^${percent}%`) });
  }

  displaySizeCard(percent: number): Locator {
    return this.displaySizeOption(percent).locator('..');
  }

  async rootFontSizePx(): Promise<number> {
    return this.page.evaluate(() =>
      Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
    );
  }

  async headingWidth(): Promise<number> {
    const box = await this.heading.boundingBox();
    if (!box) {
      throw new Error('Profile heading is not visible');
    }
    return box.width;
  }

  async displaySizeCardHeight(percent: number): Promise<number> {
    const box = await this.displaySizeCard(percent).boundingBox();
    if (!box) {
      throw new Error(`Display Size card for ${percent}% is not visible`);
    }
    return box.height;
  }

  async displaySizeOptionBounds(percent: number): Promise<{ x: number; width: number }> {
    const box = await this.displaySizeOption(percent).boundingBox();
    if (!box) {
      throw new Error(`Display Size option ${percent}% is not visible`);
    }
    return { x: box.x, width: box.width };
  }

  override async navigate(path = '/app/profile'): Promise<void> {
    await this.page.goto(path);
    await expect(this.heading).toBeVisible();
  }
}
