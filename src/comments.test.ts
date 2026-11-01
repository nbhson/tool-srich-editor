import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createCommentsManager, Comment, CommentsOptions } from './comments';

// Mock DOM environment (jsdom) — build the structure that toggleSidebar expects
function createMockContentArea(): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 're-wrapper';

  const contentWrapper = document.createElement('div');
  contentWrapper.className = 're-content-wrapper';

  const div = document.createElement('div');
  div.innerHTML = '<p>This is some sample text for testing.</p>';

  contentWrapper.appendChild(div);
  wrapper.appendChild(contentWrapper);
  document.body.appendChild(wrapper);

  // Return the inner div as the contentArea — toggleSidebar walks up to .re-wrapper
  return div;
}

function createOptions(userName = 'TestUser'): CommentsOptions {
  return {
    userName,
    onChange: vi.fn(),
  };
}

describe('createCommentsManager', () => {
  let contentArea: HTMLElement;
  let options: CommentsOptions;

  beforeEach(() => {
    contentArea = createMockContentArea();
    options = createOptions();
  });

  it('should create a comments manager with required methods', () => {
    const manager = createCommentsManager(contentArea, options);
    expect(typeof manager.toggleSidebar).toBe('function');
    expect(typeof manager.addComment).toBe('function');
    expect(typeof manager.addReply).toBe('function');
    expect(typeof manager.resolveComment).toBe('function');
    expect(typeof manager.unresolveComment).toBe('function');
    expect(typeof manager.deleteComment).toBe('function');
    expect(typeof manager.getComments).toBe('function');
    expect(typeof manager.setComments).toBe('function');
    expect(typeof manager.scrollToComment).toBe('function');
    expect(typeof manager.showCommentPrompt).toBe('function');
  });

  it('should return empty comments initially', () => {
    const manager = createCommentsManager(contentArea, options);
    expect(manager.getComments()).toEqual([]);
  });

  describe('addComment', () => {
    it('should add a comment and return it', () => {
      const manager = createCommentsManager(contentArea, options);
      const comment = manager.addComment('sample text', 'This is a comment');
      expect(comment).not.toBeNull();
      expect(comment!.author).toBe('TestUser');
      expect(comment!.content).toBe('This is a comment');
      expect(comment!.selectedText).toBe('sample text');
      expect(comment!.resolved).toBe(false);
      expect(comment!.replies).toEqual([]);
      expect(comment!.id).toBeTruthy();
      expect(comment!.timestamp).toBeGreaterThan(0);
    });

    it('should add comment to the internal list', () => {
      const manager = createCommentsManager(contentArea, options);
      manager.addComment('sample text', 'Comment 1');
      expect(manager.getComments().length).toBe(1);
    });

    it('should return null for empty selected text', () => {
      const manager = createCommentsManager(contentArea, options);
      expect(manager.addComment('', 'Comment')).toBeNull();
      expect(manager.addComment('   ', 'Comment')).toBeNull();
    });

    it('should trim the selected text', () => {
      const manager = createCommentsManager(contentArea, options);
      const comment = manager.addComment('  sample text  ', 'Comment');
      expect(comment!.selectedText).toBe('sample text');
    });

    it('should highlight the selected text in content area', () => {
      const manager = createCommentsManager(contentArea, options);
      manager.addComment('sample text', 'Comment');
      const highlights = contentArea.querySelectorAll('.re-comment-highlight');
      expect(highlights.length).toBe(1);
    });

    it('should call onChange when comment is added', () => {
      const manager = createCommentsManager(contentArea, options);
      manager.addComment('sample text', 'Comment');
      expect(options.onChange).toHaveBeenCalledTimes(1);
    });

    it('should add multiple comments', () => {
      const manager = createCommentsManager(contentArea, options);
      manager.addComment('sample', 'Comment 1');
      manager.addComment('some', 'Comment 2');
      expect(manager.getComments().length).toBe(2);
    });
  });

  describe('addReply', () => {
    it('should add a reply to a comment', () => {
      const manager = createCommentsManager(contentArea, options);
      const comment = manager.addComment('sample text', 'Comment')!;
      manager.addReply(comment.id, 'This is a reply');
      const comments = manager.getComments();
      expect(comments[0].replies.length).toBe(1);
      expect(comments[0].replies[0].content).toBe('This is a reply');
      expect(comments[0].replies[0].author).toBe('TestUser');
    });

    it('should call onChange when reply is added', () => {
      const manager = createCommentsManager(contentArea, options);
      const comment = manager.addComment('sample text', 'Comment')!;
      manager.addReply(comment.id, 'Reply');
      expect(options.onChange).toHaveBeenCalledTimes(2); // 1 for comment, 1 for reply
    });

    it('should do nothing for non-existent comment', () => {
      const manager = createCommentsManager(contentArea, options);
      manager.addReply('nonexistent', 'Reply');
      expect(manager.getComments().length).toBe(0);
    });
  });

  describe('resolveComment', () => {
    it('should mark comment as resolved', () => {
      const manager = createCommentsManager(contentArea, options);
      const comment = manager.addComment('sample text', 'Comment')!;
      manager.resolveComment(comment.id);
      expect(manager.getComments()[0].resolved).toBe(true);
    });

    it('should remove highlight when resolved', () => {
      const manager = createCommentsManager(contentArea, options);
      const comment = manager.addComment('sample text', 'Comment')!;
      expect(contentArea.querySelectorAll('.re-comment-highlight').length).toBe(1);
      manager.resolveComment(comment.id);
      expect(contentArea.querySelectorAll('.re-comment-highlight').length).toBe(0);
    });

    it('should call onChange when resolved', () => {
      const manager = createCommentsManager(contentArea, options);
      const comment = manager.addComment('sample text', 'Comment')!;
      manager.resolveComment(comment.id);
      expect(options.onChange).toHaveBeenCalledTimes(2);
    });
  });

  describe('unresolveComment', () => {
    it('should unresolve a resolved comment', () => {
      const manager = createCommentsManager(contentArea, options);
      const comment = manager.addComment('sample text', 'Comment')!;
      manager.resolveComment(comment.id);
      expect(manager.getComments()[0].resolved).toBe(true);
      manager.unresolveComment(comment.id);
      expect(manager.getComments()[0].resolved).toBe(false);
    });

    it('should re-highlight unresolve comment', () => {
      const manager = createCommentsManager(contentArea, options);
      const comment = manager.addComment('sample text', 'Comment')!;
      manager.resolveComment(comment.id);
      manager.unresolveComment(comment.id);
      expect(contentArea.querySelectorAll('.re-comment-highlight').length).toBe(1);
    });
  });

  describe('deleteComment', () => {
    it('should remove comment from the list', () => {
      const manager = createCommentsManager(contentArea, options);
      const comment = manager.addComment('sample text', 'Comment')!;
      manager.deleteComment(comment.id);
      expect(manager.getComments().length).toBe(0);
    });

    it('should remove highlight when deleted', () => {
      const manager = createCommentsManager(contentArea, options);
      const comment = manager.addComment('sample text', 'Comment')!;
      manager.deleteComment(comment.id);
      expect(contentArea.querySelectorAll('.re-comment-highlight').length).toBe(0);
    });

    it('should call onChange when deleted', () => {
      const manager = createCommentsManager(contentArea, options);
      const comment = manager.addComment('sample text', 'Comment')!;
      manager.deleteComment(comment.id);
      expect(options.onChange).toHaveBeenCalledTimes(2);
    });

    it('should do nothing for non-existent comment', () => {
      const manager = createCommentsManager(contentArea, options);
      manager.addComment('sample text', 'Comment');
      manager.deleteComment('nonexistent');
      expect(manager.getComments().length).toBe(1);
    });
  });

  describe('setComments', () => {
    it('should replace existing comments', () => {
      const manager = createCommentsManager(contentArea, options);
      manager.addComment('sample', 'Old comment');
      expect(manager.getComments().length).toBe(1);

      const newComments: Comment[] = [
        {
          id: 'new1',
          author: 'Other',
          content: 'New comment',
          timestamp: Date.now(),
          selectedText: 'sample',
          resolved: false,
          replies: [],
        },
      ];
      manager.setComments(newComments);
      expect(manager.getComments().length).toBe(1);
      expect(manager.getComments()[0].id).toBe('new1');
      expect(manager.getComments()[0].content).toBe('New comment');
    });

    it('should re-highlight active comments after set', () => {
      const manager = createCommentsManager(contentArea, options);
      manager.setComments([
        {
          id: 'set1',
          author: 'User',
          content: 'Test',
          timestamp: Date.now(),
          selectedText: 'sample text',
          resolved: false,
          replies: [],
        },
      ]);
      expect(contentArea.querySelectorAll('.re-comment-highlight').length).toBe(1);
    });

    it('should not highlight resolved comments', () => {
      const manager = createCommentsManager(contentArea, options);
      manager.setComments([
        {
          id: 'resolved1',
          author: 'User',
          content: 'Test',
          timestamp: Date.now(),
          selectedText: 'sample text',
          resolved: true,
          replies: [],
        },
      ]);
      expect(contentArea.querySelectorAll('.re-comment-highlight').length).toBe(0);
    });
  });

  describe('toggleSidebar', () => {
    it('should create sidebar on first toggle', () => {
      const manager = createCommentsManager(contentArea, options);
      manager.toggleSidebar();
      const sidebar = contentArea.closest('.re-wrapper')?.querySelector('.re-comments-sidebar');
      expect(sidebar).not.toBeNull();
    });

    it('should show/hide sidebar on toggle', () => {
      const manager = createCommentsManager(contentArea, options);
      manager.toggleSidebar();
      const sidebar = contentArea.closest('.re-wrapper')?.querySelector('.re-comments-sidebar') as HTMLElement;
      expect(sidebar.classList.contains('re-comments-sidebar-visible')).toBe(true);

      manager.toggleSidebar();
      expect(sidebar.classList.contains('re-comments-sidebar-visible')).toBe(false);
    });
  });

  describe('showCommentPrompt', () => {
    it('should show dialog and return comment text on confirm', async () => {
      const manager = createCommentsManager(contentArea, options);
      // We need to simulate the dialog interaction
      const promptPromise = manager.showCommentPrompt('selected text');

      // Wait for dialog to appear
      await new Promise((resolve) => setTimeout(resolve, 100));

      const overlay = document.querySelector('.re-dialog-overlay');
      expect(overlay).not.toBeNull();

      // Find the textarea and fill it
      const textarea = overlay!.querySelector('.re-comment-textarea') as HTMLTextAreaElement;
      expect(textarea).not.toBeNull();
      textarea.value = 'My comment';

      // Click confirm
      const confirmBtn = overlay!.querySelector('.re-dialog-btn-confirm') as HTMLButtonElement;
      confirmBtn.click();

      const result = await promptPromise;
      expect(result).toBe('My comment');
    });

    it('should return null on cancel', async () => {
      const manager = createCommentsManager(contentArea, options);
      const promptPromise = manager.showCommentPrompt('selected text');

      await new Promise((resolve) => setTimeout(resolve, 100));

      const overlay = document.querySelector('.re-dialog-overlay');
      const cancelBtn = overlay!.querySelector('.re-dialog-btn-cancel') as HTMLButtonElement;
      cancelBtn.click();

      const result = await promptPromise;
      expect(result).toBeNull();
    });

    it('should return null when empty text is submitted', async () => {
      const manager = createCommentsManager(contentArea, options);
      const promptPromise = manager.showCommentPrompt('selected text');

      await new Promise((resolve) => setTimeout(resolve, 100));

      const overlay = document.querySelector('.re-dialog-overlay');
      const confirmBtn = overlay!.querySelector('.re-dialog-btn-confirm') as HTMLButtonElement;
      confirmBtn.click();

      const result = await promptPromise;
      expect(result).toBeNull();
    });

    it('should display truncated selected text in quote', async () => {
      const manager = createCommentsManager(contentArea, options);
      const longText = 'a'.repeat(200);
      manager.showCommentPrompt(longText);

      await new Promise((resolve) => setTimeout(resolve, 100));

      const quote = document.querySelector('.re-comment-prompt-quote');
      expect(quote).not.toBeNull();
      expect(quote!.textContent).toContain('...');
      expect(quote!.textContent).toContain('"');
    });
  });

  // ─── showCommentPrompt with fake timers (deterministic close paths) ───
  describe('showCommentPrompt (fake timers)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
      document.querySelectorAll('.re-dialog-overlay').forEach((el) => el.remove());
    });

    function openPrompt(manager: ReturnType<typeof createCommentsManager>, text = 'selected') {
      const promise = manager.showCommentPrompt(text);
      vi.advanceTimersByTime(60); // deferred textarea focus
      // Pick the newest overlay: earlier tests in this file may leave one behind
      const overlays = document.querySelectorAll('.re-dialog-overlay');
      const overlay = overlays[overlays.length - 1] as HTMLElement;
      const dialog = overlay.querySelector('.re-dialog') as HTMLElement;
      return { promise, overlay, dialog };
    }

    it('closes with Escape and resolves null', async () => {
      const manager = createCommentsManager(contentArea, options);
      const { promise, dialog, overlay } = openPrompt(manager);

      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));

      await expect(promise).resolves.toBeNull();
      expect(overlay.isConnected).toBe(false);
    });

    it('closes on overlay (outside) click and resolves null', async () => {
      const manager = createCommentsManager(contentArea, options);
      const { promise, overlay } = openPrompt(manager);

      overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      await expect(promise).resolves.toBeNull();
      expect(overlay.isConnected).toBe(false);
    });

    it('confirms with Ctrl+Enter and resolves the trimmed comment text', async () => {
      const manager = createCommentsManager(contentArea, options);
      const { promise, dialog } = openPrompt(manager);

      const textarea = dialog.querySelector('textarea') as HTMLTextAreaElement;
      textarea.value = '  my feedback  ';
      textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', ctrlKey: true, bubbles: true, cancelable: true }));

      await expect(promise).resolves.toBe('my feedback');
      expect(document.querySelector('.re-dialog-overlay')).toBeNull();
    });

    it('confirms via the confirm button', async () => {
      const manager = createCommentsManager(contentArea, options);
      const { promise, dialog } = openPrompt(manager);

      const textarea = dialog.querySelector('textarea') as HTMLTextAreaElement;
      textarea.value = 'note';
      (dialog.querySelector('.re-dialog-btn-confirm') as HTMLButtonElement).click();

      await expect(promise).resolves.toBe('note');
    });

    it('restores focus to the previously focused element when closed', async () => {
      const manager = createCommentsManager(contentArea, options);
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      trigger.focus();

      const { promise, dialog } = openPrompt(manager);
      dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
      await expect(promise).resolves.toBeNull();

      expect(document.activeElement).toBe(trigger);
      trigger.remove();
    });
  });
});