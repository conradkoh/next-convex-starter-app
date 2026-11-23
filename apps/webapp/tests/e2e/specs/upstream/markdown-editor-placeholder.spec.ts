import { expect, test, type Locator, type Page } from '@playwright/test';

import { MarkdownEditorTestPage } from '../../pages/markdown-editor.page';
import { TAG_MARKDOWN, TAG_UPSTREAM } from '../../support/tags';

/** The Interactive Editor's `placeholder` prop on /test/markdown-editor. */
const PLACEHOLDER = 'Start writing markdown...';

/** TipTap marks the empty block that holds the caret; in an empty editor it is the first child. */
const EMPTY_FIRST_BLOCK = ':scope > .is-editor-empty:first-child';

const VIEWPORTS = [
  { name: 'desktop', viewport: { width: 1280, height: 800 } },
  { name: 'mobile', viewport: { width: 390, height: 844 } },
] as const;

/** Resolves the muted-text token on a probe element, so the prompt colour can be compared with it. */
async function probeMutedTextColour(page: Page): Promise<string> {
  return page.evaluate(() => {
    const probe = document.createElement('div');
    probe.className = 'text-muted-foreground';
    document.body.append(probe);
    const value = getComputedStyle(probe).color;
    probe.remove();
    return value;
  });
}

/** Computed `::before` of a block, where the placeholder prompt is drawn. */
async function promptOf(block: Locator) {
  return block.evaluate((element) => {
    const style = getComputedStyle(element, '::before');
    return {
      content: style.content,
      color: style.color,
      pointerEvents: style.pointerEvents,
    };
  });
}

/** Box of a block, read without scrolling it into view. */
async function rectOf(block: Locator) {
  return block.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return { top: rect.top, height: rect.height };
  });
}

/** Empties the Interactive Editor the way a user does: select all, then delete. */
async function clearEditor(page: Page, editor: Locator): Promise<void> {
  await editor.click();
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.press('Delete');
  await expect(editor.locator(EMPTY_FIRST_BLOCK)).toHaveCount(1);
}

for (const { name, viewport } of VIEWPORTS) {
  test.describe(
    `Markdown editor placeholder (${name})`,
    { tag: [TAG_UPSTREAM, TAG_MARKDOWN] },
    () => {
      test.use({ viewport });

      for (const theme of ['light', 'dark'] as const) {
        test(`empty editor paints the prompt in muted text, not selectable (${theme})`, async ({
          page,
        }) => {
          await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
          const demo = new MarkdownEditorTestPage(page);
          await demo.navigate();
          await expect(page.locator('html')).toHaveClass(
            theme === 'dark' ? /\bdark\b/ : /^(?!.*\bdark\b)/
          );

          const editor = demo.interactiveEditorEditable;
          await clearEditor(page, editor);

          const prompt = await promptOf(editor.locator(EMPTY_FIRST_BLOCK));
          expect(prompt.content).toBe(`"${PLACEHOLDER}"`);
          expect(prompt.color).toBe(await probeMutedTextColour(page));
          expect(prompt.pointerEvents).toBe('none');
        });
      }

      test('the prompt adds no height, and the first typed character replaces it', async ({
        page,
      }) => {
        const demo = new MarkdownEditorTestPage(page);
        await demo.navigate();
        const editor = demo.interactiveEditorEditable;
        await clearEditor(page, editor);

        const block = editor.locator(':scope > :first-child');
        const withPrompt = await rectOf(block);

        await page.keyboard.type('a');
        await expect(editor.locator(EMPTY_FIRST_BLOCK)).toHaveCount(0);
        expect((await promptOf(block)).content).toBe('none');

        const withText = await rectOf(block);
        expect(withText.height).toBe(withPrompt.height);
        expect(withText.top).toBe(withPrompt.top);
      });

      test('a non-empty editor never paints the prompt', async ({ page }) => {
        const demo = new MarkdownEditorTestPage(page);
        await demo.navigate();
        const first = demo.interactiveEditorEditable.locator(':scope > :first-child');
        await expect(first).toContainText('Markdown WYSIWYG Demo');
        expect((await promptOf(first)).content).toBe('none');
      });
    }
  );
}
