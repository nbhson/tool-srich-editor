/**
 * Configuration options for the Rich Editor
 */
export interface RichEditorOptions {
  /** The container element or CSS selector */
  container: string | HTMLElement;
  /** Initial HTML content */
  content?: string;
  /** Placeholder text when editor is empty */
  placeholder?: string;
  /** Height of the editor (CSS value) */
  height?: string;
  /** Available toolbar buttons */
  toolbar?: ToolbarItem[];
  /** Callback when content changes */
  onChange?: (content: string) => void;
  /** Callback when editor is ready */
  onReady?: () => void;
  /** Callback when editor gains focus */
  onFocus?: () => void;
  /** Callback when editor loses focus */
  onBlur?: () => void;
  /** Callback before a key is processed (return false to prevent) */
  onKeyDown?: (e: KeyboardEvent) => boolean | void;
  /** Callback when content is pasted (return false to prevent default) */
  onPaste?: (e: ClipboardEvent) => boolean | void;
  /** Custom toolbar button definitions */
  customButtons?: CustomButton[];
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Whether the toolbar is visible */
  toolbarVisible?: boolean;
  /** Whether the status bar is visible */
  statusBarVisible?: boolean;
  /** Custom CSS class for the editor wrapper */
  className?: string;
  /** Maximum character length (0 = unlimited) */
  maxLength?: number;
  /** Locale for UI strings */
  locale?: LocaleStrings;
  /** Comments configuration. Set to an object to enable comments panel. */
  comments?: CommentsConfig;
  /** Export configuration. Set to true or an object to enable export buttons. */
  export?: boolean | ExportConfig;
  /** Number of undo levels to keep */
  maxUndoLevels?: number;
  /**
   * Maximum total size (in UTF-8 bytes) of the HTML snapshots kept in the
   * undo/redo stacks. When exceeded, the oldest snapshots are evicted.
   * 0 = unlimited. Defaults to 2 MB.
   */
  maxUndoBytes?: number;
  /** Auto-focus editor on creation */
  autoFocus?: boolean;
}

/**
 * Comments configuration
 */
export interface CommentsConfig {
  /** Current user name for comments */
  userName: string;
  /** Callback when comments change */
  onCommentsChange?: (comments: CommentData[]) => void;
  /** Locale strings for comments UI */
  locale?: CommentsLocaleStrings;
}

/**
 * Comment data (serializable)
 */
export interface CommentData {
  id: string;
  author: string;
  content: string;
  timestamp: number;
  selectedText: string;
  resolved: boolean;
  replies: CommentReplyData[];
}

/**
 * Comment reply data (serializable)
 */
export interface CommentReplyData {
  id: string;
  author: string;
  content: string;
  timestamp: number;
}

/**
 * Locale strings for comments
 */
export interface CommentsLocaleStrings {
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

/**
 * Export configuration
 */
export interface ExportConfig {
  /** Document title for exported files */
  documentTitle?: string;
  /** Show PDF export button */
  pdf?: boolean;
  /** Show Word export button */
  word?: boolean;
}

/**
 * Locale strings for internationalization
 */
export interface LocaleStrings {
  words?: string;
  characters?: string;
  insertLink?: string;
  editLink?: string;
  insertImage?: string;
  editImage?: string;
  displayText?: string;
  url?: string;
  imageUrl?: string;
  altText?: string;
  preview?: string;
  cancel?: string;
  insert?: string;
  save?: string;
  removeLink?: string;
  close?: string;
  unableToLoadImage?: string;
}

/**
 * Toolbar item definition
 */
export interface ToolbarItem {
  type: 'button' | 'separator' | 'dropdown';
  name?: string;
  icon?: string;
  tooltip?: string;
  command?: string;
  value?: string;
  items?: ToolbarItem[];
}

/**
 * Custom button definition
 */
export interface CustomButton {
  /** Unique name for the button */
  name: string;
  /** SVG icon markup */
  icon: string;
  /** Tooltip text */
  tooltip: string;
  /** Click handler */
  command: (editor: RichEditorInstance) => void;
  /** Optional position in toolbar (0-based index) */
  position?: number;
}

/**
 * Editor instance interface
 */
export interface RichEditorInstance {
  /** Get the editor content as HTML */
  getContent(): string;
  /** Set the editor content as HTML */
  setContent(html: string): void;
  /** Get the editor content as plain text */
  getText(): string;
  /** Execute a document command */
  execCommand(command: string, value?: string): void;
  /** Check if a command is active */
  queryCommandState(command: string): boolean;
  /** Destroy the editor instance */
  destroy(): void;
  /** Get the underlying DOM element */
  getElement(): HTMLElement;
  /** Enable the editor */
  enable(): void;
  /** Disable the editor */
  disable(): void;
  /** Set focus to the editor */
  focus(): void;
  /** Check if editor is empty */
  isEmpty(): boolean;
  /** Check if undo is available */
  canUndo(): boolean;
  /** Check if redo is available */
  canRedo(): boolean;
  /** Undo the last change */
  undo(): void;
  /** Redo the last change */
  redo(): void;
  /** Get current character count */
  getCharacterCount(): number;
  /** Get current word count */
  getWordCount(): number;
}