# QWEN Copilot Context

This file provides guidance to Qwen Code when working with code in this repository.

## Project Overview

**JustPlay (PixelWeaver)** - AI Interactive Novel Generator.

- **Architecture**: **Hybrid**.
  - **Structure**: Ink Engine (`inkjs`) handles state, branching, and logic deterministically.
  - **Prose/Flavor**: AI Agents (Vercel AI SDK) generate text and descriptions.
- **Framework**: React Router v7 (SSR/SPA)
- **Bundler**: Vite 7
- **Styling**: Tailwind CSS v4
- **Runtime**: Bun
- **Deployment**: Cloudflare Pages/Workers

## Common Commands

- **Development**: `bun run dev`
- **Typecheck**: `bun run typecheck`
- **Build**: `bun run build`
- **Deploy**: `bun run deploy`

## Directory Structure and Code Boundaries

This project uses SSR (Server-Side Rendering). **Strict separation between server and client code is critical** to avoid hydration mismatches and runtime errors.

```
justplay/
├── app/                    # Client-safe code (runs on both server SSR and client)
│   ├── routes/             # Route files (loaders run server-side, components hydrate client-side)
│   ├── pages/              # Page components (pure UI, no server imports)
│   ├── components/         # Reusable UI components
├── server/                 # Server-only code (NEVER import from app/ or client)
│   ├── runtime/            # Ink Runtime Engine (ink-runner.ts, system-fns.ts)
│   ├── services/           # Business logic, AI integration
│   ├── db/                 # Database client and schema
├── shared/                 # Shared types and constants (no runtime code, types only)
```

### Path Aliases

- `~/` -> `./app/` (client-safe code)
- `@server/` -> `./server/` (server-only code)
- `@shared/` -> `./shared/` (shared types, no runtime)

## SSR Rules

1. **Never** import server modules (`@server/*`) in component files.
2. **Never** use browser APIs (`document`, `window`) during initial render.

## Narrative Engine (Critical)

This project uses **Ink (.ink)** for the narrative backbone.

- Source: `stories/src/*.ink`
- Compiled: `stories/dist/*.json`
- Runtime: `server/runtime/ink-runner.ts` using `inkjs`

**Do not attempt to generate story logic purely via LLM.** Always respect the Ink state machine.
