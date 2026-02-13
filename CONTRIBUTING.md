# Contributing to SubtleAI

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- FFmpeg installed and available in PATH
- GROQ API key from [console.groq.com](https://console.groq.com)

### Getting Started

```bash
git clone https://github.com/albrtbc/subtleai.git
cd subtleai
npm install
cp .env.example .env
# Add your GROQ_API_KEY to .env
npm run dev
```

This starts the client at http://localhost:5173 and the server at http://localhost:3001.

## Project Structure

This is a monorepo using npm workspaces with two packages:

- `client/` — React 19 frontend (Vite, Tailwind CSS 4)
- `server/` — Express 4 backend (GROQ API, FFmpeg)

### Key Commands

```bash
npm run dev              # Run client + server concurrently
npm run dev:client       # Client only (port 5173)
npm run dev:server       # Server only with nodemon (port 3001)
npm -w client run lint   # Lint frontend
npm -w client run build  # Production build
```

## Making Changes

### Branch Naming

Use descriptive branch names with a prefix:

- `feat/description` — New features
- `fix/description` — Bug fixes
- `chore/description` — Maintenance tasks
- `docs/description` — Documentation changes

### Commit Messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) and [semantic-release](https://github.com/semantic-release/semantic-release) for automated versioning. Your commit messages determine the version bump:

| Prefix | Version Bump | Example |
|--------|-------------|---------|
| `fix:` | Patch (1.0.0 → 1.0.1) | `fix: handle empty audio files` |
| `feat:` | Minor (1.0.0 → 1.1.0) | `feat: add batch translation progress` |
| `feat:` + `BREAKING CHANGE:` in body | Major (1.0.0 → 2.0.0) | Breaking API changes |
| `docs:`, `chore:`, `ci:`, `style:`, `refactor:`, `test:` | No release | Non-functional changes |

Use a scope when the change targets a specific area:

```
fix(ci): correct gitleaks token configuration
feat(server): add cancellation support to transcription pipeline
```

### Pull Requests

1. Create a feature branch from `main`
2. Make your changes and commit using conventional commits
3. Push your branch and open a PR against `main`
4. Ensure all CI checks pass (lint, build, tests, security)
5. PRs require review before merging

### What CI Checks

On every PR, GitHub Actions runs:

- Lint (ESLint on client)
- Build (Vite production build)
- Tests on Node.js 18 and 20
- Security scan (gitleaks)
- Docker build validation

## Architecture Overview

### Data Flow

```
Upload → FFmpeg extraction (if video) → Whisper transcription (chunked for large files)
→ SRT formatting → LLM translation (if target ≠ source) → SRT restructuring → Download
```

The transcription endpoint (`POST /api/transcribe`) streams progress via NDJSON. The frontend `useJobQueue` hook manages concurrent processing (max 3 files). In-progress jobs can be cancelled end-to-end using AbortSignal propagation.

### Adding a New Language

1. Add the language code and name to `server/src/config/languages.js`
2. Add it to `client/src/utils/languages.js` if frontend-specific handling is needed
3. Test with both transcription and translation

## Code Style

- Frontend uses ESLint with React hooks and refresh rules
- No specific formatter enforced — follow the existing patterns in the codebase
- Add JSDoc to new functions in server-side code
- Avoid adding unnecessary dependencies

## Reporting Issues

Open an issue on [GitHub](https://github.com/albrtbc/subtleai/issues) with:

- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS, browser)
- Relevant error messages or logs (`LOG_LEVEL=DEBUG` for verbose output)
