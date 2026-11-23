import { expect, test, type Locator, type Page } from '@playwright/test';

import { MarkdownEditorTestPage } from '../../pages/markdown-editor.page';
import { TAG_MARKDOWN, TAG_UPSTREAM } from '../../support/tags';

const VIEWPORTS = [
  { name: 'desktop', viewport: { width: 1280, height: 800 } },
  { name: 'mobile', viewport: { width: 390, height: 844 } },
] as const;

/** A button that is not active, used to read the hover fill. */
const INACTIVE_BUTTON = 'Italic';

/** The heading whose caret state drives the active fill. */
const ACTIVE_HEADING = 'Heading 2';

/** Every heading button that currently carries the active fill. */
const ACTIVE_HEADING_BUTTONS = 'button[title^="Heading"][class*="bg-foreground/10"]';

const TRANSPARENT = 'rgba(0, 0, 0, 0)';

/**
 * Resolves a utility class on a probe element, so computed values can be compared with the tokens the
 * toolbar is meant to paint.
 */
async function probe(page: Page, className: string, prop: 'color' | 'backgroundColor') {
  return page.evaluate(
    ({ cls, p }) => {
      const el = document.createElement('div');
      el.className = cls;
      document.body.append(el);
      const value = getComputedStyle(el)[p as 'color'];
      el.remove();
      return value;
    },
    { cls: className, p: prop }
  );
}

const backgroundOf = (locator: Locator) =>
  locator.evaluate((el) => getComputedStyle(el).backgroundColor);
const colourOf = (locator: Locator) => locator.evaluate((el) => getComputedStyle(el).color);

/** The toolbar bar that owns the buttons; its fill must stay visually distinct from both fills. */
const barOf = (button: Locator) => button.locator('xpath=..');

for (const { name, viewport } of VIEWPORTS) {
  test.describe(`Markdown editor toolbar (${name})`, { tag: [TAG_UPSTREAM, TAG_MARKDOWN] }, () => {
    test.use({ viewport });

    for (const theme of ['light', 'dark'] as const) {
      test(`hover paints the non-active button with the foreground/5 fill (${theme})`, async ({
        page,
      }) => {
        await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
        const demo = new MarkdownEditorTestPage(page);
        await demo.navigate();
        await expect(page.locator('html')).toHaveClass(
          theme === 'dark' ? /\bdark\b/ : /^(?!.*\bdark\b)/
        );

        const hoverFill = await probe(page, 'bg-foreground/5', 'backgroundColor');
        expect(hoverFill).not.toBe(TRANSPARENT);

        // Put the caret at the start of the H1 so Italic is provably inactive.
        await demo.interactiveEditorEditable
          .getByRole('heading', { level: 1, name: 'Markdown WYSIWYG Demo' })
          .click();

        const button = demo.interactiveEditor.locator(`button[title="${INACTIVE_BUTTON}"]`);
        await expect(button).not.toHaveClass(/bg-foreground\/10/);
        await button.hover();

        await expect.poll(() => backgroundOf(button)).toBe(hoverFill);
        expect(await backgroundOf(barOf(button))).not.toBe(hoverFill);
      });

      test(`the active heading is filled and its icon takes the foreground colour (${theme})`, async ({
        page,
      }) => {
        await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
        const demo = new MarkdownEditorTestPage(page);
        await demo.navigate();
        await expect(page.locator('html')).toHaveClass(
          theme === 'dark' ? /\bdark\b/ : /^(?!.*\bdark\b)/
        );

        const activeFill = await probe(page, 'bg-foreground/10', 'backgroundColor');
        const foreground = await probe(page, 'text-foreground', 'color');
        expect(activeFill).not.toBe(TRANSPARENT);

        await demo.interactiveEditorEditable
          .getByRole('heading', { level: 2, name: 'Features' })
          .click();

        const button = demo.interactiveEditor.locator(`button[title="${ACTIVE_HEADING}"]`);
        await expect.poll(() => backgroundOf(button)).toBe(activeFill);
        expect(await backgroundOf(barOf(button))).not.toBe(activeFill);
        await expect.poll(() => colourOf(button)).toBe(foreground);
        await expect.poll(() => colourOf(button.locator('svg'))).toBe(foreground);
        await expect(demo.interactiveEditor.locator(ACTIVE_HEADING_BUTTONS)).toHaveCount(1);
      });

      test(`a hovered active button keeps its active fill (${theme})`, async ({ page }) => {
        await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
        const demo = new MarkdownEditorTestPage(page);
        await demo.navigate();
        await expect(page.locator('html')).toHaveClass(
          theme === 'dark' ? /\bdark\b/ : /^(?!.*\bdark\b)/
        );

        const activeFill = await probe(page, 'bg-foreground/10', 'backgroundColor');
        expect(activeFill).not.toBe(TRANSPARENT);

        await demo.interactiveEditorEditable
          .getByRole('heading', { level: 2, name: 'Features' })
          .click();

        const button = demo.interactiveEditor.locator(`button[title="${ACTIVE_HEADING}"]`);
        await expect.poll(() => backgroundOf(button)).toBe(activeFill);

        await button.hover();
        await expect.poll(() => backgroundOf(button)).toBe(activeFill);
      });

      test(`moving the caret into a paragraph clears the heading fill (${theme})`, async ({
        page,
      }) => {
        await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
        const demo = new MarkdownEditorTestPage(page);
        await demo.navigate();
        await expect(page.locator('html')).toHaveClass(
          theme === 'dark' ? /\bdark\b/ : /^(?!.*\bdark\b)/
        );

        const editable = demo.interactiveEditorEditable;
        const button = demo.interactiveEditor.locator(`button[title="${ACTIVE_HEADING}"]`);

        await editable.getByRole('heading', { level: 2, name: 'Features' }).click();
        await expect(button).toHaveClass(/bg-foreground\/10/);
        await expect(demo.interactiveEditor.locator(ACTIVE_HEADING_BUTTONS)).toHaveCount(1);

        await editable.locator(':scope > p').first().click();

        await expect(button).not.toHaveClass(/bg-foreground\/10/);
        await expect(demo.interactiveEditor.locator(ACTIVE_HEADING_BUTTONS)).toHaveCount(0);
      });
    }
  });
}
