import { expect, type Locator, type Page } from '@playwright/test';

import { BasePage } from './base.page';

export class ThirdPartyIntegrationsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  get heading(): Locator {
    return this.page.getByRole('heading', { name: 'Third-party integrations', exact: true });
  }

  get availableHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Available integrations', exact: true });
  }

  get configureTelegramLink(): Locator {
    return this.page.getByRole('link', { name: 'Configure', exact: true });
  }

  get connectedHeading(): Locator {
    return this.page.getByRole('heading', { name: 'Connected integrations', exact: true });
  }

  get actionsButton(): Locator {
    return this.page.getByRole('button', {
      name: 'Actions for Telegram connection',
      exact: true,
    });
  }

  get deleteMenuItem(): Locator {
    return this.page.getByRole('menuitem', { name: 'Delete connection', exact: true });
  }

  get deleteConfirmationButton(): Locator {
    return this.page.getByRole('button', { name: 'Delete connection', exact: true });
  }

  override async navigate(path = '/app/settings/notifications/third-party'): Promise<void> {
    await this.page.goto(path);
    await expect(this.heading).toBeVisible();
  }

  async openActions(): Promise<void> {
    await this.actionsButton.click();
    await expect(this.deleteMenuItem).toBeVisible();
  }
}
