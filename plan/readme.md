# Plan — tool-srich-editor

Rich text editor library (Vanilla TS), rollup build, vitest + Playwright e2e.

## Baseline audit (00:44, 28-10-2026)
- Tests: ✅ **79 pass** (2 files)
- Lint: ✅ clean
- Build: ⚠️ thành công nhưng có:
  - Warning trùng file output: `styles.css` bị emit 2 lần (overwrite)
  - `TS5069: declarationDir cần declaration/composite`

## Roadmap
### P0
- [ ] Fix build warnings: tách css-only plugin khỏi lỗ emit trùng, fix tsconfig TS5069

### P1 (chất lượng)
- [ ] Audit editor core: XSS (paste HTML), undo/redo, selection edge cases
- [ ] Chạy e2e Playwright (nếu browser cài sẵn)
- [ ] Coverage bổ sung

### P2 (hardening)
- [ ] CI workflow
- [ ] Docs/demo sync

## Self-review log
- _0:44_ Audit lần 1: 79/79 pass, lint clean, build có 2 warnings.
