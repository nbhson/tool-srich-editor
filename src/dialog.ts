/**
 * Custom dialog components for the SRich Editor
 */

export interface LinkDialogResult {
  action: 'insert' | 'remove';
  text: string;
  url: string;
}

export interface ImageDialogResult {
  url: string;
  alt: string;
}

/** Default locale strings for dialogs */
const defaultDialogLocale = {
  insertLink: 'Insert Link',
  editLink: 'Edit Link',
  insertImage: 'Insert Image',
  editImage: 'Edit Image',
  displayText: 'Display Text',
  url: 'URL',
  imageUrl: 'Image URL',
  altText: 'Alt Text',
  preview: 'Preview',
  cancel: 'Cancel',
  insert: 'Insert',
  save: 'Save',
  removeLink: 'Remove Link',
  close: 'Close',
  unableToLoadImage: 'Unable to load image',
};

type DialogLocale = typeof defaultDialogLocale;

/**
 * Calculate tooltip position based on the current selection
 */
function getSelectionRect(): DOMRect | null {
  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    // If selection is collapsed (no text selected), use caret position
    if (rect.width === 0 && rect.height === 0) {
      // Try to get caret coordinates
      const tempRange = range.cloneRange();
      tempRange.collapse(true);
      const tempRect = tempRange.getBoundingClientRect();
      if (tempRect.width === 0 && tempRect.height === 0) {
        // Fallback: insert a temporary element to get position
        const span = document.createElement('span');
        span.textContent = '\u200b'; // zero-width space
        tempRange.insertNode(span);
        const spanRect = span.getBoundingClientRect();
        span.parentNode?.removeChild(span);
        // Normalize to clean up the text node
        if (range.startContainer.parentNode) {
          range.startContainer.parentNode.normalize();
        }
        return spanRect;
      }
      return tempRect;
    }
    return rect;
  }
  return null;
}

/**
 * Show an inline link tooltip/popover near the cursor or selected text
 */
export function showLinkTooltip(
  currentText: string = '',
  currentUrl: string = '',
  locale?: Partial<DialogLocale>,
): Promise<LinkDialogResult | null> {
  const loc = { ...defaultDialogLocale, ...locale };

  return new Promise((resolve) => {
    // Remove any existing tooltip
    document.querySelectorAll('.re-link-tooltip').forEach(el => el.remove());

    const tooltip = document.createElement('div');
    tooltip.className = 're-link-tooltip';
    tooltip.setAttribute('role', 'dialog');
    tooltip.setAttribute('aria-label', currentUrl ? loc.editLink : loc.insertLink);

    // ── Row 1: URL input ──
    const urlRow = document.createElement('div');
    urlRow.className = 're-link-tooltip-row';

    const urlIcon = document.createElement('span');
    urlIcon.className = 're-link-tooltip-icon';
    urlIcon.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></svg>';

    const urlInput = document.createElement('input');
    urlInput.className = 're-link-tooltip-input';
    urlInput.type = 'url';
    urlInput.placeholder = 'https://example.com';
    urlInput.value = currentUrl;
    urlInput.setAttribute('aria-label', currentUrl ? loc.editLink : loc.insertLink);

    urlRow.appendChild(urlIcon);
    urlRow.appendChild(urlInput);

    // ── Row 2: Text input ──
    const textRow = document.createElement('div');
    textRow.className = 're-link-tooltip-row';

    const textIcon = document.createElement('span');
    textIcon.className = 're-link-tooltip-icon';
    textIcon.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14"><path fill="currentColor" d="M2.5 4v3h5v12h3V7h5V4h-13zm19 5h-9v3h3v7h3v-7h3V9z"/></svg>';

    const textInput = document.createElement('input');
    textInput.className = 're-link-tooltip-input';
    textInput.type = 'text';
    textInput.placeholder = loc.displayText;
    textInput.value = currentText;
    textInput.setAttribute('aria-label', loc.displayText);

    textRow.appendChild(textIcon);
    textRow.appendChild(textInput);

    // ── Row 3: Buttons ──
    const btnRow = document.createElement('div');
    btnRow.className = 're-link-tooltip-btn-row';

    // Remove button (only when editing)
    if (currentUrl) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 're-link-tooltip-btn re-link-tooltip-btn-remove';
      removeBtn.type = 'button';
      removeBtn.textContent = loc.removeLink;
      removeBtn.addEventListener('mousedown', (e) => e.preventDefault());
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        cleanup();
        resolve({ action: 'remove', text: '', url: '' });
      });
      btnRow.appendChild(removeBtn);
    }

    const spacer = document.createElement('span');
    spacer.className = 're-link-tooltip-spacer';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 're-link-tooltip-btn re-link-tooltip-btn-cancel';
    cancelBtn.type = 'button';
    cancelBtn.textContent = loc.cancel;

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 're-link-tooltip-btn re-link-tooltip-btn-confirm';
    confirmBtn.type = 'button';
    confirmBtn.textContent = currentUrl ? loc.save : loc.insert;

    btnRow.appendChild(spacer);
    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);

    tooltip.appendChild(urlRow);
    tooltip.appendChild(textRow);
    tooltip.appendChild(btnRow);

    // Append to body first to measure
    document.body.appendChild(tooltip);

    // ── Position the tooltip ──
    positionTooltip(tooltip);

    // Focus the appropriate input
    setTimeout(() => {
      if (currentUrl) {
        urlInput.focus();
        urlInput.select();
      } else {
        textInput.focus();
      }
    }, 10);

    function positionTooltip(el: HTMLElement): void {
      const selRect = getSelectionRect();
      if (!selRect) {
        // Fallback: center of viewport
        el.style.position = 'fixed';
        el.style.left = '50%';
        el.style.top = '50%';
        el.style.transform = 'translate(-50%, -50%)';
        return;
      }

      el.style.position = 'fixed';
      const gap = 8;
      const elRect = el.getBoundingClientRect();
      const viewportW = window.innerWidth;
      const viewportH = window.innerHeight;

      // Try positioning below the selection
      let top = selRect.bottom + gap;
      let left = selRect.left + (selRect.width / 2) - (elRect.width / 2);

      // If it goes below viewport, position above
      if (top + elRect.height > viewportH - gap) {
        top = selRect.top - gap - elRect.height;
      }

      // If still off-screen, clamp to top
      if (top < gap) {
        top = gap;
      }

      // Clamp horizontal
      if (left < gap) {
        left = gap;
      } else if (left + elRect.width > viewportW - gap) {
        left = viewportW - gap - elRect.width;
      }

      el.style.left = `${left}px`;
      el.style.top = `${top}px`;
    }

    function cleanup() {
      tooltip.remove();
    }

    function confirm() {
      const url = urlInput.value.trim();
      const text = textInput.value.trim();
      if (url) {
        resolve({ action: 'insert', text: text || url, url });
      } else {
        urlInput.focus();
        urlInput.classList.add('re-link-tooltip-input-error');
        setTimeout(() => urlInput.classList.remove('re-link-tooltip-input-error'), 1500);
        return;
      }
      cleanup();
    }

    function cancel() {
      resolve(null);
      cleanup();
    }

    cancelBtn.addEventListener('mousedown', (e) => e.preventDefault());
    cancelBtn.addEventListener('click', (e) => {
      e.preventDefault();
      cancel();
    });

    confirmBtn.addEventListener('mousedown', (e) => e.preventDefault());
    confirmBtn.addEventListener('click', (e) => {
      e.preventDefault();
      confirm();
    });

    // Close on click outside
    function handleClickOutside(e: PointerEvent | MouseEvent) {
      if (!tooltip.contains(e.target as Node)) {
        cleanup();
        resolve(null);
        document.removeEventListener('pointerdown', handleClickOutside);
        document.removeEventListener('mousedown', handleClickOutside);
      }
    }
    // Delay to avoid immediately closing from the click that opened it
    setTimeout(() => {
      document.addEventListener('pointerdown', handleClickOutside);
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    // Keyboard handling
    tooltip.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        cancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        confirm();
      }
    });

    // Prevent tooltip clicks from propagating to the editor
    tooltip.addEventListener('mousedown', (e) => {
      e.stopPropagation();
    });
  });
}

/**
 * Show a custom link dialog (modal) - kept for backward compatibility
 * @param currentText - The currently selected text (if any)
 * @param currentUrl - The current URL (if editing an existing link)
 * @param locale - Optional locale strings
 * @returns Promise that resolves with the user's input or null if cancelled
 */
export function showLinkDialog(
  currentText: string = '',
  currentUrl: string = '',
  locale?: Partial<DialogLocale>,
): Promise<LinkDialogResult | null> {
  const loc = { ...defaultDialogLocale, ...locale };

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 're-dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 're-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', currentUrl ? loc.editLink : loc.insertLink);

    // Header
    const header = document.createElement('div');
    header.className = 're-dialog-header';
    const title = document.createElement('span');
    title.className = 're-dialog-title';
    title.textContent = currentUrl ? loc.editLink : loc.insertLink;
    const closeBtn = document.createElement('button');
    closeBtn.className = 're-dialog-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', loc.close);
    closeBtn.innerHTML = '\u00d7';
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Body
    const body = document.createElement('div');
    body.className = 're-dialog-body';

    // Text field
    const textField = document.createElement('div');
    textField.className = 're-dialog-field';
    const textLabel = document.createElement('label');
    textLabel.className = 're-dialog-label';
    textLabel.setAttribute('for', 're-link-text');
    textLabel.textContent = loc.displayText;
    const textInput = document.createElement('input');
    textInput.className = 're-dialog-input';
    textInput.type = 'text';
    textInput.id = 're-link-text';
    textInput.placeholder = 'Text to display';
    textInput.value = currentText;
    textField.appendChild(textLabel);
    textField.appendChild(textInput);

    // URL field
    const urlField = document.createElement('div');
    urlField.className = 're-dialog-field';
    const urlLabel = document.createElement('label');
    urlLabel.className = 're-dialog-label';
    urlLabel.setAttribute('for', 're-link-url');
    urlLabel.textContent = loc.url;
    const urlInput = document.createElement('input');
    urlInput.className = 're-dialog-input';
    urlInput.type = 'url';
    urlInput.id = 're-link-url';
    urlInput.placeholder = 'https://example.com';
    urlInput.value = currentUrl;
    urlField.appendChild(urlLabel);
    urlField.appendChild(urlInput);

    body.appendChild(textField);
    body.appendChild(urlField);

    // Footer
    const footer = document.createElement('div');
    footer.className = 're-dialog-footer';

    // "Remove Link" button when editing an existing link
    if (currentUrl) {
      const removeBtn = document.createElement('button');
      removeBtn.className = 're-dialog-btn re-dialog-btn-remove';
      removeBtn.type = 'button';
      removeBtn.textContent = loc.removeLink;
      removeBtn.addEventListener('click', () => {
        cleanup();
        resolve({ action: 'remove', text: '', url: '' });
      });
      footer.appendChild(removeBtn);
    }

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 're-dialog-btn re-dialog-btn-cancel';
    cancelBtn.type = 'button';
    cancelBtn.textContent = loc.cancel;
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 're-dialog-btn re-dialog-btn-confirm';
    confirmBtn.type = 'button';
    confirmBtn.textContent = currentUrl ? loc.save : loc.insert;
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    setTimeout(() => {
      if (currentUrl) {
        urlInput.focus();
        urlInput.select();
      } else {
        textInput.focus();
      }
    }, 50);

    function cleanup() {
      overlay.remove();
    }

    function confirm() {
      const text = textInput.value.trim();
      const url = urlInput.value.trim();
      if (url) {
        resolve({ action: 'insert', text: text || url, url });
      } else {
        urlInput.focus();
        urlInput.classList.add('re-dialog-input-error');
        setTimeout(() => urlInput.classList.remove('re-dialog-input-error'), 1500);
        return;
      }
      cleanup();
    }

    function cancel() {
      resolve(null);
      cleanup();
    }

    closeBtn.addEventListener('click', cancel);
    cancelBtn.addEventListener('click', cancel);
    confirmBtn.addEventListener('click', confirm);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cancel();
      }
    });

    // Focus trap for accessibility
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      } else if (e.key === 'Enter' && document.activeElement === urlInput) {
        e.preventDefault();
        confirm();
      } else if (e.key === 'Tab') {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'input, button, [tabindex]:not([tabindex="-1"])',
        );
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    });
  });
}

/**
 * Show a custom image dialog
 * @param currentUrl - The current image URL (if editing)
 * @param currentAlt - The current alt text (if editing)
 * @param locale - Optional locale strings
 * @returns Promise that resolves with the user's input or null if cancelled
 */
export function showImageDialog(
  currentUrl: string = '',
  currentAlt: string = '',
  locale?: Partial<DialogLocale>,
): Promise<ImageDialogResult | null> {
  const loc = { ...defaultDialogLocale, ...locale };

  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 're-dialog-overlay';

    const dialog = document.createElement('div');
    dialog.className = 're-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', currentUrl ? loc.editImage : loc.insertImage);

    // Header
    const header = document.createElement('div');
    header.className = 're-dialog-header';
    const title = document.createElement('span');
    title.className = 're-dialog-title';
    title.textContent = currentUrl ? loc.editImage : loc.insertImage;
    const closeBtn = document.createElement('button');
    closeBtn.className = 're-dialog-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', loc.close);
    closeBtn.innerHTML = '\u00d7';
    header.appendChild(title);
    header.appendChild(closeBtn);

    // Body
    const body = document.createElement('div');
    body.className = 're-dialog-body';

    // URL field
    const urlField = document.createElement('div');
    urlField.className = 're-dialog-field';
    const urlLabel = document.createElement('label');
    urlLabel.className = 're-dialog-label';
    urlLabel.setAttribute('for', 're-image-url');
    urlLabel.textContent = loc.imageUrl;
    const urlInput = document.createElement('input');
    urlInput.className = 're-dialog-input';
    urlInput.type = 'url';
    urlInput.id = 're-image-url';
    urlInput.placeholder = 'https://example.com/image.jpg';
    urlInput.value = currentUrl;
    urlField.appendChild(urlLabel);
    urlField.appendChild(urlInput);

    // Alt text field
    const altField = document.createElement('div');
    altField.className = 're-dialog-field';
    const altLabel = document.createElement('label');
    altLabel.className = 're-dialog-label';
    altLabel.setAttribute('for', 're-image-alt');
    altLabel.textContent = loc.altText;
    const altInput = document.createElement('input');
    altInput.className = 're-dialog-input';
    altInput.type = 'text';
    altInput.id = 're-image-alt';
    altInput.placeholder = 'Description of the image';
    altInput.value = currentAlt;
    altField.appendChild(altLabel);
    altField.appendChild(altInput);

    // Preview area
    const previewField = document.createElement('div');
    previewField.className = 're-dialog-field';
    const previewLabel = document.createElement('span');
    previewLabel.className = 're-dialog-label';
    previewLabel.textContent = loc.preview;
    const previewContainer = document.createElement('div');
    previewContainer.className = 're-dialog-image-preview';

    function updatePreview() {
      const url = urlInput.value.trim();
      previewContainer.innerHTML = '';
      if (url) {
        const img = document.createElement('img');
        img.src = url;
        img.alt = altInput.value;
        img.onerror = () => {
          previewContainer.innerHTML = `<span class="re-dialog-image-error">${loc.unableToLoadImage}</span>`;
        };
        previewContainer.appendChild(img);
      }
    }

    urlInput.addEventListener('input', updatePreview);

    previewField.appendChild(previewLabel);
    previewField.appendChild(previewContainer);

    body.appendChild(urlField);
    body.appendChild(altField);
    body.appendChild(previewField);

    // Footer
    const footer = document.createElement('div');
    footer.className = 're-dialog-footer';
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 're-dialog-btn re-dialog-btn-cancel';
    cancelBtn.type = 'button';
    cancelBtn.textContent = loc.cancel;
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 're-dialog-btn re-dialog-btn-confirm';
    confirmBtn.type = 'button';
    confirmBtn.textContent = currentUrl ? loc.save : loc.insert;
    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    dialog.appendChild(header);
    dialog.appendChild(body);
    dialog.appendChild(footer);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    setTimeout(() => {
      urlInput.focus();
      urlInput.select();
    }, 50);

    function cleanup() {
      overlay.remove();
    }

    function confirm() {
      const url = urlInput.value.trim();
      const alt = altInput.value.trim();
      if (url) {
        resolve({ url, alt });
      } else {
        urlInput.focus();
        urlInput.classList.add('re-dialog-input-error');
        setTimeout(() => urlInput.classList.remove('re-dialog-input-error'), 1500);
        return;
      }
      cleanup();
    }

    function cancel() {
      resolve(null);
      cleanup();
    }

    closeBtn.addEventListener('click', cancel);
    cancelBtn.addEventListener('click', cancel);
    confirmBtn.addEventListener('click', confirm);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        cancel();
      }
    });

    // Focus trap for accessibility
    dialog.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        cancel();
      } else if (e.key === 'Enter' && document.activeElement === urlInput) {
        e.preventDefault();
        confirm();
      } else if (e.key === 'Tab') {
        const focusable = dialog.querySelectorAll<HTMLElement>(
          'input, button, [tabindex]:not([tabindex="-1"])',
        );
        const firstEl = focusable[0];
        const lastEl = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    });
  });
}