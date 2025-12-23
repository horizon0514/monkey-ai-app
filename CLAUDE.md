# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Chat Monkey is an Electron-based desktop application that provides a unified interface for multiple Chinese AI chat services (DeepSeek, Tongyi Qianwen, Wenxin Yiyian, Tencent Yuanbao, Doubao). It supports embedding AI websites and BYOK (Bring Your Own Key) functionality via OpenRouter.

## Development Commands

```bash
# Install dependencies
yarn install

# Development (with hot reload)
yarn dev

# Type checking
yarn typecheck              # Check both main and renderer processes
yarn typecheck:node         # Main process only
yarn typecheck:web          # Renderer process only

# Linting and formatting
yarn lint                   # Fix lint issues
yarn lint:check             # Check without fixing
yarn format                 # Fix formatting
yarn format:check           # Check formatting

# Build production bundle
yarn build                  # Type check + build

# Database migrations
yarn db:generate            # Generate migrations from schema
yarn db:migrate             # Run migrations

# Platform-specific builds
yarn build:win:x64          # Windows NSIS installer
yarn build:mac:arm64        # macOS DMG (Apple Silicon)
yarn build:mac:x64          # macOS DMG (Intel)
yarn build:linux:appimage   # Linux AppImage
yarn build:linux:deb        # Debian package

# Run production build locally
yarn start
```

## Architecture

### Electron Process Structure

- **Main Process** (`/src/main/`): Node.js environment, handles OS interactions and window management
- **Renderer Process** (`/src/renderer/`): React application, UI layer
- **Preload Script** (`/src/preload/`): Bridge between main and renderer, exposes APIs via `window.electron`
- **Shared Code** (`/src/shared/`): TypeScript types and constants shared between processes

### Key Architectural Patterns

**Window Management** (`src/main/windowManager.ts`):

- `WindowManager` class manages multiple window types: MAIN, SETTINGS, QUICK
- Delegates side view management to `SideViewManager`
- Uses `electron-store` for persisting site configurations
- Global hotkey (Cmd/Ctrl+Shift+Space) toggles quick window

**Local Server** (`src/main/honoServer.ts`):

- Hono.js server runs on port 3399, provides REST API for chat
- Endpoints: `/chat`, `/chat/stream`, `/conversations`, `/conversations/:id/messages`
- Streams responses using AI SDK's `streamText` with `toUIMessageStreamResponse()`
- Falls back to direct fetch if AI SDK validation fails

**Database** (`src/main/db/`):

- SQLite with Drizzle ORM
- Schema in `src/main/db/schema.ts`: `conversations` and `messages` tables
- Run `yarn db:generate` after schema changes, then `yarn db:migrate`

**Site Embedding**:

- Sites are defined as `SiteConfig` objects in `src/shared/defaultSites.ts`
- Mark a site with `external: true` to open in system browser instead of embedded view
- Embedded views use Electron's `WebContentsView` API

**IPC Communication**:

- Main process registers handlers in `setupIpcHandlers()` (src/main/index.ts:209)
- Renderer accesses via `window.electron` API (defined in preload)
- Channel names: `switch-tab`, `get-site-configs`, `set-site-configs`, `open-settings`, `db-*`, etc.

### Entry Points

- **Main**: `src/main/index.ts` - Creates windows, starts Hono server, registers IPC handlers
- **Renderer**: `src/renderer/src/App.tsx` - Root React component
- **Settings**: `src/renderer/src/settings.tsx` - Separate entry point for settings window
- **Quick**: `src/renderer/src/quick.tsx` - Quick window (global hotkey)

## Key Files

- `src/main/index.ts` - Main process entry, app lifecycle, IPC setup
- `src/main/windowManager.ts` - Window creation and management
- `src/main/SideViewManager.ts` - Manages embedded webviews
- `src/main/honoServer.ts` - Local chat API server
- `src/shared/types.ts` - TypeScript types (SiteConfig, LlmSettings, SiteUnifyRule)
- `src/shared/defaultSites.ts` - Default site configurations
- `src/main/db/schema.ts` - Drizzle ORM schema

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR to main:

- `yarn lint:check` - ESLint with `--max-warnings=0`
- `yarn typecheck` - TypeScript compiler checks
- `yarn format:check` - Prettier formatting check

All must pass before merging.

## Notes

- No test suite exists; CI only checks linting, types, and formatting
- The app enforces single-instance mode to avoid IndexedDB lock issues
- Logs are suppressed (`--log-level 3`) to reduce Chromium console noise
- Package manager: Yarn (specified in packageManager field)
