import { expect, test, type Locator, type Page } from '@playwright/test';

import { MarkdownEditorTestPage } from '../../pages/markdown-editor.page';
import { TAG_MARKDOWN, TAG_UPSTREAM } from '../../support/tags';

async function metricsOf(locator: Locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      fontWeight: style.fontWeight,
      marginTop: style.marginTop,
      marginBottom: style.marginBottom,
      paddingLeft: style.paddingLeft,
      paddingBottom: style.paddingBottom,
      borderBottomWidth: style.borderBottomWidth,
      backgroundColor: style.backgroundColor,
    };
  });
}

async function listPitch(items: Locator): Promise<number> {
  // Measure both items in one pass: `boundingBox()` scrolls each item into view, so two calls can
  // report positions from different scroll offsets on a long page.
  const tops = await items.evaluateAll((elements) => {
    if (elements.length < 2) return null;
    return elements.slice(0, 2).map((element) => element.getBoundingClientRect().y);
  });
  if (!tops) {
    throw new Error('Expected the first two list items to have layout boxes');
  }
  return tops[1] - tops[0];
}

/** Resolves a Tailwind theme utility on a probe element, so a colour can be compared with a token. */
async function probeTokenValue(
  page: Page,
  className: string,
  property: 'color' | 'backgroundColor'
): Promise<string> {
  return page.evaluate(
    ({ cls, prop }) => {
      const probe = document.createElement('div');
      probe.className = cls;
      document.body.append(probe);
      const value = getComputedStyle(probe)[prop];
      probe.remove();
      return value;
    },
    { cls: className, prop: property }
  );
}

/**
 * Proves the code surfaces paint from the `muted` theme token rather than a light-only literal:
 * a `bg-muted` probe appended to the same document must resolve to the same background colour.
 */
async function expectMutedTokenBackground(page: Page, root: Locator): Promise<void> {
  const probe = await probeTokenValue(page, 'bg-muted', 'backgroundColor');

  const background = (locator: Locator) =>
    locator.evaluate((element) => getComputedStyle(element).backgroundColor);

  const pre = root.locator('pre').first();
  const inlineCode = root.locator('p code').first();
  await expect(pre).toBeVisible();
  await expect(inlineCode).toBeVisible();
  expect(await background(pre), 'fenced code background').toBe(probe);
  expect(await background(inlineCode), 'inline code background').toBe(probe);
}

/** Resolved colours and rules that the preset must mirror from the viewer map. */
async function mirrorOf(root: Locator) {
  return root.evaluate((element) => {
    const styleOf = (selector: string) => {
      const target = element.querySelector(selector);
      if (!target) throw new Error(`Missing ${selector} in the rendered markdown`);
      return getComputedStyle(target);
    };
    const rule = styleOf('hr');
    return {
      bodyColour: styleOf('p').color,
      linkColour: styleOf('a').color,
      strongColour: styleOf('strong').color,
      headingColour: styleOf('h2').color,
      hrMarginTop: rule.marginTop,
      hrMarginBottom: rule.marginBottom,
      hrBorderColour: rule.borderTopColor,
    };
  });
}

/**
 * The second fence in the sample has no language. Its child `code` must not draw an inline chip,
 * so the block reads 14px/22px with no border, background or padding on the code.
 */
async function expectPlainFence(root: Locator): Promise<void> {
  const pre = root.locator('pre').nth(1);
  await expect(pre).toBeVisible();
  const metrics = await pre.evaluate((element) => {
    const code = element.querySelector('code');
    if (!code) throw new Error('Language-less fence has no code element');
    const preStyle = getComputedStyle(element);
    const codeStyle = getComputedStyle(code);
    return {
      preFontSize: preStyle.fontSize,
      preLineHeight: preStyle.lineHeight,
      preBackground: preStyle.backgroundColor,
      codeFontSize: codeStyle.fontSize,
      codeBackground: codeStyle.backgroundColor,
      codeBorderTopWidth: codeStyle.borderTopWidth,
      codePaddingTop: codeStyle.paddingTop,
      codePaddingLeft: codeStyle.paddingLeft,
    };
  });
  expect(metrics.preFontSize).toBe('14px');
  expect(metrics.preLineHeight).toBe('22px');
  expect(metrics.preBackground).not.toBe('rgba(0, 0, 0, 0)');
  expect(metrics.codeFontSize).toBe('14px');
  expect(metrics.codeBackground).toBe('rgba(0, 0, 0, 0)');
  expect(metrics.codeBorderTopWidth).toBe('0px');
  expect(metrics.codePaddingTop).toBe('0px');
  expect(metrics.codePaddingLeft).toBe('0px');
}

/** An H2 keeps its size and weight with no rule, and stays one step above the H3 that follows it. */
async function expectHeadingHierarchy(
  h2: Locator,
  h3: Locator,
  sizes: { h2: string; h3: string }
): Promise<void> {
  const heading = await metricsOf(h2);
  expect(heading.borderBottomWidth).toBe('0px');
  expect(heading.paddingBottom).toBe('0px');
  expect(heading.fontWeight).toBe('600');
  expect(heading.fontSize).toBe(sizes.h2);
  expect(heading.marginTop).toBe('32px');

  const subheading = await metricsOf(h3);
  expect(subheading.fontWeight).toBe('600');
  expect(subheading.fontSize).toBe(sizes.h3);
  expect(subheading.marginTop).toBe('24px');
}

const VIEWPORTS = [
  { name: 'desktop', viewport: { width: 1280, height: 800 }, h1: '30px', h2: '24px', h3: '20px' },
  { name: 'mobile', viewport: { width: 390, height: 844 }, h1: '24px', h2: '20px', h3: '18px' },
] as const;

for (const { name, viewport, h1: h1FontSize, h2: h2FontSize, h3: h3FontSize } of VIEWPORTS) {
  test.describe(
    `Markdown typography parity (${name})`,
    { tag: [TAG_UPSTREAM, TAG_MARKDOWN] },
    () => {
      test.use({ viewport });

      test('editor and viewer render the same paragraph, heading, list, and code metrics', async ({
        page,
      }) => {
        const demo = new MarkdownEditorTestPage(page);
        await demo.navigate();

        const editor = demo.livePreviewSection
          .getByTestId('markdown-editor')
          .locator('.ProseMirror');
        const viewer = demo.livePreviewViewer;

        // Paragraph: 16px at prose's 1.75 line-height, 16px block gap on both sides.
        const editorParagraph = editor.locator('p').first();
        const viewerParagraph = viewer.locator('p').first();
        for (const paragraph of [editorParagraph, viewerParagraph]) {
          const metrics = await metricsOf(paragraph);
          expect(metrics.fontSize).toBe('16px');
          expect(metrics.lineHeight).toBe('28px');
          expect(metrics.marginBottom).toBe('16px');
        }

        // H1: semibold, flush with the top of the content, token-sized so mobile shrinks it.
        const editorH1 = await metricsOf(editor.locator('h1'));
        const viewerH1 = await metricsOf(viewer.locator('h1'));
        for (const metrics of [editorH1, viewerH1]) {
          expect(metrics.fontWeight).toBe('600');
          expect(metrics.marginTop).toBe('0px');
          expect(metrics.marginBottom).toBe('16px');
          expect(metrics.fontSize).toBe(h1FontSize);
        }

        // H2: same token scale, no rule, 32px above and 16px below.
        const editorH2 = await metricsOf(editor.locator('h2').first());
        const viewerH2 = await metricsOf(viewer.locator('h2').first());
        for (const metrics of [editorH2, viewerH2]) {
          expect(metrics.fontWeight).toBe('600');
          expect(metrics.marginTop).toBe('32px');
          expect(metrics.marginBottom).toBe('16px');
          expect(metrics.fontSize).toBe(h2FontSize);
        }

        // Lists: 24px indent, 32px item pitch, zero item padding on both sides.
        const editorList = editor.locator('ul').first();
        const viewerList = viewer.locator('ul').first();
        for (const list of [editorList, viewerList]) {
          expect((await metricsOf(list)).paddingLeft).toBe('24px');
        }

        const editorItems = editor.locator('ul > li');
        const viewerItems = viewer.locator('ul > li');
        expect(await listPitch(editorItems)).toBeCloseTo(32, 0);
        expect(await listPitch(viewerItems)).toBeCloseTo(32, 0);
        for (const item of [editorItems.first(), viewerItems.first()]) {
          expect((await metricsOf(item)).paddingLeft).toBe('0px');
        }

        // Fenced code: 14px/22px on the muted surface in both columns.
        const editorPre = await metricsOf(editor.locator('pre').first());
        const viewerPre = await metricsOf(viewer.locator('pre').first());
        for (const metrics of [editorPre, viewerPre]) {
          expect(metrics.fontSize).toBe('14px');
          expect(metrics.lineHeight).toBe('22px');
          expect(metrics.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
        }
        expect(editorPre.backgroundColor).toBe(viewerPre.backgroundColor);

        // Language-less fence: no chip, 14px/22px, in both columns.
        await expectPlainFence(editor);
        await expectPlainFence(viewer);

        // The sample has no inline code. Type it into the editor so the preview renders it through
        // the real viewer component map (the viewer has no prose class to style a bare element).
        await editorParagraph.click();
        await page.keyboard.press('End');
        await page.keyboard.type(' `inline`');
        await expect(viewer.locator('p code')).toHaveText('inline');

        const inlineMetrics = (root: Locator) =>
          root
            .locator('p code')
            .first()
            .evaluate((code) => {
              const style = getComputedStyle(code);
              return {
                fontSize: style.fontSize,
                backgroundColor: style.backgroundColor,
                beforeContent: getComputedStyle(code, '::before').content,
                afterContent: getComputedStyle(code, '::after').content,
              };
            });

        const editorInline = await inlineMetrics(editor);
        const viewerInline = await inlineMetrics(viewer);
        for (const metrics of [editorInline, viewerInline]) {
          expect(metrics.fontSize).toBe('14px');
          expect(metrics.backgroundColor).toBe(editorPre.backgroundColor);
          expect(metrics.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
          expect(metrics.beforeContent).toBe('none');
          expect(metrics.afterContent).toBe('none');
        }

        // Loose list: two paragraphs in one item. Editor and viewer share the item pitch:
        // 28 (line) + 8 (paragraph gap inside the item) + 28 (line) + 4 (item gap) = 68.
        const editorLooseItems = editor.locator('ul').nth(1).locator('li');
        const viewerLooseItems = viewer.locator('ul').nth(1).locator('li');
        const editorLoosePitch = await listPitch(editorLooseItems);
        const viewerLoosePitch = await listPitch(viewerLooseItems);
        expect(viewerLoosePitch).toBeCloseTo(68, 0);
        expect(Math.abs(editorLoosePitch - viewerLoosePitch)).toBeLessThanOrEqual(0.5);

        // Preset mirrors the viewer map: body colour, link, strong, heading colour and the hr rule.
        const editorMirror = await mirrorOf(editor);
        const viewerMirror = await mirrorOf(viewer);
        expect(editorMirror).toEqual(viewerMirror);
        expect(viewerMirror.hrMarginTop).toBe('32px');
        expect(viewerMirror.hrMarginBottom).toBe('32px');
      });

      test('dark tokens resolve the code surfaces on the demo page', async ({ page }) => {
        const demo = new MarkdownEditorTestPage(page);
        await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
        await demo.navigate();
        await expect(page.locator('html')).toHaveClass(/\bdark\b/);

        const editor = demo.livePreviewSection
          .getByTestId('markdown-editor')
          .locator('.ProseMirror');
        await expect(editor).toBeVisible({ timeout: 15_000 });

        // The sample has no inline code; type it so the viewer renders one through its own map.
        const firstParagraph = editor.locator('p').first();
        await firstParagraph.click();
        await page.keyboard.press('End');
        await page.keyboard.type(' `inline`');
        await expect(demo.livePreviewViewer.locator('p code')).toHaveText('inline');

        await expectMutedTokenBackground(page, editor);
        await expectMutedTokenBackground(page, demo.livePreviewViewer);

        await expectPlainFence(editor);
        await expectPlainFence(demo.livePreviewViewer);
        expect(await mirrorOf(editor)).toEqual(await mirrorOf(demo.livePreviewViewer));
      });

      for (const theme of ['light', 'dark'] as const) {
        test(`H2 has no rule and stays above H3 on the demo page (${theme})`, async ({ page }) => {
          await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
          const demo = new MarkdownEditorTestPage(page);
          await demo.navigate();
          await expect(page.locator('html')).toHaveClass(
            theme === 'dark' ? /\bdark\b/ : /^(?!.*\bdark\b)/
          );

          const editor = demo.livePreviewSection
            .getByTestId('markdown-editor')
            .locator('.ProseMirror');
          for (const root of [editor, demo.livePreviewViewer]) {
            await expect(root.locator('h3').first()).toBeVisible();
            await expectHeadingHierarchy(root.locator('h2').first(), root.locator('h3').first(), {
              h2: h2FontSize,
              h3: h3FontSize,
            });
          }
        });

        test(`H2 has no rule and stays above H3 on /test/mdx (${theme})`, async ({ page }) => {
          await page.addInitScript((value) => localStorage.setItem('theme', value), theme);
          await page.goto('/test/mdx');
          const article = page.locator('.mdx-content').first();
          await expect(article.locator('h3').first()).toBeVisible();
          await expectHeadingHierarchy(
            article.locator('h2').first(),
            article.locator('h3').first(),
            {
              h2: h2FontSize,
              h3: h3FontSize,
            }
          );
        });
      }
    }
  );
}
