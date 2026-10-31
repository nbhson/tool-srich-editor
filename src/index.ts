/**
 * SRich Editor - A lightweight, dependency-free rich text editor
 *
 * @example
 * ```js
 * import { createEditor } from 'srich-editor';
 * import 'srich-editor/dist/styles.css';
 *
 * const editor = createEditor({
 *   container: '#editor',
 *   placeholder: 'Start typing...',
 *   onChange: (content) => console.log(content),
 *   onFocus: () => console.log('focused'),
 *   onBlur: () => console.log('blurred'),
 *   locale: {
 *     words: 'từ',
 *     characters: 'ký tự',
 *   },
 * });
 *
 * // New API methods
 * editor.getText();           // plain text
 * editor.getCharacterCount(); // character count
 * editor.getWordCount();      // word count
 * editor.undo();              // undo last change
 * editor.redo();              // redo last undone change
 * editor.canUndo();           // check if undo is available
 * editor.canRedo();           // check if redo is available
 *
 * // Custom buttons
 * editor.execCommand('customButtonName');
 *
 * // Comments
 * const editor = createEditor({
 *   container: '#editor',
 *   comments: { userName: 'Alice' },
 *   export: { pdf: true, word: true },
 * });
 * ```
 */

import { createEditor } from './editor';
import {
  RichEditorOptions,
  RichEditorInstance,
  ToolbarItem,
  CustomButton,
  LocaleStrings,
  CommentsConfig,
  ExportConfig,
  CommentData,
  CommentReplyData,
} from './types';
import { defaultToolbar, icons } from './toolbar';
import { showLinkDialog, showLinkTooltip, showImageDialog } from './dialog';
import { sanitizeHTML, sanitizeLinkURL, sanitizeImageURL } from './sanitizer';
import { createCommentsManager, Comment, CommentReply, CommentsOptions, CommentsLocale } from './comments';
import { exportToPDF, exportToDocx, exportToWord } from './export';

export { createEditor };
export { createCommentsManager, exportToPDF, exportToDocx, exportToWord };
export type {
  RichEditorOptions,
  RichEditorInstance,
  ToolbarItem,
  CustomButton,
  LocaleStrings,
  CommentsConfig,
  ExportConfig,
  CommentData,
  CommentReplyData,
  Comment,
  CommentReply,
  CommentsOptions,
  CommentsLocale,
};
export { defaultToolbar, icons };
export { showLinkDialog, showLinkTooltip, showImageDialog };
export { sanitizeHTML, sanitizeLinkURL, sanitizeImageURL };

// Default export for convenience
export default { createEditor };