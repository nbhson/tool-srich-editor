# Contributing

Contributions are welcome! Please follow these guidelines:

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/srich-editor.git`
3. Install dependencies: `npm install`
4. Run dev mode: `npm run dev`
5. Run tests: `npm test`

## Development

- **Lint**: `npm run lint`
- **Build**: `npm run build`
- **Unit tests**: `npm run test`
- **E2E tests**: `npm run test:e2e` (requires Playwright browsers)

## Code Style

- TypeScript strict mode
- ESLint + Prettier for formatting
- Add unit tests for new features
- Keep E2E tests passing

## Pull Requests

1. Create a feature branch from `main`
2. Add tests for new functionality
3. Ensure all tests pass (`npm run lint && npm test && npm run test:e2e`)
4. Update CHANGELOG.md if applicable
5. Open a PR with a clear description
