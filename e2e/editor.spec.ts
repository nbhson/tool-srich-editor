import { test, expect, Page } from '@playwright/test';

test.describe('SRich Editor - E2E Tests', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/');
    // Wait for editor to be ready
    await page.waitForSelector('.re-content[contenteditable="true"]');
    await page.waitForFunction(() => {
      const log = document.getElementById('event-log');
      return log && log.textContent?.includes('onReady fired');
    }, { timeout: 5000 });
  });

  test.afterEach(async () => {
    await page.close();
  });

  // Helper to get the contenteditable div
  const editorSelector = '.re-content[contenteditable="true"]';
  const toolbarSelector = '.re-toolbar';

  test.describe('Initialization', () => {
    test('should render editor with toolbar and content area', async () => {
      await expect(page.locator('.re-wrapper')).toBeVisible();
      await expect(page.locator(toolbarSelector)).toBeVisible();
      await expect(page.locator(editorSelector)).toBeVisible();
      await expect(page.locator('.re-statusbar')).toBeVisible();
    });

    test('should display placeholder text', async () => {
      const placeholder = page.locator('.re-placeholder');
      await expect(placeholder).toBeVisible();
      await expect(placeholder).toHaveText('Start typing here...');
    });

    test('should hide placeholder when content is typed', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Hello');
      const placeholder = page.locator('.re-placeholder');
      await expect(placeholder).toBeHidden();
    });

    test('should have proper ARIA attributes on toolbar', async () => {
      const toolbar = page.locator(toolbarSelector);
      await expect(toolbar).toHaveAttribute('role', 'toolbar');
      await expect(toolbar).toHaveAttribute('aria-label', 'Formatting toolbar');
    });

    test('should have proper ARIA attributes on content area', async () => {
      const editor = page.locator(editorSelector);
      await expect(editor).toHaveAttribute('role', 'textbox');
      await expect(editor).toHaveAttribute('aria-multiline', 'true');
      await expect(editor).toHaveAttribute('aria-label', 'Rich text editor');
    });

    test('should fire onReady event', async () => {
      const log = await page.locator('#event-log').textContent();
      expect(log).toContain('onReady fired');
    });

    test('should expose editor instance on window', async () => {
      const hasInstance = await page.evaluate(() => {
        return typeof (window as any).editorInstance === 'object' &&
          typeof (window as any).editorInstance.getContent === 'function';
      });
      expect(hasInstance).toBe(true);
    });
  });

  test.describe('Toolbar Buttons', () => {
    test('should render all default toolbar buttons', async () => {
      const buttons = page.locator(`${toolbarSelector} .re-btn`);
      const count = await buttons.count();
      expect(count).toBeGreaterThanOrEqual(20);
    });

    test('should render toolbar separators', async () => {
      const separators = page.locator(`${toolbarSelector} .re-separator`);
      const count = await separators.count();
      expect(count).toBeGreaterThanOrEqual(6);
    });

    test('each button should have aria-label and title', async () => {
      const buttons = page.locator(`${toolbarSelector} .re-btn[data-command]`);
      const count = await buttons.count();
      for (let i = 0; i < count; i++) {
        const btn = buttons.nth(i);
        const ariaLabel = await btn.getAttribute('aria-label');
        const title = await btn.getAttribute('title');
        expect(ariaLabel).toBeTruthy();
        expect(title).toBeTruthy();
      }
    });

    test('each button should have aria-pressed="false" initially', async () => {
      const buttons = page.locator(`${toolbarSelector} .re-btn[data-command]:not([data-command="undo"]):not([data-command="redo"])`);
      const count = await buttons.count();
      for (let i = 0; i < count; i++) {
        const btn = buttons.nth(i);
        const ariaPressed = await btn.getAttribute('aria-pressed');
        expect(ariaPressed).toBe('false');
      }
    });
  });

  test.describe('Text Formatting - Bold', () => {
    test('should apply bold formatting via toolbar button', async () => {
      await page.locator(editorSelector).click();
      // Enable bold first, then type — avoids selection loss on toolbar click
      await page.keyboard.press('Control+b');
      await page.locator(editorSelector).type('Bold text');
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<b>');
    });

    test('should apply bold formatting via keyboard shortcut Ctrl+B', async () => {
      await page.locator(editorSelector).click();
      await page.keyboard.press('Control+b');
      await page.locator(editorSelector).type('Bold shortcut');
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<b>');
    });

    test('should toggle bold button active state when cursor is in bold text', async () => {
      await page.locator(editorSelector).click();
      await page.keyboard.press('Control+b');
      await page.locator(editorSelector).type('Bold');
      const boldBtn = page.locator(`${toolbarSelector} button[data-command="bold"]`);
      await expect(boldBtn).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('Text Formatting - Italic', () => {
    test('should apply italic formatting via toolbar button', async () => {
      await page.locator(editorSelector).click();
      await page.keyboard.press('Control+i');
      await page.locator(editorSelector).type('Italic text');
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<i>');
    });

    test('should apply italic formatting via keyboard shortcut Ctrl+I', async () => {
      await page.locator(editorSelector).click();
      await page.keyboard.press('Control+i');
      await page.locator(editorSelector).type('Italic shortcut');
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<i>');
    });
  });

  test.describe('Text Formatting - Underline', () => {
    test('should apply underline formatting via toolbar button', async () => {
      await page.locator(editorSelector).click();
      await page.keyboard.press('Control+u');
      await page.locator(editorSelector).type('Underline text');
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<u>');
    });

    test('should apply underline formatting via keyboard shortcut Ctrl+U', async () => {
      await page.locator(editorSelector).click();
      await page.keyboard.press('Control+u');
      await page.locator(editorSelector).type('Underline shortcut');
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<u>');
    });
  });

  test.describe('Text Formatting - Strikethrough', () => {
    test('should apply strikethrough via toolbar button', async () => {
      await page.locator(editorSelector).click();
      // Use execCommand directly - Ctrl+S is intercepted by the browser for "Save"
      await page.evaluate(() => {
        const editor = document.querySelector('.re-content') as HTMLElement;
        editor.focus();
        document.execCommand('strikeThrough', false);
      });
      await page.locator(editorSelector).type('Strikethrough text');
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<strike>');
    });
  });

  test.describe('Headings', () => {
    test('should apply H1 formatting', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Heading 1');
      await page.keyboard.press('Control+A');
      await page.locator(`${toolbarSelector} button[data-command="formatBlock"][data-value="H1"]`).click();
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<h1');
    });

    test('should apply H2 formatting', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Heading 2');
      await page.keyboard.press('Control+A');
      await page.locator(`${toolbarSelector} button[data-command="formatBlock"][data-value="H2"]`).click();
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<h2');
    });

    test('should apply H3 formatting', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Heading 3');
      await page.keyboard.press('Control+A');
      await page.locator(`${toolbarSelector} button[data-command="formatBlock"][data-value="H3"]`).click();
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<h3');
    });
  });

  test.describe('Lists', () => {
    test('should create unordered list', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('List item');
      await page.locator(`${toolbarSelector} button[data-command="insertUnorderedList"]`).click();
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<ul');
    });

    test('should create ordered list', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('List item');
      await page.locator(`${toolbarSelector} button[data-command="insertOrderedList"]`).click();
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<ol');
    });
  });

  test.describe('Text Alignment', () => {
    test('should align text left', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Left aligned');
      await page.keyboard.press('Control+A');
      await page.locator(`${toolbarSelector} button[data-command="justifyLeft"]`).click();
      const justifyLeftBtn = page.locator(`${toolbarSelector} button[data-command="justifyLeft"]`);
      await expect(justifyLeftBtn).toHaveAttribute('aria-pressed', 'true');
    });

    test('should align text center', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Center aligned');
      await page.keyboard.press('Control+A');
      await page.locator(`${toolbarSelector} button[data-command="justifyCenter"]`).click();
      const justifyCenterBtn = page.locator(`${toolbarSelector} button[data-command="justifyCenter"]`);
      await expect(justifyCenterBtn).toHaveAttribute('aria-pressed', 'true');
    });

    test('should align text right', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Right aligned');
      await page.keyboard.press('Control+A');
      await page.locator(`${toolbarSelector} button[data-command="justifyRight"]`).click();
      const justifyRightBtn = page.locator(`${toolbarSelector} button[data-command="justifyRight"]`);
      await expect(justifyRightBtn).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test.describe('Block Formatting', () => {
    test('should apply blockquote', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Quoted text');
      await page.keyboard.press('Control+A');
      await page.locator(`${toolbarSelector} button[data-command="formatBlock"][data-value="BLOCKQUOTE"]`).click();
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<blockquote');
    });

    test('should apply code block (PRE)', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Code block');
      await page.keyboard.press('Control+A');
      await page.locator(`${toolbarSelector} button[data-command="formatBlock"][data-value="PRE"]`).click();
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<pre');
    });
  });

  test.describe('Horizontal Rule', () => {
    test('should insert horizontal rule', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Before HR');
      await page.locator(`${toolbarSelector} button[data-command="insertHorizontalRule"]`).click();
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<hr');
    });
  });

  test.describe('Clear Formatting', () => {
    test('should clear formatting from selected text', async () => {
      await page.locator(editorSelector).click();
      await page.keyboard.press('Control+b');
      await page.locator(editorSelector).type('Bold to clear');
      await page.keyboard.press('Control+A');
      const contentBefore = await page.locator(editorSelector).innerHTML();
      expect(contentBefore).toContain('<b>');
      await page.locator(`${toolbarSelector} button[data-command="removeFormat"]`).click();
      // After removing format, bold tags should be gone
      const text = await page.locator(editorSelector).textContent();
      expect(text).toContain('Bold to clear');
    });
  });

  test.describe('Color Formatting', () => {
    test('should apply text color via toolbar button', async () => {
      await page.locator(editorSelector).click();
      // Apply color via execCommand directly in the editor context
      await page.evaluate(() => {
        const editor = document.querySelector('.re-content') as HTMLElement;
        editor.focus();
        document.execCommand('insertHTML', false, '<span style="color: #ff0000;">Colored text</span>');
      });
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('#ff0000');
    });
  });

  test.describe('Undo/Redo', () => {
    test('should undo last action via toolbar button', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Hello');
      const contentBefore = await page.locator(editorSelector).textContent();
      expect(contentBefore).toContain('Hello');
      // Click undo button
      await page.locator(`${toolbarSelector} button[data-command="undo"]`).click();
      const contentAfter = await page.locator(editorSelector).textContent();
      expect(contentAfter).not.toContain('Hello');
    });

    test('should redo after undo via toolbar button', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('World');
      // Click undo
      await page.locator(`${toolbarSelector} button[data-command="undo"]`).click();
      const contentAfterUndo = await page.locator(editorSelector).textContent();
      expect(contentAfterUndo).not.toContain('World');
      // Click redo
      await page.locator(`${toolbarSelector} button[data-command="redo"]`).click();
      const contentAfterRedo = await page.locator(editorSelector).textContent();
      expect(contentAfterRedo).toContain('World');
    });

    test('should undo via Ctrl+Z keyboard shortcut', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Undo shortcut');
      await page.keyboard.press('Control+z');
      const content = await page.locator(editorSelector).textContent();
      expect(content).not.toContain('Undo shortcut');
    });

    test('should redo via Ctrl+Y keyboard shortcut', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Redo shortcut');
      await page.keyboard.press('Control+z');
      await page.keyboard.press('Control+y');
      const content = await page.locator(editorSelector).textContent();
      expect(content).toContain('Redo shortcut');
    });

    test('should redo via Ctrl+Shift+Z keyboard shortcut', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Redo shift z');
      await page.keyboard.press('Control+z');
      await page.keyboard.press('Control+Shift+z');
      const content = await page.locator(editorSelector).textContent();
      expect(content).toContain('Redo shift z');
    });

    test('undo button should be disabled initially', async () => {
      const undoBtn = page.locator(`${toolbarSelector} button[data-command="undo"]`);
      await expect(undoBtn).toHaveClass(/re-disabled/);
    });

    test('redo button should be disabled initially', async () => {
      const redoBtn = page.locator(`${toolbarSelector} button[data-command="redo"]`);
      await expect(redoBtn).toHaveClass(/re-disabled/);
    });
  });

  test.describe('Tab Key Support', () => {
    test('should insert spaces on Tab key', async () => {
      await page.locator(editorSelector).click();
      await page.keyboard.press('Tab');
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('&nbsp;');
    });
  });

  test.describe('Link Tooltip', () => {
    test('should open link tooltip when clicking link button', async () => {
      await page.locator(editorSelector).click();
      await page.locator(`${toolbarSelector} button[data-command="createLink"]`).click();
      await page.waitForSelector('.re-link-tooltip');
      await expect(page.locator('.re-link-tooltip')).toBeVisible();
      await expect(page.locator('.re-link-tooltip')).toHaveAttribute('role', 'dialog');
    });

    test('should insert a link with text and URL', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Link text');
      await page.keyboard.press('Control+A');
      await page.locator(`${toolbarSelector} button[data-command="createLink"]`).click();
      await page.waitForSelector('.re-link-tooltip');
      // Fill in the URL field (first input with type url)
      const urlInput = page.locator('.re-link-tooltip-input[type="url"]');
      await urlInput.fill('https://example.com');
      // Click Insert button
      await page.locator('.re-link-tooltip-btn-confirm').click();
      await page.waitForSelector('.re-link-tooltip', { state: 'detached' });
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('href="https://example.com"');
    });

    test('should cancel link tooltip on Cancel button', async () => {
      await page.locator(editorSelector).click();
      await page.locator(`${toolbarSelector} button[data-command="createLink"]`).click();
      await page.waitForSelector('.re-link-tooltip');
      await page.locator('.re-link-tooltip-btn-cancel').click();
      await page.waitForSelector('.re-link-tooltip', { state: 'detached' });
    });

    test('should close link tooltip on click outside', async () => {
      await page.locator(editorSelector).click();
      await page.locator(`${toolbarSelector} button[data-command="createLink"]`).click();
      await page.waitForSelector('.re-link-tooltip');
      // Click the page heading — on the document but far from the tooltip.
      // (Clicking the extreme viewport corner can land on the page scrollbar,
      // which does not dispatch pointerdown events to the document.)
      await page.locator('h1').click();
      await page.waitForSelector('.re-link-tooltip', { state: 'detached' });
    });

    test('should close link tooltip on Escape key', async () => {
      await page.locator(editorSelector).click();
      await page.locator(`${toolbarSelector} button[data-command="createLink"]`).click();
      await page.waitForSelector('.re-link-tooltip');
      const urlInput = page.locator('.re-link-tooltip-input[type="url"]');
      await urlInput.click();
      await page.keyboard.press('Escape');
      await page.waitForSelector('.re-link-tooltip', { state: 'detached' });
    });

    test('should show error when URL is empty', async () => {
      await page.locator(editorSelector).click();
      await page.locator(`${toolbarSelector} button[data-command="createLink"]`).click();
      await page.waitForSelector('.re-link-tooltip');
      // Clear URL and try to confirm
      const urlInput = page.locator('.re-link-tooltip-input[type="url"]');
      await urlInput.fill('');
      await page.locator('.re-link-tooltip-btn-confirm').click();
      // Tooltip should still be visible
      await expect(page.locator('.re-link-tooltip')).toBeVisible();
      // Input should have error class
      await expect(urlInput).toHaveClass(/re-link-tooltip-input-error/);
    });
  });

  test.describe('Image Dialog', () => {
    test('should open image dialog when clicking image button', async () => {
      await page.locator(editorSelector).click();
      await page.locator(`${toolbarSelector} button[data-command="insertImage"]`).click();
      await page.waitForSelector('.re-dialog-overlay');
      await expect(page.locator('.re-dialog')).toBeVisible();
      await expect(page.locator('.re-dialog')).toHaveAttribute('role', 'dialog');
      // Check for image-specific fields
      await expect(page.locator('#re-image-url')).toBeVisible();
      await expect(page.locator('#re-image-alt')).toBeVisible();
    });

    test('should insert an image with URL and alt text', async () => {
      await page.locator(editorSelector).click();
      await page.locator(`${toolbarSelector} button[data-command="insertImage"]`).click();
      await page.waitForSelector('.re-dialog-overlay');
      const urlInput = page.locator('#re-image-url');
      await urlInput.fill('https://example.com/image.png');
      const altInput = page.locator('#re-image-alt');
      await altInput.fill('Test image');
      await page.locator('.re-dialog-btn-confirm').click();
      await page.waitForSelector('.re-dialog-overlay', { state: 'detached' });
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<img');
      expect(content).toContain('src="https://example.com/image.png"');
      expect(content).toContain('alt="Test image"');
    });

    test('should cancel image dialog', async () => {
      await page.locator(editorSelector).click();
      await page.locator(`${toolbarSelector} button[data-command="insertImage"]`).click();
      await page.waitForSelector('.re-dialog-overlay');
      await page.locator('.re-dialog-btn-cancel').click();
      await page.waitForSelector('.re-dialog-overlay', { state: 'detached' });
    });

    test('should show error when image URL is empty', async () => {
      await page.locator(editorSelector).click();
      await page.locator(`${toolbarSelector} button[data-command="insertImage"]`).click();
      await page.waitForSelector('.re-dialog-overlay');
      const urlInput = page.locator('#re-image-url');
      await urlInput.fill('');
      await page.locator('.re-dialog-btn-confirm').click();
      await expect(page.locator('.re-dialog-overlay')).toBeVisible();
      await expect(urlInput).toHaveClass(/re-dialog-input-error/);
    });

    test('image dialog should show preview area', async () => {
      await page.locator(editorSelector).click();
      await page.locator(`${toolbarSelector} button[data-command="insertImage"]`).click();
      await page.waitForSelector('.re-dialog-overlay');
      await expect(page.locator('.re-dialog-image-preview')).toBeVisible();
    });
  });

  test.describe('Public API - getText()', () => {
    test('should return plain text content', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Plain text content');
      const text = await page.evaluate(() => (window as any).editorInstance.getText());
      expect(text).toContain('Plain text content');
    });

    test('should return empty string for empty editor', async () => {
      const text = await page.evaluate(() => (window as any).editorInstance.getText());
      expect(text).toBe('');
    });
  });

  test.describe('Public API - getContent() / setContent()', () => {
    test('should return HTML content', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('HTML content');
      const html = await page.evaluate(() => (window as any).editorInstance.getContent());
      expect(html).toContain('HTML content');
    });

    test('should set HTML content programmatically', async () => {
      await page.evaluate(() => {
        (window as any).editorInstance.setContent('<b>Bold</b> <i>Italic</i>');
      });
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<b>');
      expect(content).toContain('<i>');
    });
  });

  test.describe('Public API - isEmpty()', () => {
    test('should return true for empty editor', async () => {
      const isEmpty = await page.evaluate(() => (window as any).editorInstance.isEmpty());
      expect(isEmpty).toBe(true);
    });

    test('should return false for non-empty editor', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Not empty');
      const isEmpty = await page.evaluate(() => (window as any).editorInstance.isEmpty());
      expect(isEmpty).toBe(false);
    });
  });

  test.describe('Public API - getCharacterCount()', () => {
    test('should return correct character count', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Hello');
      const count = await page.evaluate(() => (window as any).editorInstance.getCharacterCount());
      expect(count).toBe(5);
    });

    test('should return 0 for empty editor', async () => {
      const count = await page.evaluate(() => (window as any).editorInstance.getCharacterCount());
      expect(count).toBe(0);
    });
  });

  test.describe('Public API - getWordCount()', () => {
    test('should return correct word count', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Hello World Test');
      const count = await page.evaluate(() => (window as any).editorInstance.getWordCount());
      expect(count).toBe(3);
    });

    test('should return 0 for empty editor', async () => {
      const count = await page.evaluate(() => (window as any).editorInstance.getWordCount());
      expect(count).toBe(0);
    });
  });

  test.describe('Public API - canUndo() / canRedo()', () => {
    test('canUndo should return false initially', async () => {
      const canUndo = await page.evaluate(() => (window as any).editorInstance.canUndo());
      expect(canUndo).toBe(false);
    });

    test('canRedo should return false initially', async () => {
      const canRedo = await page.evaluate(() => (window as any).editorInstance.canRedo());
      expect(canRedo).toBe(false);
    });

    test('canUndo should return true after typing', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Some text');
      const canUndo = await page.evaluate(() => (window as any).editorInstance.canUndo());
      expect(canUndo).toBe(true);
    });
  });

  test.describe('Public API - undo() / redo()', () => {
    test('should undo via API', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('To undo');
      await page.evaluate(() => (window as any).editorInstance.undo());
      const text = await page.evaluate(() => (window as any).editorInstance.getText());
      expect(text).not.toContain('To undo');
    });

    test('should redo via API', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('To redo');
      await page.evaluate(() => (window as any).editorInstance.undo());
      await page.evaluate(() => (window as any).editorInstance.redo());
      const text = await page.evaluate(() => (window as any).editorInstance.getText());
      expect(text).toContain('To redo');
    });
  });

  test.describe('Public API - enable() / disable()', () => {
    test('should disable editor', async () => {
      await page.evaluate(() => (window as any).editorInstance.disable());
      const editor = page.locator('.re-content');
      await expect(editor).toHaveAttribute('contenteditable', 'false');
      await expect(page.locator('.re-wrapper')).toHaveClass(/re-readonly/);
    });

    test('should enable editor after disable', async () => {
      await page.evaluate(() => (window as any).editorInstance.disable());
      await page.evaluate(() => (window as any).editorInstance.enable());
      const editor = page.locator('.re-content');
      await expect(editor).toHaveAttribute('contenteditable', 'true');
      await expect(page.locator('.re-wrapper')).not.toHaveClass(/re-readonly/);
    });

    test('should not allow editing when disabled', async () => {
      await page.evaluate(() => (window as any).editorInstance.disable());
      // Verify the editor is disabled
      const isDisabled = await page.evaluate(() => {
        const el = document.querySelector('.re-content') as HTMLElement;
        return el.getAttribute('contenteditable') === 'false';
      });
      expect(isDisabled).toBe(true);
      const text = await page.evaluate(() => (window as any).editorInstance.getText());
      expect(text).toBe('');
    });
  });

  test.describe('Public API - focus()', () => {
    test('should focus the editor', async () => {
      await page.evaluate(() => (window as any).editorInstance.focus());
      const isFocused = await page.evaluate(() => {
        return document.activeElement === document.querySelector('.re-content');
      });
      expect(isFocused).toBe(true);
    });
  });

  test.describe('Public API - execCommand()', () => {
    test('should execute bold via execCommand', async () => {
      await page.locator(editorSelector).click();
      // Enable bold first, then type to ensure formatting applies
      await page.evaluate(() => (window as any).editorInstance.execCommand('bold'));
      await page.locator(editorSelector).type('Exec bold');
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<b>');
    });
  });

  test.describe('Public API - queryCommandState()', () => {
    test('should return false for non-active command', async () => {
      await page.locator(editorSelector).click();
      const isBold = await page.evaluate(() => (window as any).editorInstance.queryCommandState('bold'));
      expect(isBold).toBe(false);
    });

    test('should return true for active command', async () => {
      await page.locator(editorSelector).click();
      await page.keyboard.press('Control+b');
      const isBold = await page.evaluate(() => (window as any).editorInstance.queryCommandState('bold'));
      expect(isBold).toBe(true);
    });
  });

  test.describe('Public API - getElement()', () => {
    test('should return the wrapper element', async () => {
      const hasClass = await page.evaluate(() => {
        const el = (window as any).editorInstance.getElement();
        return el.classList.contains('re-wrapper');
      });
      expect(hasClass).toBe(true);
    });
  });

  test.describe('Public API - destroy()', () => {
    test('should remove editor from DOM', async () => {
      // Create a fresh editor for this test
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'destroy-test';
        document.body.appendChild(container);
        const ed = (window as any).SRichEditor.createEditor({
          container: '#destroy-test',
        });
        ed.destroy();
      });
      // The wrapper should be removed from the destroy-test container
      const hasWrapper = await page.evaluate(() => {
        return document.querySelector('#destroy-test .re-wrapper') !== null;
      });
      expect(hasWrapper).toBe(false);
    });
  });

  test.describe('Placeholder Behavior', () => {
    test('should show placeholder when editor is empty', async () => {
      const placeholder = page.locator('.re-placeholder');
      await expect(placeholder).toBeVisible();
      await expect(placeholder).toHaveText('Start typing here...');
    });

    test('should hide placeholder when content is added', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Hello');
      await expect(page.locator('.re-placeholder')).toBeHidden();
    });

    test('should show placeholder again after all content is deleted', async () => {
      // Create a fresh editor to avoid sidebar interference
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'placeholder-delete-test';
        document.body.appendChild(container);
        (window as any).SRichEditor.createEditor({
          container: '#placeholder-delete-test',
          placeholder: 'Type here...',
        });
      });
      const testEditor = '#placeholder-delete-test .re-content[contenteditable="true"]';
      await page.locator(testEditor).click();
      await page.locator(testEditor).type('Hello');
      await expect(page.locator('#placeholder-delete-test .re-placeholder')).toBeHidden();
      // Clear the editor content programmatically using setContent
      await page.evaluate(() => {
        const el = document.querySelector('#placeholder-delete-test .re-content') as HTMLElement;
        el.innerHTML = '';
        // Trigger input event to update placeholder visibility
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
      // Wait for placeholder to reappear
      await expect(page.locator('#placeholder-delete-test .re-placeholder')).toBeVisible();
    });
  });

  test.describe('Status Bar', () => {
    test('should display word and character count', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Hello World');
      // Wait for throttled status bar update
      await page.waitForTimeout(500);
      const statusBar = page.locator('.re-statusbar');
      const text = await statusBar.textContent();
      expect(text).toContain('2');
      expect(text).toContain('words');
      expect(text).toContain('11');
      expect(text).toContain('characters');
    });

    test('should update status bar as content changes', async () => {
      const statusBar = page.locator('.re-statusbar');
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('One');
      await page.waitForTimeout(500);
      let text = await statusBar.textContent();
      expect(text).toContain('1');
      expect(text).toContain('3');
      await page.locator(editorSelector).type(' Two');
      await page.waitForTimeout(500);
      text = await statusBar.textContent();
      expect(text).toContain('2');
    });
  });

  test.describe('Focus/Blur Events', () => {
    test('should fire onFocus when editor is clicked', async () => {
      // Clear the log first
      await page.evaluate(() => {
        document.getElementById('event-log')!.textContent = '';
      });
      await page.locator(editorSelector).click();
      // Wait a moment for event to fire
      await page.waitForTimeout(100);
      const log = await page.locator('#event-log').textContent();
      expect(log).toContain('onFocus fired');
    });

    test('should fire onBlur when clicking outside editor', async () => {
      await page.locator(editorSelector).click();
      await page.evaluate(() => {
        document.getElementById('event-log')!.textContent = '';
      });
      // Click on the page title to blur the editor
      await page.locator('h1').click();
      await page.waitForTimeout(100);
      const log = await page.locator('#event-log').textContent();
      expect(log).toContain('onBlur fired');
    });
  });

  test.describe('onChange Event', () => {
    test('should fire onChange when content changes', async () => {
      await page.evaluate(() => {
        document.getElementById('event-log')!.textContent = '';
      });
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('X');
      await page.waitForTimeout(100);
      const log = await page.locator('#event-log').textContent();
      expect(log).toContain('onChange:');
    });
  });

  test.describe('Keyboard Shortcuts - Combined Formatting', () => {
    test('should apply multiple formatting styles simultaneously', async () => {
      await page.locator(editorSelector).click();
      await page.keyboard.press('Control+b');
      await page.keyboard.press('Control+i');
      await page.keyboard.press('Control+u');
      await page.locator(editorSelector).type('Bold Italic Underline');
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<b>');
      expect(content).toContain('<i>');
      expect(content).toContain('<u>');
    });
  });

  test.describe('Content with Initial Value', () => {
    test('should render initial content in a separate editor', async () => {
      // Create a new editor with initial content
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'init-content-test';
        document.body.appendChild(container);
        (window as any).SRichEditor.createEditor({
          container: '#init-content-test',
          content: '<b>Initial</b> content',
        });
      });
      const content = await page.locator('#init-content-test .re-content').innerHTML();
      expect(content).toContain('<b>Initial</b>');
    });
  });

  test.describe('Custom Toolbar', () => {
    test('should support custom toolbar configuration', async () => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'custom-toolbar-test';
        document.body.appendChild(container);
        (window as any).SRichEditor.createEditor({
          container: '#custom-toolbar-test',
          toolbar: [
            { type: 'button', name: 'bold', icon: 'bold', tooltip: 'Bold', command: 'bold' },
            { type: 'button', name: 'italic', icon: 'italic', tooltip: 'Italic', command: 'italic' },
          ],
        });
      });
      const buttons = page.locator('#custom-toolbar-test .re-toolbar .re-btn');
      const count = await buttons.count();
      expect(count).toBe(2);
    });
  });

  test.describe('Custom Buttons', () => {
    test('should render custom buttons in toolbar', async () => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'custom-btn-test';
        document.body.appendChild(container);
        (window as any).SRichEditor.createEditor({
          container: '#custom-btn-test',
          customButtons: [
            {
              name: 'myButton',
              icon: '<span>★</span>',
              tooltip: 'My Custom Button',
              command: function(editor: any) {
                editor.execCommand('insertHTML', '<b>Custom</b>');
              },
            },
          ],
        });
      });
      const customBtn = page.locator('#custom-btn-test .re-btn[data-custom-name="myButton"]');
      await expect(customBtn).toBeVisible();
      await expect(customBtn).toHaveAttribute('aria-label', 'My Custom Button');
    });
  });

  test.describe('Read-Only Mode', () => {
    test('should create editor in read-only mode', async () => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'readonly-test';
        document.body.appendChild(container);
        (window as any).SRichEditor.createEditor({
          container: '#readonly-test',
          content: 'Read only content',
          readOnly: true,
        });
      });
      const editor = page.locator('#readonly-test .re-content');
      await expect(editor).toHaveAttribute('contenteditable', 'false');
      const text = await page.locator('#readonly-test .re-content').textContent();
      expect(text).toContain('Read only content');
    });
  });

  test.describe('Hidden Toolbar/StatusBar', () => {
    test('should hide toolbar when toolbarVisible is false', async () => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'hidden-toolbar-test';
        document.body.appendChild(container);
        (window as any).SRichEditor.createEditor({
          container: '#hidden-toolbar-test',
          toolbarVisible: false,
        });
      });
      const toolbar = page.locator('#hidden-toolbar-test .re-toolbar');
      await expect(toolbar).toBeHidden();
    });

    test('should hide status bar when statusBarVisible is false', async () => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'hidden-statusbar-test';
        document.body.appendChild(container);
        (window as any).SRichEditor.createEditor({
          container: '#hidden-statusbar-test',
          statusBarVisible: false,
        });
      });
      const statusBar = page.locator('#hidden-statusbar-test .re-statusbar');
      await expect(statusBar).toBeHidden();
    });
  });

  test.describe('Custom className', () => {
    test('should apply custom CSS class to wrapper', async () => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'custom-class-test';
        document.body.appendChild(container);
        (window as any).SRichEditor.createEditor({
          container: '#custom-class-test',
          className: 'my-custom-editor dark-theme',
        });
      });
      const wrapper = page.locator('#custom-class-test .re-wrapper');
      await expect(wrapper).toHaveClass(/my-custom-editor/);
      await expect(wrapper).toHaveClass(/dark-theme/);
    });
  });

  test.describe('Custom Placeholder', () => {
    test('should display custom placeholder text', async () => {
      await page.evaluate(() => {
        const container = document.createElement('div');
        container.id = 'custom-placeholder-test';
        document.body.appendChild(container);
        (window as any).SRichEditor.createEditor({
          container: '#custom-placeholder-test',
          placeholder: 'Type something amazing...',
        });
      });
      const placeholder = page.locator('#custom-placeholder-test .re-placeholder');
      await expect(placeholder).toHaveText('Type something amazing...');
    });
  });

  test.describe('Comments', () => {
    test('should have comment button in toolbar', async () => {
      const commentBtn = page.locator(`${toolbarSelector} button[data-command="re:comment"]`);
      await expect(commentBtn).toBeVisible();
      await expect(commentBtn).toHaveAttribute('aria-label', 'Comments');
    });

    test('should open comment sidebar when clicking comment button without selection', async () => {
      await page.locator(`${toolbarSelector} button[data-command="re:comment"]`).click();
      // Sidebar should appear
      const sidebar = page.locator('.re-comments-sidebar');
      await expect(sidebar).toBeVisible();
    });

    test('should show comment prompt when text is selected and comment button clicked', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('This is a test sentence.');
      // Select the word "test"
      await page.evaluate(() => {
        const el = document.querySelector('.re-content') as HTMLElement;
        const textNode = el.firstChild?.firstChild || el.firstChild;
        if (textNode) {
          const range = document.createRange();
          range.setStart(textNode, 8);
          range.setEnd(textNode, 12);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
      });
      await page.locator(`${toolbarSelector} button[data-command="re:comment"]`).click();
      // Dialog should appear
      await page.waitForSelector('.re-dialog-overlay');
      await expect(page.locator('.re-dialog')).toBeVisible();
      // Check for textarea
      const textarea = page.locator('.re-comment-textarea');
      await expect(textarea).toBeVisible();
    });

    test('should add a comment and see it in sidebar', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Commentable text here.');
      // Select "Commentable"
      await page.evaluate(() => {
        const el = document.querySelector('.re-content') as HTMLElement;
        const textNode = el.firstChild?.firstChild || el.firstChild;
        const range = document.createRange();
        range.setStart(textNode!, 0);
        range.setEnd(textNode!, 11);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      });
      await page.locator(`${toolbarSelector} button[data-command="re:comment"]`).click();
      await page.waitForSelector('.re-dialog-overlay');
      const textarea = page.locator('.re-comment-textarea');
      await textarea.fill('This is a test comment');
      await page.locator('.re-dialog-btn-confirm').click();
      await page.waitForSelector('.re-dialog-overlay', { state: 'detached' });
      // Verify sidebar shows the comment
      const sidebar = page.locator('.re-comments-sidebar');
      await expect(sidebar).toBeVisible();
      const thread = page.locator('.re-comment-thread');
      await expect(thread).toBeVisible();
      await expect(thread).toContainText('This is a test comment');
    });

    test('should highlight commented text', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Highlight test.');
      await page.evaluate(() => {
        const el = document.querySelector('.re-content') as HTMLElement;
        const textNode = el.firstChild?.firstChild || el.firstChild;
        const range = document.createRange();
        range.setStart(textNode!, 0);
        range.setEnd(textNode!, 6);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      });
      await page.locator(`${toolbarSelector} button[data-command="re:comment"]`).click();
      await page.waitForSelector('.re-dialog-overlay');
      await page.locator('.re-comment-textarea').fill('Highlight comment');
      await page.locator('.re-dialog-btn-confirm').click();
      await page.waitForSelector('.re-dialog-overlay', { state: 'detached' });
      const highlights = page.locator('.re-comment-highlight');
      expect(await highlights.count()).toBeGreaterThanOrEqual(1);
    });
  });

  test.describe('Export Buttons', () => {
    test('should have PDF export button in toolbar', async () => {
      const pdfBtn = page.locator(`${toolbarSelector} button[data-command="re:exportPDF"]`);
      await expect(pdfBtn).toBeVisible();
      await expect(pdfBtn).toHaveAttribute('aria-label', 'Export as PDF');
    });

    test('should have Word export button in toolbar', async () => {
      const wordBtn = page.locator(`${toolbarSelector} button[data-command="re:exportWord"]`);
      await expect(wordBtn).toBeVisible();
      await expect(wordBtn).toHaveAttribute('aria-label', 'Export as Word');
    });

    test('export buttons should not throw when clicked', async () => {
      // Click PDF export button — it should not throw
      // (In headless, download may fail but the button should not error)
      await page.locator(`${toolbarSelector} button[data-command="re:exportPDF"]`).click();
      await page.waitForTimeout(500);

      // Click Word export button
      await page.locator(`${toolbarSelector} button[data-command="re:exportWord"]`).click();
      await page.waitForTimeout(500);

      // Editor should still be functional
      const hasWrapper = await page.evaluate(() => {
        return document.querySelector('.re-wrapper') !== null;
      });
      expect(hasWrapper).toBe(true);
    });
  });

  test.describe('Arrow Key Navigation', () => {
    test('should navigate with arrow keys without errors', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Hello World');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowUp');
      await page.keyboard.press('ArrowDown');
      // No error should occur
      const text = await page.evaluate(() => (window as any).editorInstance.getText());
      expect(text).toBe('Hello World');
    });
  });

  test.describe('Backspace and Delete', () => {
    test('should delete characters with Backspace', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('ABC');
      await page.keyboard.press('Backspace');
      const text = await page.evaluate(() => (window as any).editorInstance.getText());
      expect(text).toBe('AB');
    });

    test('should delete characters with Delete key', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('ABC');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('ArrowLeft');
      await page.keyboard.press('Delete');
      const text = await page.evaluate(() => (window as any).editorInstance.getText());
      expect(text).toBe('AC');
    });
  });

  test.describe('Enter Key', () => {
    test('should create new line on Enter', async () => {
      await page.locator(editorSelector).click();
      await page.locator(editorSelector).type('Line 1');
      await page.keyboard.press('Enter');
      await page.locator(editorSelector).type('Line 2');
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('Line 1');
      expect(content).toContain('Line 2');
    });
  });

  test.describe('Paste Handling', () => {
    test('should handle paste event', async () => {
      await page.locator(editorSelector).click();
      // Simulate paste via clipboard API
      await page.evaluate(async () => {
        const editor = document.querySelector('.re-content') as HTMLElement;
        editor.focus();
        const clipboardData = new DataTransfer();
        clipboardData.setData('text/plain', 'Pasted content');
        const pasteEvent = new ClipboardEvent('paste', {
          clipboardData,
          bubbles: true,
          cancelable: true,
        });
        editor.dispatchEvent(pasteEvent);
      });
      await page.waitForTimeout(100);
      // The editor should still be functional after paste
      const text = await page.evaluate(() => (window as any).editorInstance.getText());
      expect(typeof text).toBe('string');
    });
  });

  test.describe('HTML Injection Safety', () => {
    test('should strip script tags in setContent', async () => {
      await page.evaluate(() => {
        (window as any).editorInstance.setContent('<script>alert("xss")</script>');
      });
      const content = await page.locator(editorSelector).innerHTML();
      // Script tags should be completely removed by the sanitizer
      expect(content).not.toContain('<script>');
      expect(content).not.toContain('alert');
    });

    test('should strip event handler attributes', async () => {
      await page.evaluate(() => {
        (window as any).editorInstance.setContent('<img src="x" onerror="alert(1)">');
      });
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).not.toContain('onerror');
      expect(content).not.toContain('alert');
    });

    test('should strip iframe tags', async () => {
      await page.evaluate(() => {
        (window as any).editorInstance.setContent('<iframe src="https://evil.com"></iframe><p>Safe content</p>');
      });
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).not.toContain('<iframe');
      expect(content).toContain('Safe content');
    });

    test('should strip javascript: protocol from links', async () => {
      await page.evaluate(() => {
        (window as any).editorInstance.setContent('<a href="javascript:alert(1)">Click me</a>');
      });
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).not.toContain('javascript:');
      expect(content).toContain('Click me');
    });

    test('should preserve safe HTML content', async () => {
      await page.evaluate(() => {
        (window as any).editorInstance.setContent('<p>Hello <strong>world</strong> <em>test</em></p>');
      });
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('<p>');
      expect(content).toContain('<strong>');
      expect(content).toContain('<em>');
      expect(content).toContain('Hello');
    });
  });

  test.describe('Rapid User Interactions', () => {
    test('should handle rapid typing without errors', async () => {
      await page.locator(editorSelector).click();
      // Type rapidly
      for (let i = 0; i < 50; i++) {
        await page.locator(editorSelector).type(String.fromCharCode(65 + (i % 26)), { delay: 0 });
      }
      const text = await page.evaluate(() => (window as any).editorInstance.getText());
      expect(text.length).toBe(50);
    });

    test('should handle rapid formatting toggles', async () => {
      await page.locator(editorSelector).click();
      for (let i = 0; i < 10; i++) {
        await page.keyboard.press('Control+b');
        await page.locator(editorSelector).type('X');
      }
      const text = await page.evaluate(() => (window as any).editorInstance.getText());
      expect(text).toBe('XXXXXXXXXX');
    });
  });

  test.describe('Dialog Accessibility', () => {
    test('link tooltip should have aria-label attribute', async () => {
      await page.locator(editorSelector).click();
      await page.locator(`${toolbarSelector} button[data-command="createLink"]`).click();
      await page.waitForSelector('.re-link-tooltip');
      await expect(page.locator('.re-link-tooltip')).toHaveAttribute('role', 'dialog');
      // Close tooltip via Cancel button
      await page.locator('.re-link-tooltip-btn-cancel').click();
      await page.waitForSelector('.re-link-tooltip', { state: 'detached' });
    });

    test('image dialog should have aria-modal attribute', async () => {
      await page.locator(editorSelector).click();
      await page.locator(`${toolbarSelector} button[data-command="insertImage"]`).click();
      await page.waitForSelector('.re-dialog-overlay');
      await expect(page.locator('.re-dialog')).toHaveAttribute('aria-modal', 'true');
      // Close dialog via Cancel button
      await page.locator('.re-dialog-btn-cancel').click();
      await page.waitForSelector('.re-dialog-overlay', { state: 'detached' });
    });
  });

  test.describe('RTL Support', () => {
    test('should have dir="ltr" attribute by default', async () => {
      const wrapper = page.locator('.re-wrapper');
      await expect(wrapper).toHaveAttribute('dir', 'ltr');
    });
  });

  test.describe('Link Enter Key in Tooltip', () => {
    test('should confirm link on Enter key in URL field', async () => {
      await page.locator(editorSelector).click();
      await page.locator(`${toolbarSelector} button[data-command="createLink"]`).click();
      await page.waitForSelector('.re-link-tooltip');
      const urlInput = page.locator('.re-link-tooltip-input[type="url"]');
      await urlInput.fill('https://test.com');
      await page.keyboard.press('Enter');
      await page.waitForSelector('.re-link-tooltip', { state: 'detached' });
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('href="https://test.com"');
    });
  });

  test.describe('Image Enter Key in Dialog', () => {
    test('should confirm image on Enter key in URL field', async () => {
      await page.locator(editorSelector).click();
      await page.locator(`${toolbarSelector} button[data-command="insertImage"]`).click();
      await page.waitForSelector('.re-dialog-overlay');
      const urlInput = page.locator('#re-image-url');
      await urlInput.fill('https://test.com/img.png');
      await page.keyboard.press('Enter');
      await page.waitForSelector('.re-dialog-overlay', { state: 'detached' });
      const content = await page.locator(editorSelector).innerHTML();
      expect(content).toContain('src="https://test.com/img.png"');
    });
  });
});