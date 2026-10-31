/**
 * Comments module for SRich Editor
 * Allows users to add, reply to, resolve, and delete comments on selected text.
 */

/** A single comment on the document */
export interface Comment {
  /** Unique identifier */
  id: string;
  /** Author name */
  author: string;
  /** Comment content */
  content: string;
  /** Timestamp */
  timestamp: number;
  /** The selected text this comment is attached to */
  selectedText: string;
  /** Whether this comment has been resolved */
  resolved: boolean;
  /** Replies to this comment */
  replies: CommentReply[];
  /** Highlight element reference (transient, not serialized) */
  highlightEl?: HTMLElement;
}

/** A reply to a comment */
export interface CommentReply {
  /** Unique identifier */
  id: string;
  /** Author name */
  author: string;
  /** Reply content */
  content: string;
  /** Timestamp */
  timestamp: number;
}

/** Configuration for the comments system */
export interface CommentsOptions {
  /** Current user name */
  userName: string;
  /** Callback when comments change */
  onChange?: (comments: Comment[]) => void;
}

/** Locale strings for comments UI */
export interface CommentsLocale {
  addComment?: string;
  reply?: string;
  resolve?: string;
  delete?: string;
  resolved?: string;
  placeholder?: string;
  replyPlaceholder?: string;
  noComments?: string;
  commentsTitle?: string;
}

const defaultCommentsLocale: Required<CommentsLocale> = {
  addComment: 'Add Comment',
  reply: 'Reply',
  resolve: 'Resolve',
  delete: 'Delete',
  resolved: 'Resolved',
  placeholder: 'Write a comment...',
  replyPlaceholder: 'Write a reply...',
  noComments: 'No comments yet. Select text and click the comment button to add one.',
  commentsTitle: 'Comments',
};

/** Generate a unique ID */
function generateId(): string {
  return 'cmt_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
}

/** Format a timestamp for display */
function formatTime(ts: number): string {
  const date = new Date(ts);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Creates and manages the comments panel and logic
 */
export function createCommentsManager(
  contentArea: HTMLElement,
  options: CommentsOptions,
  locale?: Partial<CommentsLocale>,
) {
  const loc = { ...defaultCommentsLocale, ...locale };
  const comments: Comment[] = [];
  let sidebarEl: HTMLElement | null = null;
  let isSidebarVisible = false;

  /** Generate an avatar color from a name */
  function getAvatarColor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];
    return colors[Math.abs(hash) % colors.length];
  }

  /** Get initials from a name */
  function getInitials(name: string): string {
    return name
      .split(/\s+/)
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  /** Highlight commented text in the content area */
  function highlightComment(comment: Comment): void {
    if (comment.highlightEl && contentArea.contains(comment.highlightEl)) {
      return; // Already highlighted
    }

    const walker = document.createTreeWalker(contentArea, NodeFilter.SHOW_TEXT);
    let node: Text | null;
    const searchText = comment.selectedText;

    while ((node = walker.nextNode() as Text | null)) {
      const idx = node.textContent!.indexOf(searchText);
      if (idx !== -1) {
        const range = document.createRange();
        range.setStart(node, idx);
        range.setEnd(node, idx + searchText.length);

        const span = document.createElement('span');
        span.className = 're-comment-highlight';
        span.dataset.commentId = comment.id;
        range.surroundContents(span);
        comment.highlightEl = span;

        // Click on highlight to focus the comment in sidebar
        span.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          scrollToComment(comment.id);
        });

        return;
      }
    }
  }

  /** Remove highlight for a comment */
  function removeHighlight(commentId: string): void {
    const spans = contentArea.querySelectorAll(`.re-comment-highlight[data-comment-id="${commentId}"]`);
    spans.forEach((span) => {
      const parent = span.parentNode;
      if (parent) {
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
        parent.normalize();
      }
    });
  }

  /** Add a new comment for the current selection */
  function addComment(selectedText: string, content: string): Comment | null {
    if (!selectedText || !selectedText.trim()) return null;

    const comment: Comment = {
      id: generateId(),
      author: options.userName,
      content,
      timestamp: Date.now(),
      selectedText: selectedText.trim(),
      resolved: false,
      replies: [],
    };

    comments.push(comment);
    highlightComment(comment);

    // Always ensure sidebar is visible when a comment is added
    if (!isSidebarVisible) {
      toggleSidebar();
    } else {
      renderSidebar();
    }

    options.onChange?.(comments);
    return comment;
  }

  /** Add a reply to a comment */
  function addReply(commentId: string, content: string): void {
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const reply: CommentReply = {
      id: generateId(),
      author: options.userName,
      content,
      timestamp: Date.now(),
    };

    comment.replies.push(reply);

    if (isSidebarVisible) {
      renderSidebar();
    }

    options.onChange?.(comments);
  }

  /** Resolve a comment */
  function resolveComment(commentId: string): void {
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    comment.resolved = true;
    removeHighlight(commentId);

    if (isSidebarVisible) {
      renderSidebar();
    }

    options.onChange?.(comments);
  }

  /** Delete a comment */
  function deleteComment(commentId: string): void {
    const idx = comments.findIndex((c) => c.id === commentId);
    if (idx === -1) return;

    removeHighlight(commentId);
    comments.splice(idx, 1);

    if (isSidebarVisible) {
      renderSidebar();
    }

    options.onChange?.(comments);
  }

  /** Unresolve a comment */
  function unresolveComment(commentId: string): void {
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    comment.resolved = false;
    highlightComment(comment);

    if (isSidebarVisible) {
      renderSidebar();
    }

    options.onChange?.(comments);
  }

  /** Scroll to a comment in the sidebar */
  function scrollToComment(commentId: string): void {
    if (!isSidebarVisible) {
      toggleSidebar();
    }
    const el = sidebarEl?.querySelector(`[data-comment-thread-id="${commentId}"]`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('re-comment-thread-flash');
      setTimeout(() => el.classList.remove('re-comment-thread-flash'), 1500);
    }
  }

  /** Create the sidebar DOM */
  function createSidebar(): HTMLElement {
    const sidebar = document.createElement('div');
    sidebar.className = 're-comments-sidebar';
    return sidebar;
  }

  /** Render the sidebar content */
  function renderSidebar(): void {
    if (!sidebarEl) return;

    const activeComments = comments.filter((c) => !c.resolved);
    const resolvedComments = comments.filter((c) => c.resolved);

    sidebarEl.innerHTML = '';

    // Header
    const header = document.createElement('div');
    header.className = 're-comments-header';
    const title = document.createElement('span');
    title.className = 're-comments-title';
    title.textContent = loc.commentsTitle;
    const closeBtn = document.createElement('button');
    closeBtn.className = 're-comments-close';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.innerHTML = '\u00d7';
    closeBtn.addEventListener('click', toggleSidebar);
    header.appendChild(title);
    header.appendChild(closeBtn);
    sidebarEl.appendChild(header);

    // Active comments
    if (activeComments.length === 0 && resolvedComments.length === 0) {
      const empty = document.createElement('div');
      empty.className = 're-comments-empty';
      empty.textContent = loc.noComments;
      sidebarEl.appendChild(empty);
    } else {
      activeComments.forEach((comment) => {
        sidebarEl!.appendChild(createCommentThread(comment, false));
      });
    }

    // Resolved comments
    if (resolvedComments.length > 0) {
      const resolvedSection = document.createElement('div');
      resolvedSection.className = 're-comments-resolved-section';

      const resolvedHeader = document.createElement('div');
      resolvedHeader.className = 're-comments-resolved-header';
      resolvedHeader.textContent = `${loc.resolved} (${resolvedComments.length})`;
      resolvedSection.appendChild(resolvedHeader);

      resolvedComments.forEach((comment) => {
        resolvedSection.appendChild(createCommentThread(comment, true));
      });

      sidebarEl.appendChild(resolvedSection);
    }
  }

  /** Create a comment thread DOM element */
  function createCommentThread(comment: Comment, isResolved: boolean): HTMLElement {
    const thread = document.createElement('div');
    thread.className = `re-comment-thread${isResolved ? ' re-comment-thread-resolved' : ''}`;
    thread.dataset.commentThreadId = comment.id;

    // Comment header
    const commentHeader = document.createElement('div');
    commentHeader.className = 're-comment-header';

    const avatar = document.createElement('div');
    avatar.className = 're-comment-avatar';
    avatar.style.backgroundColor = getAvatarColor(comment.author);
    avatar.textContent = getInitials(comment.author);

    const meta = document.createElement('div');
    meta.className = 're-comment-meta';
    const authorName = document.createElement('span');
    authorName.className = 're-comment-author';
    authorName.textContent = comment.author;
    const time = document.createElement('span');
    time.className = 're-comment-time';
    time.textContent = formatTime(comment.timestamp);
    meta.appendChild(authorName);
    meta.appendChild(time);

    commentHeader.appendChild(avatar);
    commentHeader.appendChild(meta);

    // Comment actions
    const actions = document.createElement('div');
    actions.className = 're-comment-actions';

    if (!isResolved) {
      const resolveBtn = document.createElement('button');
      resolveBtn.className = 're-comment-action-btn';
      resolveBtn.type = 'button';
      resolveBtn.textContent = loc.resolve;
      resolveBtn.title = loc.resolve;
      resolveBtn.addEventListener('click', () => resolveComment(comment.id));
      actions.appendChild(resolveBtn);
    } else {
      const unresolveBtn = document.createElement('button');
      unresolveBtn.className = 're-comment-action-btn';
      unresolveBtn.type = 'button';
      unresolveBtn.textContent = 'Unresolve';
      unresolveBtn.title = 'Unresolve';
      unresolveBtn.addEventListener('click', () => unresolveComment(comment.id));
      actions.appendChild(unresolveBtn);
    }

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 're-comment-action-btn re-comment-action-delete';
    deleteBtn.type = 'button';
    deleteBtn.textContent = loc.delete;
    deleteBtn.title = loc.delete;
    deleteBtn.addEventListener('click', () => deleteComment(comment.id));
    actions.appendChild(deleteBtn);

    commentHeader.appendChild(actions);

    // Selected text (quoted)
    const quote = document.createElement('div');
    quote.className = 're-comment-quote';
    quote.textContent = `"${comment.selectedText}"`;

    // Comment body
    const body = document.createElement('div');
    body.className = 're-comment-body';
    body.textContent = comment.content;

    thread.appendChild(commentHeader);
    thread.appendChild(quote);
    thread.appendChild(body);

    // Replies
    if (comment.replies.length > 0) {
      const repliesContainer = document.createElement('div');
      repliesContainer.className = 're-comment-replies';

      comment.replies.forEach((reply) => {
        const replyEl = document.createElement('div');
        replyEl.className = 're-comment-reply';

        const replyHeader = document.createElement('div');
        replyHeader.className = 're-comment-header';

        const replyAvatar = document.createElement('div');
        replyAvatar.className = 're-comment-avatar re-comment-avatar-sm';
        replyAvatar.style.backgroundColor = getAvatarColor(reply.author);
        replyAvatar.textContent = getInitials(reply.author);

        const replyMeta = document.createElement('div');
        replyMeta.className = 're-comment-meta';
        const replyAuthor = document.createElement('span');
        replyAuthor.className = 're-comment-author';
        replyAuthor.textContent = reply.author;
        const replyTime = document.createElement('span');
        replyTime.className = 're-comment-time';
        replyTime.textContent = formatTime(reply.timestamp);
        replyMeta.appendChild(replyAuthor);
        replyMeta.appendChild(replyTime);

        replyHeader.appendChild(replyAvatar);
        replyHeader.appendChild(replyMeta);

        const replyBody = document.createElement('div');
        replyBody.className = 're-comment-body';
        replyBody.textContent = reply.content;

        replyEl.appendChild(replyHeader);
        replyEl.appendChild(replyBody);
        repliesContainer.appendChild(replyEl);
      });

      thread.appendChild(repliesContainer);
    }

    // Reply input
    if (!isResolved) {
      const replyInput = document.createElement('div');
      replyInput.className = 're-comment-reply-input';

      const input = document.createElement('input');
      input.type = 'text';
      input.className = 're-comment-input';
      input.placeholder = loc.replyPlaceholder;

      const sendBtn = document.createElement('button');
      sendBtn.className = 're-comment-send-btn';
      sendBtn.type = 'button';
      sendBtn.textContent = loc.reply;
      sendBtn.addEventListener('click', () => {
        const val = input.value.trim();
        if (val) {
          addReply(comment.id, val);
          input.value = '';
        }
      });

      input.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendBtn.click();
        }
      });

      replyInput.appendChild(input);
      replyInput.appendChild(sendBtn);
      thread.appendChild(replyInput);
    }

    return thread;
  }

  /** Toggle sidebar visibility */
  function toggleSidebar(): void {
    const wrapper = contentArea.closest('.re-wrapper');
    if (!wrapper) return;

    if (!sidebarEl) {
      sidebarEl = createSidebar();
      wrapper.classList.add('re-has-comments-sidebar');
      // Insert sidebar after content wrapper
      const contentWrapper = wrapper.querySelector('.re-content-wrapper');
      if (contentWrapper) {
        contentWrapper.appendChild(sidebarEl);
      }
    }

    isSidebarVisible = !isSidebarVisible;

    if (isSidebarVisible) {
      sidebarEl.classList.add('re-comments-sidebar-visible');
      renderSidebar();
    } else {
      sidebarEl.classList.remove('re-comments-sidebar-visible');
    }
  }

  /** Get all comments */
  function getComments(): Comment[] {
    return [...comments];
  }

  /** Set comments (e.g. when loading from storage) */
  function setComments(data: Comment[]): void {
    // Clear existing highlights
    comments.forEach((c) => {
      if (c.id) removeHighlight(c.id);
    });

    comments.length = 0;
    data.forEach((c) => {
      comments.push({ ...c, replies: [...(c.replies || [])] });
    });

    // Re-highlight active comments
    comments.filter((c) => !c.resolved).forEach(highlightComment);

    if (isSidebarVisible) {
      renderSidebar();
    }
  }

  /** Show a prompt dialog for adding a comment */
  function showCommentPrompt(selectedText: string): Promise<string | null> {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 're-dialog-overlay';

      const dialog = document.createElement('div');
      dialog.className = 're-dialog';
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
      dialog.setAttribute('aria-label', loc.addComment);

      // Header
      const header = document.createElement('div');
      header.className = 're-dialog-header';
      const title = document.createElement('span');
      title.className = 're-dialog-title';
      title.textContent = loc.addComment;
      const closeBtn = document.createElement('button');
      closeBtn.className = 're-dialog-close';
      closeBtn.type = 'button';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.innerHTML = '\u00d7';
      header.appendChild(title);
      header.appendChild(closeBtn);

      // Body
      const body = document.createElement('div');
      body.className = 're-dialog-body';

      // Quote display
      const quoteDiv = document.createElement('div');
      quoteDiv.className = 're-comment-prompt-quote';
      quoteDiv.textContent = `"${selectedText.substring(0, 150)}${selectedText.length > 150 ? '...' : ''}"`;
      body.appendChild(quoteDiv);

      // Comment textarea
      const commentField = document.createElement('div');
      commentField.className = 're-dialog-field';
      const label = document.createElement('label');
      label.className = 're-dialog-label';
      label.textContent = 'Your comment';
      const textarea = document.createElement('textarea');
      textarea.className = 're-dialog-input re-comment-textarea';
      textarea.placeholder = loc.placeholder;
      textarea.rows = 3;
      commentField.appendChild(label);
      commentField.appendChild(textarea);
      body.appendChild(commentField);

      // Footer
      const footer = document.createElement('div');
      footer.className = 're-dialog-footer';
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 're-dialog-btn re-dialog-btn-cancel';
      cancelBtn.type = 'button';
      cancelBtn.textContent = 'Cancel';
      const confirmBtn = document.createElement('button');
      confirmBtn.className = 're-dialog-btn re-dialog-btn-confirm';
      confirmBtn.type = 'button';
      confirmBtn.textContent = loc.addComment;
      footer.appendChild(cancelBtn);
      footer.appendChild(confirmBtn);

      dialog.appendChild(header);
      dialog.appendChild(body);
      dialog.appendChild(footer);
      overlay.appendChild(dialog);
      document.body.appendChild(overlay);

      setTimeout(() => textarea.focus(), 50);

      function cleanup() {
        overlay.remove();
      }

      function confirm() {
        const val = textarea.value.trim();
        resolve(val || null);
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
        if (e.target === overlay) cancel();
      });

      dialog.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          cancel();
        } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          confirm();
        }
      });

      textarea.addEventListener('keydown', (e: KeyboardEvent) => {
        // Allow Enter for new lines, but Ctrl+Enter to confirm
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault();
          confirm();
        }
        e.stopPropagation();
      });
    });
  }

  return {
    toggleSidebar,
    addComment,
    addReply,
    resolveComment,
    unresolveComment,
    deleteComment,
    getComments,
    setComments,
    scrollToComment,
    showCommentPrompt,
  };
}