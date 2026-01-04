# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Project Context (Legacy)
This is an AI Interactive Novel Generator originally built with:
- **Backend**: Python (FastAPI), SQLModel (SQLite/PostgreSQL), Redis (SSE).
- **Frontend**: Vanilla JavaScript + Tailwind CSS + Mermaid.js.
- **AI**: OpenAI GPT for story/map generation.
- **Entry point**: `main.py` (FastAPI).

## Target Architecture (Migration in Progress)
The project is migrating to a **Full-stack TypeScript** application:
- **Framework**: React Router v7 (SSR/SPA)
- **Bundler**: Vite 7
- **Styling**: Tailwind CSS v4
- **Runtime**: Bun
- **Deployment**: Cloudflare Pages/Workers

## Common Commands (Target Stack)
- **Build**: `bun run build`
- **Development**: `bun run dev`
- **Typecheck**: `bun run typecheck`
- **Deploy**: `bun run deploy` (Wrangler to Cloudflare)
- **Generate Types**: `bun run cf-typegen` (Cloudflare)

## Code Architecture (Target)
- `app/root.tsx`: Main entry point and layout.
- `app/routes/`: Contains all page routes, actions, and loaders.
- `app/services/`: (To be ported) AI story generation and business logic.
- `app/models/`: (To be ported) Data models (Drizzle or similar for Cloudflare D1).

## Development Guidelines
- Prefer **TypeScript** for all new code.
- Use **React Router v7** loaders for data fetching and actions for data mutations.
- Tailwind CSS v4 is used for styling; no separate CSS files unless necessary.
- Deployment targets **Cloudflare edge runtime**, so avoid Node.js specific APIs.
