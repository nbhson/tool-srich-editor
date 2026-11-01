# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `maxUndoBytes` option (default 2 MB): caps the total UTF-8 size of HTML snapshots kept in the undo/redo stacks. Oldest snapshots are evicted when exceeded (at least one entry is always kept), preventing unbounded memory growth on large documents. `0` = unlimited. Existing `maxUndoLevels` behavior is unchanged.
- `editor.getSelection()` public API: returns `{ text, html, isCollapsed }` for the current selection inside the editor (empty when the selection is outside the editor).
- Paste now preserves basic formatting: when the clipboard contains an `text/html` flavor, the editor inserts it through the sanitizer (keeps bold/italic/underline/links, strips scripts, event handlers and unsafe URLs). Plain-text paste behavior is unchanged.
- Unit tests for dialogs (`dialog.test.ts`, fake timers): open/close promise resolution, outside click, Escape/Enter keys, focus trap and focus restore.
- Unit tests for Word export (`export.test.ts`) with a fake `docx` module, including nested list levels.
- Unit tests for toolbar keyboard navigation (arrow keys, Home/End, Enter/Space) and the `maxUndoBytes` cap.
- E2E tests: toolbar keyboard navigation and dialog focus management (6 new cases, both chromium and webkit).
- CI: bundle size guard (`npm run check:size`, gzip limits for esm/umd/css — no new dependencies).
- Unit tests for editor core (`editor.test.ts`), toolbar config (`toolbar.test.ts`) and color picker (`color-picker.test.ts`).

### Changed
- `exportToPDF` now loads `html2pdf.js` lazily (window global first, dynamic `import()` fallback) so the editor core stays dependency-free and ESM consumers don't need the optional peer at startup.
- `exportToWord` (HTML-based `.doc` fallback) is now exported from the package entry point.
- Word `.docx` export: nested lists now export with their real nesting depth (`bullet.level` parsed from the list markup, clamped at the docx maximum of 8) instead of a fixed `level: 0`; nested items also keep their correct document order.

### Fixed
- Dialogs (link tooltip, link dialog, image dialog, comment prompt) now restore focus to the previously focused element when closed; the link tooltip got a Tab focus trap it was missing.
- Link tooltip: document-level `pointerdown`/`mousedown` outside-click listeners are now always removed when the tooltip closes through any path (previously only removed when closed via outside click, leaking one listener per open/close cycle).
- `getSelectionRect` in the link tooltip no longer throws when Range rect APIs are unavailable (dialog now falls back to viewport centering).
- Build: removed the rollup warning where `styles.css` was emitted twice (JS output overwrote the extracted CSS asset).
- Accessibility: added missing `aria-label` on the comment dialog close button and link-tooltip inputs; color buttons now declare `aria-haspopup`.
- Color picker: outside-click and Escape listeners are now always removed when the picker closes (listener leak).
- E2E: fixed flaky "close link tooltip on click outside" test (click landed on the page scrollbar, which does not dispatch `pointerdown`).

### Known Limitations
- Replacing an open link tooltip with a new one (opening twice in a row) leaves the first tooltip's promise pending forever; the caller awaiting it never resumes. Rare in practice — the tooltip is usually closed by outside click/Escape first.
- Word `.docx` export renders ordered lists (`<ol>`) as bullet lists — the `docx` library's `bullet` API is used for both. Numbered list support would require a custom numbering config.

### Security/Dependencies
- Updated dev dependencies within semver ranges: rollup 4.67, @rollup/plugin-typescript 12.3.1, rollup-plugin-dts 6.5.1, tslib 2.9.1, @playwright/test 1.64.1, docx 9.15.0 (peer). Major bumps (TypeScript 7, Vitest 5, jsdom 30) intentionally deferred.

## [1.1.1] - 2024-??-??

### Fixed
- **Dependencies fixed**: `docx` and `html2pdf.js` moved to `peerDependencies` (optional) to match the "dependency-free" claim.
