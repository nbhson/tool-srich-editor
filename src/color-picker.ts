/**
 * Lightweight color picker for toolbar color commands.
 * Uses a native <input type="color"> positioned near the triggering button.
 */

export function showColorPicker(anchorEl: HTMLElement): Promise<string | null> {
  return new Promise((resolve) => {
    // Remove any existing picker
    document.querySelectorAll('.re-color-picker-popup').forEach(el => el.remove());

    const input = document.createElement('input');
    input.className = 're-color-picker-popup';
    input.type = 'color';
    input.value = '#000000';
    input.style.position = 'fixed';
    input.style.zIndex = '10002';
    input.style.opacity = '0';
    input.style.width = '32px';
    input.style.height = '32px';
    input.style.padding = '0';
    input.style.border = 'none';
    input.style.borderRadius = '6px';
    input.style.cursor = 'pointer';
    input.style.pointerEvents = 'auto';

    // Position near the anchor button
    const rect = anchorEl.getBoundingClientRect();
    input.style.left = `${rect.left}px`;
    input.style.top = `${rect.bottom + 4}px`;

    document.body.appendChild(input);

    // Show the native picker
    requestAnimationFrame(() => {
      input.click();
    });

    function cleanup() {
      input.remove();
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeydown);
    }

    input.addEventListener('input', () => {
      resolve(input.value);
      cleanup();
    });

    input.addEventListener('change', () => {
      resolve(input.value);
      cleanup();
    });

    // Close on outside click
    function handleClickOutside(e: MouseEvent) {
      if (e.target !== input) {
        resolve(null);
        cleanup();
      }
    }
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    // Close on Escape
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        resolve(null);
        cleanup();
      }
    }
    document.addEventListener('keydown', handleKeydown);
  });
}