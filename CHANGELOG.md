# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- `exportToPDF` now loads `html2pdf.js` lazily (window global first, dynamic `import()` fallback) so the editor core stays dependency-free and ESM consumers don't need the optional peer at startup.
- `exportToWord` (HTML-based `.doc` fallback) is now exported from the package entry point.

### Fixed
- Build: removed the rollup warning where `styles.css` was emitted twice (JS output overwrote the extracted CSS asset).
- Accessibility: added missing `aria-label` on the comment dialog close button and link-tooltip inputs; color buttons now declare `aria-haspopup`.
- Color picker: outside-click and Escape listeners are now always removed when the picker closes (listener leak).
- E2E: fixed flaky "close link tooltip on click outside" test (click landed on the page scrollbar, which does not dispatch `pointerdown`).

### Added
- Unit tests for editor core (`editor.test.ts`), toolbar config (`toolbar.test.ts`) and color picker (`color-picker.test.ts`).

### Security/Dependencies
- Updated dev dependencies within semver ranges: rollup 4.67, @rollup/plugin-typescript 12.3.1, rollup-plugin-dts 6.5.1, tslib 2.9.1, @playwright/test 1.64.1, docx 9.15.0 (peer). Major bumps (TypeScript 7, Vitest 5, jsdom 30) intentionally deferred.

## [1.1.1] - 2024-??-??

### Fixed
- **Dependencies fixed**: `docx` and `html2pdf.js` moved to `peerDependencies` (optional) to match the "dependency-free" claim.
