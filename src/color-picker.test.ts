import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { showColorPicker } from './color-picker';

describe('showColorPicker', () => {
  let anchor: HTMLElement;

  beforeEach(() => {
    anchor = document.createElement('button');
    document.body.appendChild(anchor);
  });

  afterEach(() => {
    anchor.remove();
    document.querySelectorAll('.re-color-picker-popup').forEach((el) => el.remove());
  });

  function getPickerInput(): HTMLInputElement {
    const input = document.querySelector('.re-color-picker-popup') as HTMLInputElement | null;
    expect(input).not.toBeNull();
    return input!;
  }

  it('should append a color input to the body', async () => {
    const promise = showColorPicker(anchor);
    const input = getPickerInput();
    expect(input.type).toBe('color');

    input.dispatchEvent(new Event('input'));
    expect(await promise).toBe('#000000');
  });

  it('should resolve with the selected color on input and clean up', async () => {
    const promise = showColorPicker(anchor);
    const input = getPickerInput();
    input.value = '#ff0000';
    input.dispatchEvent(new Event('input'));

    expect(await promise).toBe('#ff0000');
    expect(document.querySelector('.re-color-picker-popup')).toBeNull();
  });

  it('should resolve with the selected color on change and clean up', async () => {
    const promise = showColorPicker(anchor);
    const input = getPickerInput();
    input.value = '#00ff00';
    input.dispatchEvent(new Event('change'));

    expect(await promise).toBe('#00ff00');
    expect(document.querySelector('.re-color-picker-popup')).toBeNull();
  });

  it('should remove any existing picker before opening a new one', async () => {
    const first = showColorPicker(anchor);
    const promise = showColorPicker(anchor);

    // The first picker's input should have been removed
    const inputs = document.querySelectorAll('.re-color-picker-popup');
    expect(inputs.length).toBe(1);

    getPickerInput().dispatchEvent(new Event('change'));
    await Promise.all([
      promise.then((v) => expect(v).toBe('#000000')),
      // First promise never resolves through UI; abandon it to avoid hanging assertions
    ]);
    first.catch(() => {});
  });

  it('should resolve null on Escape key and clean up', async () => {
    const promise = showColorPicker(anchor);
    getPickerInput();

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(await promise).toBeNull();
    expect(document.querySelector('.re-color-picker-popup')).toBeNull();
  });

  it('should resolve null on outside click and clean up listeners', async () => {
    const promise = showColorPicker(anchor);
    getPickerInput();

    // Wait for the deferred outside-click listener registration
    await new Promise((r) => setTimeout(r, 5));

    document.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    expect(await promise).toBeNull();
    expect(document.querySelector('.re-color-picker-popup')).toBeNull();
  });

  it('should not resolve on click on the input itself', async () => {
    const promise = showColorPicker(anchor);
    const input = getPickerInput();

    await new Promise((r) => setTimeout(r, 5));
    input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));

    // Still open — dispatch input to resolve and verify it stayed open
    expect(document.querySelector('.re-color-picker-popup')).not.toBeNull();
    input.dispatchEvent(new Event('input'));
    expect(await promise).toBe('#000000');
  });
});
