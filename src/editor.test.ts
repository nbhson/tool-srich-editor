import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createEditor } from './editor';
import type { RichEditorInstance } from './types';

/**
 * jsdom does not implement execCommand / queryCommand*.
 * The editor relies on them for toolbar commands, so stub them here.
 */
function stubExecApis(): void {
  document.execCommand = vi.fn(() => true);
  document.queryCommandState = vi.fn(() => false);
  document.queryCommandValue = vi.fn(() => '');
}

describe('createEditor', () => {
  let host: HTMLElement;
  let editor: RichEditorInstance;

  function create(opts: Partial<Parameters<typeof createEditor>[0]> = {}): RichEditorInstance {
    return createEditor({ container: host, ...opts });
  }

  beforeEach(() => {
    stubExecApis();
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    editor?.destroy();
    host.remove();
  });

  // ─── DOM structure & ARIA ───
  it('should build the editor DOM structure', () => {
    editor = create();
    const wrapper = host.querySelector('.re-wrapper');
    expect(wrapper).not.toBeNull();
    expect(wrapper!.querySelector('.re-toolbar')).not.toBeNull();
    expect(wrapper!.querySelector('.re-content[contenteditable="true"]')).not.toBeNull();
    expect(wrapper!.querySelector('.re-statusbar')).not.toBeNull();
    expect(wrapper!.querySelector('.re-placeholder')).not.toBeNull();
  });

  it('should set ARIA roles for accessibility', () => {
    editor = create();
    const wrapper = host.querySelector('.re-wrapper') as HTMLElement;
    const toolbar = wrapper.querySelector('.re-toolbar') as HTMLElement;
    const content = wrapper.querySelector('.re-content') as HTMLElement;

    expect(toolbar.getAttribute('role')).toBe('toolbar');
    expect(toolbar.getAttribute('aria-label')).toBeTruthy();
    expect(content.getAttribute('role')).toBe('textbox');
    expect(content.getAttribute('aria-multiline')).toBe('true');
    expect(content.getAttribute('aria-label')).toBeTruthy();
    expect(wrapper.querySelector('.re-statusbar')!.getAttribute('aria-live')).toBe('polite');
  });

  it('should resolve container by CSS selector', () => {
    host.id = 'editor-host';
    editor = createEditor({ container: '#editor-host' });
    expect(host.querySelector('.re-wrapper')).not.toBeNull();
  });

  it('should throw when the container selector does not match', () => {
    expect(() => createEditor({ container: '#does-not-exist' })).toThrow(/Container element not found/);
  });

  it('should hide toolbar/status bar when configured off', () => {
    editor = create({ toolbarVisible: false, statusBarVisible: false });
    const toolbar = host.querySelector('.re-toolbar') as HTMLElement;
    const statusBar = host.querySelector('.re-statusbar') as HTMLElement;
    expect(toolbar.style.display).toBe('none');
    expect(statusBar.style.display).toBe('none');
  });

  it('should apply custom className to the wrapper', () => {
    editor = create({ className: 'foo bar' });
    const wrapper = host.querySelector('.re-wrapper') as HTMLElement;
    expect(wrapper.classList.contains('foo')).toBe(true);
    expect(wrapper.classList.contains('bar')).toBe(true);
  });

  it('should fire onReady after initialization', () => {
    const onReady = vi.fn();
    editor = create({ onReady });
    expect(onReady).toHaveBeenCalledTimes(1);
  });

  it('should fire autoFocus focus', () => {
    editor = create({ autoFocus: true });
    expect(document.activeElement).toBe(
      host.querySelector('.re-content') as HTMLElement,
    );
  });

  // ─── Content API ───
  it('should get and set content', () => {
    editor = create();
    editor.setContent('<p>Hello <strong>World</strong></p>');
    expect(editor.getContent()).toContain('<strong>World</strong>');
    expect(editor.getText()).toBe('Hello World');
  });

  it('should sanitize initial and setContent content', () => {
    editor = create({ content: '<p>Hi</p><script>alert(1)</script>' });
    expect(editor.getContent()).not.toContain('script');
    expect(editor.getContent()).toContain('Hi');

    editor.setContent('<p>Safe</p><img src="x" onerror="alert(1)">');
    expect(editor.getContent()).not.toContain('onerror');
    expect(editor.getContent()).toContain('<img');
  });

  it('should report counts correctly', () => {
    editor = create({ content: '<p>one two three</p>' });
    expect(editor.getWordCount()).toBe(3);
    expect(editor.getCharacterCount()).toBe(13);
    expect(editor.isEmpty()).toBe(false);
  });

  it('should be empty initially', () => {
    editor = create();
    expect(editor.isEmpty()).toBe(true);
    expect(editor.getWordCount()).toBe(0);
    expect(editor.getCharacterCount()).toBe(0);
  });

  // ─── Placeholder ───
  it('should show placeholder when empty and hide when content exists', () => {
    editor = create({ placeholder: 'Type here' });
    const placeholder = host.querySelector('.re-placeholder') as HTMLElement;
    expect(placeholder.textContent).toBe('Type here');
    expect(placeholder.style.display).toBe('block');

    editor.setContent('<p>filled</p>');
    expect(placeholder.style.display).toBe('none');
  });

  // ─── onChange ───
  it('should call onChange on input events', async () => {
    const onChange = vi.fn();
    editor = create({ onChange });
    const content = host.querySelector('.re-content') as HTMLElement;
    content.innerHTML = '<p>typed</p>';
    content.dispatchEvent(new Event('input', { bubbles: true }));
    // onChange is throttled via setTimeout(0)
    await new Promise((r) => setTimeout(r, 10));
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0]).toContain('typed');
  });

  // ─── Read-only / disable / enable ───
  it('should support readOnly option and disable/enable', () => {
    editor = create({ readOnly: true });
    const content = host.querySelector('.re-content') as HTMLElement;
    const wrapper = host.querySelector('.re-wrapper') as HTMLElement;
    expect(content.getAttribute('contenteditable')).toBe('false');
    expect(wrapper.classList.contains('re-readonly')).toBe(true);

    editor.enable();
    expect(content.getAttribute('contenteditable')).toBe('true');
    expect(wrapper.classList.contains('re-readonly')).toBe(false);

    editor.disable();
    expect(content.getAttribute('contenteditable')).toBe('false');
    expect(wrapper.classList.contains('re-readonly')).toBe(true);
  });

  // ─── Undo / Redo ───
  /** Simulate user typing: replace content and fire an input event */
  function type(html: string): void {
    const content = host.querySelector('.re-content') as HTMLElement;
    content.innerHTML = html;
    content.dispatchEvent(new Event('input', { bubbles: true }));
  }

  it('should undo and redo content changes', () => {
    editor = create();
    expect(editor.canUndo()).toBe(false);

    type('<p>v1</p>');
    type('<p>v2</p>');
    expect(editor.canUndo()).toBe(true);

    editor.undo();
    expect(editor.getContent()).toContain('v1');
    expect(editor.canRedo()).toBe(true);

    editor.redo();
    expect(editor.getContent()).toContain('v2');
  });

  it('should not undo past the initial state', () => {
    editor = create();
    type('<p>only</p>');
    editor.undo();
    expect(editor.getContent()).toBe('');
    expect(editor.canUndo()).toBe(false);
  });

  it('should clear redo stack on new changes', () => {
    editor = create();
    type('<p>a</p>');
    type('<p>b</p>');
    editor.undo();
    expect(editor.canRedo()).toBe(true);
    type('<p>c</p>');
    expect(editor.canRedo()).toBe(false);
  });

  it('should treat setContent as a programmatic replace (not undoable)', () => {
    editor = create();
    editor.setContent('<p>a</p>');
    // setContent does not create undo history — undoing after it is a no-op
    editor.undo();
    expect(editor.getContent()).toContain('a');
    expect(editor.canUndo()).toBe(false);
    expect(editor.canRedo()).toBe(false);
  });

  it('should respect maxUndoLevels', () => {
    editor = create({ maxUndoLevels: 2 });
    type('<p>1</p>');
    type('<p>2</p>');
    type('<p>3</p>');
    type('<p>4</p>');
    // Only 2 levels kept → two undos reach the earliest kept state
    editor.undo();
    editor.undo();
    expect(editor.canUndo()).toBe(false);
    expect(editor.getContent()).toContain('2');
    expect(editor.getContent()).not.toContain('4');
  });

  // ─── maxLength ───
  it('should revert input that exceeds maxLength', () => {
    editor = create({ maxLength: 5 });
    const content = host.querySelector('.re-content') as HTMLElement;

    content.innerHTML = '123456789';
    content.dispatchEvent(new Event('input', { bubbles: true }));

    expect(editor.getText()).toBe('');
  });

  // ─── Toolbar ───
  it('should render default toolbar buttons', () => {
    editor = create();
    const btns = host.querySelectorAll('.re-btn');
    expect(btns.length).toBeGreaterThan(20);
    const bold = host.querySelector('[data-command="bold"]') as HTMLElement;
    expect(bold).not.toBeNull();
    expect(bold.getAttribute('aria-label')).toBeTruthy();
    expect(bold.getAttribute('aria-pressed')).toBe('false');
  });

  it('should mark color buttons as popup triggers', () => {
    editor = create();
    const colorBtn = host.querySelector('[data-command="foreColor"]') as HTMLElement;
    expect(colorBtn.getAttribute('aria-haspopup')).toBe('true');
  });

  it('should render a custom toolbar config', () => {
    editor = create({
      toolbar: [
        { type: 'button', name: 'bold', icon: 'bold', tooltip: 'Bold', command: 'bold' },
        { type: 'separator' },
        { type: 'button', name: 'link', icon: 'link', tooltip: 'Link', command: 'createLink' },
      ],
    });
    const btns = host.querySelectorAll('.re-btn');
    expect(btns.length).toBe(2);
    expect(host.querySelector('.re-separator')).not.toBeNull();
    // No export/comment buttons injected when a custom toolbar is provided
    expect(host.querySelector('[data-command="re:comment"]')).toBeNull();
  });

  it('should inject comment and export buttons when enabled', () => {
    editor = create({
      comments: { userName: 'Tester' },
      export: { documentTitle: 'Doc' },
    });
    expect(host.querySelector('[data-command="re:comment"]')).not.toBeNull();
    expect(host.querySelector('[data-command="re:exportPDF"]')).not.toBeNull();
    expect(host.querySelector('[data-command="re:exportWord"]')).not.toBeNull();
  });

  // ─── execCommand & keyboard shortcuts ───
  it('should delegate execCommand to document.execCommand', () => {
    editor = create();
    editor.execCommand('bold');
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, '');
  });

  it('should handle Ctrl+B shortcut', () => {
    editor = create();
    const content = host.querySelector('.re-content') as HTMLElement;
    const prevented = new KeyboardEvent('keydown', {
      key: 'b', ctrlKey: true, bubbles: true, cancelable: true,
    });
    content.dispatchEvent(prevented);
    expect(prevented.defaultPrevented).toBe(true);
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, '');
  });

  it('should handle Ctrl+Shift+Z as redo', () => {
    editor = create();
    editor.setContent('<p>a</p>');
    editor.setContent('<p>b</p>');
    editor.undo();

    const content = host.querySelector('.re-content') as HTMLElement;
    content.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true, bubbles: true }),
    );
    expect(editor.getContent()).toContain('b');
  });

  it('should let onKeyDown callback prevent default handling', () => {
    const onKeyDown = vi.fn(() => false);
    editor = create({ onKeyDown });
    const content = host.querySelector('.re-content') as HTMLElement;
    content.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true, cancelable: true }),
    );
    expect(onKeyDown).toHaveBeenCalled();
    expect(document.execCommand).not.toHaveBeenCalled();
  });

  it('should insert indent on Tab key', () => {
    editor = create();
    const content = host.querySelector('.re-content') as HTMLElement;
    content.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }),
    );
    expect(document.execCommand).toHaveBeenCalledWith('insertHTML', false, '&nbsp;&nbsp;&nbsp;&nbsp;');
  });

  // ─── Custom buttons ───
  it('should register and invoke custom buttons', () => {
    const command = vi.fn();
    editor = create({
      customButtons: [
        { name: 'myBtn', icon: '<svg id="my-icon"></svg>', tooltip: 'My Button', command },
      ],
    });
    const btn = host.querySelector('[data-custom-name="myBtn"]') as HTMLButtonElement;
    expect(btn).not.toBeNull();
    expect(btn.getAttribute('title')).toBe('My Button');
    btn.click();
    expect(command).toHaveBeenCalledTimes(1);
  });

  it('should insert custom buttons at the requested position', () => {
    editor = create({
      customButtons: [
        { name: 'first', icon: '', tooltip: 'First', command: () => {}, position: 0 },
      ],
    });
    const firstChild = (host.querySelector('.re-toolbar') as HTMLElement).children[0];
    expect((firstChild as HTMLElement).dataset.customName).toBe('first');
  });

  // ─── Lifecycle ───
  it('should remove the wrapper and listeners on destroy', () => {
    editor = create();
    const wrapper = editor.getElement();
    expect(host.contains(wrapper)).toBe(true);

    const content = wrapper.querySelector('.re-content') as HTMLElement;
    const execSpy = document.execCommand as ReturnType<typeof vi.fn>;
    editor.destroy();
    expect(host.contains(wrapper)).toBe(false);

    // Listeners removed: dispatching input after destroy must not touch execCommand
    const callsBefore = execSpy.mock.calls.length;
    content.dispatchEvent(new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true }));
    expect((document.execCommand as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore);
  });

  it('should return the wrapper element from getElement', () => {
    editor = create();
    expect(editor.getElement().classList.contains('re-wrapper')).toBe(true);
  });

  it('should query command state safely', () => {
    editor = create();
    (document.queryCommandState as ReturnType<typeof vi.fn>).mockReturnValue(true);
    expect(editor.queryCommandState('bold')).toBe(true);

    // Force an internal throw → returns false
    (document.queryCommandState as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error('boom');
    });
    expect(editor.queryCommandState('bold')).toBe(false);
  });
});
