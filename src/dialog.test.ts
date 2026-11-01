import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { showLinkTooltip, showLinkDialog, showImageDialog } from './dialog';

/**
 * Fake-timer based tests for the dialog components.
 * jsdom + vi.useFakeTimers let us deterministically trigger the deferred
 * focus / outside-click listeners without real waits.
 */

// jsdom's Range does not implement rect APIs; real browsers do.
function stubRangeRects(): void {
  (Range.prototype as any).getBoundingClientRect = () => ({
    left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0,
  });
}

function pressKey(target: EventTarget, key: string, init: KeyboardEventInit = {}): void {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init }));
}

function click(el: EventTarget): void {
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
}

function pointerDownAt(target: EventTarget): void {
  // Outside-click closes on `pointerdown` (and legacy `mousedown`)
  target.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
}

describe('showLinkTooltip', () => {
  beforeEach(() => {
    stubRangeRects();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.querySelectorAll('.re-link-tooltip').forEach((el) => el.remove());
  });

  it('resolves with insert result on confirm click', async () => {
    const promise = showLinkTooltip('link text', '', {});
    vi.advanceTimersByTime(20); // deferred focus

    const tooltip = document.querySelector('.re-link-tooltip') as HTMLElement;
    expect(tooltip).not.toBeNull();

    const urlInput = tooltip.querySelector<HTMLInputElement>('.re-link-tooltip-input')!;
    urlInput.value = 'https://example.com';
    const confirmBtn = tooltip.querySelector<HTMLButtonElement>('.re-link-tooltip-btn-confirm')!;
    click(confirmBtn);

    await expect(promise).resolves.toEqual({ action: 'insert', text: 'link text', url: 'https://example.com' });
    expect(document.querySelector('.re-link-tooltip')).toBeNull();
  });

  it('resolves null when cancelled with the cancel button', async () => {
    const promise = showLinkTooltip('text', '', {});
    vi.advanceTimersByTime(20);

    const tooltip = document.querySelector('.re-link-tooltip')!;
    click(tooltip.querySelector('.re-link-tooltip-btn-cancel')!);

    await expect(promise).resolves.toBeNull();
    expect(document.querySelector('.re-link-tooltip')).toBeNull();
  });

  it('resolves null on Escape key', async () => {
    const promise = showLinkTooltip('', '', {});
    vi.advanceTimersByTime(20);

    const tooltip = document.querySelector('.re-link-tooltip')!;
    pressKey(tooltip, 'Escape');

    await expect(promise).resolves.toBeNull();
    expect(document.querySelector('.re-link-tooltip')).toBeNull();
  });

  it('confirms on Enter key', async () => {
    const promise = showLinkTooltip('', '', {});
    vi.advanceTimersByTime(20);

    const tooltip = document.querySelector('.re-link-tooltip') as HTMLElement;
    const urlInput = tooltip.querySelector<HTMLInputElement>('.re-link-tooltip-input')!;
    urlInput.value = 'https://example.com';
    pressKey(tooltip, 'Enter');

    await expect(promise).resolves.toMatchObject({ action: 'insert', url: 'https://example.com' });
  });

  it('does not confirm when URL is empty (shows error state)', async () => {
    const promise = showLinkTooltip('', '', {});
    vi.advanceTimersByTime(20);

    const tooltip = document.querySelector('.re-link-tooltip') as HTMLElement;
    pressKey(tooltip, 'Enter');

    const urlInput = tooltip.querySelector<HTMLInputElement>('.re-link-tooltip-input')!;
    expect(urlInput.classList.contains('re-link-tooltip-input-error')).toBe(true);

    // Still open — promise not resolved yet
    let resolved: unknown = 'pending';
    void promise.then((v) => (resolved = v));
    vi.advanceTimersByTime(0);
    expect(resolved).toBe('pending');
    expect(document.querySelector('.re-link-tooltip')).not.toBeNull();
  });

  it('closes on outside pointerdown and resolves null', async () => {
    const promise = showLinkTooltip('', '', {});
    vi.advanceTimersByTime(20);
    vi.advanceTimersByTime(1); // outside-click listeners registered on next tick

    expect(document.querySelector('.re-link-tooltip')).not.toBeNull();
    pointerDownAt(document.body);

    await expect(promise).resolves.toBeNull();
    expect(document.querySelector('.re-link-tooltip')).toBeNull();
  });

  it('does not close when pointerdown happens inside the tooltip', async () => {
    const promise = showLinkTooltip('', '', {});
    vi.advanceTimersByTime(21);

    pointerDownAt(document.querySelector('.re-link-tooltip')!);
    vi.advanceTimersByTime(1);

    expect(document.querySelector('.re-link-tooltip')).not.toBeNull();
    let resolved: unknown = 'pending';
    void promise.then((v) => (resolved = v));
    vi.advanceTimersByTime(0);
    expect(resolved).toBe('pending');
  });

  it('removes a previous tooltip before opening a new one', async () => {
    const first = showLinkTooltip('', '', {});
    vi.advanceTimersByTime(20);
    expect(document.querySelectorAll('.re-link-tooltip').length).toBe(1);

    const second = showLinkTooltip('', '', {});
    vi.advanceTimersByTime(20);
    // The first tooltip was removed when the second opened
    expect(document.querySelectorAll('.re-link-tooltip').length).toBe(1);

    // Close the second so nothing dangles into the next test.
    // Note: the first promise stays pending forever — known limitation
    // (replacing a tooltip orphans its promise), asserted nowhere here.
    pressKey(document.querySelector('.re-link-tooltip')!, 'Escape');
    await expect(second).resolves.toBeNull();
    void first; // intentionally left pending
  });
});

describe('showLinkDialog', () => {
  beforeEach(() => {
    stubRangeRects();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.querySelectorAll('.re-dialog-overlay').forEach((el) => el.remove());
  });

  function openDialog(currentText = '', currentUrl = '') {
    const promise = showLinkDialog(currentText, currentUrl, {});
    vi.advanceTimersByTime(60); // deferred focus
    const overlay = document.querySelector('.re-dialog-overlay') as HTMLElement;
    const dialog = overlay.querySelector('.re-dialog') as HTMLElement;
    return { promise, overlay, dialog };
  }

  it('resolves insert result on confirm', async () => {
    const { promise, dialog } = openDialog('my text', '');
    const urlInput = dialog.querySelector<HTMLInputElement>('#re-link-url')!;
    urlInput.value = 'https://example.com';
    click(dialog.querySelector('.re-dialog-btn-confirm')!);

    await expect(promise).resolves.toEqual({ action: 'insert', text: 'my text', url: 'https://example.com' });
    expect(document.querySelector('.re-dialog-overlay')).toBeNull();
  });

  it('resolves null on Escape', async () => {
    const { promise, dialog } = openDialog();
    pressKey(dialog, 'Escape');
    await expect(promise).resolves.toBeNull();
    expect(document.querySelector('.re-dialog-overlay')).toBeNull();
  });

  it('resolves null on overlay (outside) click', async () => {
    const { promise, overlay } = openDialog();
    click(overlay); // click directly on the overlay, not the dialog
    await expect(promise).resolves.toBeNull();
  });

  it('traps focus with Tab at the last focusable element', async () => {
    const { dialog } = openDialog();
    const focusable = dialog.querySelectorAll<HTMLElement>('input, button');
    focusable[focusable.length - 1]!.focus();

    pressKey(dialog, 'Tab');

    expect(document.activeElement).toBe(focusable[0]);
  });

  it('traps focus backwards with Shift+Tab at the first element', async () => {
    const { dialog } = openDialog();
    const focusable = dialog.querySelectorAll<HTMLElement>('input, button');
    focusable[0]!.focus();

    pressKey(dialog, 'Tab', { shiftKey: true });

    expect(document.activeElement).toBe(focusable[focusable.length - 1]);
  });

  it('confirms on Enter while focused in the URL input', async () => {
    const { promise, dialog } = openDialog('', '');
    const urlInput = dialog.querySelector<HTMLInputElement>('#re-link-url')!;
    urlInput.value = 'https://example.com';
    urlInput.focus();
    pressKey(urlInput, 'Enter');

    await expect(promise).resolves.toMatchObject({ action: 'insert', url: 'https://example.com' });
  });

  it('shows a remove button when editing an existing link', async () => {
    const { promise, dialog } = openDialog('text', 'https://old.example.com');
    const removeBtn = dialog.querySelector<HTMLButtonElement>('.re-dialog-btn-remove')!;
    expect(removeBtn).not.toBeNull();
    click(removeBtn);

    await expect(promise).resolves.toEqual({ action: 'remove', text: '', url: '' });
  });
});

describe('showImageDialog', () => {
  beforeEach(() => {
    stubRangeRects();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.querySelectorAll('.re-dialog-overlay').forEach((el) => el.remove());
  });

  it('resolves url and alt on confirm', async () => {
    const promise = showImageDialog('', '', {});
    vi.advanceTimersByTime(60);

    const overlay = document.querySelector('.re-dialog-overlay') as HTMLElement;
    const dialog = overlay.querySelector('.re-dialog') as HTMLElement;
    dialog.querySelector<HTMLInputElement>('#re-image-url')!.value = 'https://example.com/cat.jpg';
    dialog.querySelector<HTMLInputElement>('#re-image-alt')!.value = 'A cat';
    click(dialog.querySelector('.re-dialog-btn-confirm')!);

    await expect(promise).resolves.toEqual({ url: 'https://example.com/cat.jpg', alt: 'A cat' });
    expect(document.querySelector('.re-dialog-overlay')).toBeNull();
  });

  it('resolves null on Escape', async () => {
    const promise = showImageDialog('', '', {});
    vi.advanceTimersByTime(60);
    const dialog = document.querySelector('.re-dialog')!;
    pressKey(dialog, 'Escape');
    await expect(promise).resolves.toBeNull();
  });

  it('does not confirm with an empty URL', async () => {
    const promise = showImageDialog('', '', {});
    vi.advanceTimersByTime(60);

    const dialog = document.querySelector('.re-dialog') as HTMLElement;
    click(dialog.querySelector('.re-dialog-btn-confirm')!);

    const urlInput = dialog.querySelector<HTMLInputElement>('#re-image-url')!;
    expect(urlInput.classList.contains('re-dialog-input-error')).toBe(true);

    let resolved: unknown = 'pending';
    void promise.then((v) => (resolved = v));
    vi.advanceTimersByTime(0);
    expect(resolved).toBe('pending');
    expect(document.querySelector('.re-dialog-overlay')).not.toBeNull();
  });

  it('renders a preview image when a URL is entered', async () => {
    showImageDialog('', '', {});
    vi.advanceTimersByTime(60);

    const dialog = document.querySelector('.re-dialog') as HTMLElement;
    const urlInput = dialog.querySelector<HTMLInputElement>('#re-image-url')!;
    urlInput.value = 'https://example.com/cat.jpg';
    urlInput.dispatchEvent(new Event('input', { bubbles: true }));

    const previewImg = dialog.querySelector<HTMLImageElement>('.re-dialog-image-preview img')!;
    expect(previewImg).not.toBeNull();
    expect(previewImg.getAttribute('src')).toBe('https://example.com/cat.jpg');
  });
});

describe('dialog focus management (a11y)', () => {
  beforeEach(() => {
    stubRangeRects();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.querySelectorAll('.re-dialog-overlay, .re-link-tooltip').forEach((el) => el.remove());
  });

  it('link dialog restores focus to the previously focused element when closed', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const promise = showLinkDialog('', '', {});
    vi.advanceTimersByTime(60);

    const dialog = document.querySelector('.re-dialog')!;
    pressKey(dialog, 'Escape');
    await expect(promise).resolves.toBeNull();

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('image dialog restores focus to the previously focused element when closed', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const promise = showImageDialog('', '', {});
    vi.advanceTimersByTime(60);

    click(document.querySelector('.re-dialog-overlay')!);
    await expect(promise).resolves.toBeNull();

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });

  it('does not restore focus when the trigger element was removed from the DOM', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const promise = showLinkDialog('', '', {});
    vi.advanceTimersByTime(60);
    trigger.remove(); // trigger gone while dialog open

    const dialog = document.querySelector('.re-dialog')!;
    pressKey(dialog, 'Escape');
    await expect(promise).resolves.toBeNull();

    expect(document.activeElement).not.toBe(trigger);
  });

  it('link tooltip cycles focus with Tab inside the tooltip', async () => {
    showLinkTooltip('', '', {});
    vi.advanceTimersByTime(20);

    const tooltip = document.querySelector('.re-link-tooltip') as HTMLElement;
    const focusable = tooltip.querySelectorAll<HTMLElement>('input, button');
    focusable[focusable.length - 1]!.focus();

    pressKey(tooltip, 'Tab');
    expect(document.activeElement).toBe(focusable[0]);

    pressKey(tooltip, 'Tab', { shiftKey: true });
    expect(document.activeElement).toBe(focusable[focusable.length - 1]);
  });

  it('link tooltip restores focus when closed via outside click', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();

    const promise = showLinkTooltip('', '', {});
    vi.advanceTimersByTime(21);

    pointerDownAt(document.body);
    await expect(promise).resolves.toBeNull();

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
