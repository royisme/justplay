# Tech Stack Migration Plan: Python/FastAPI to React Router/Vite 7/Cloudflare

## Overview
Migrate the "AI Interactive Novel Generator" from a Python (FastAPI) + Vanilla JS stack to a TypeScript-based full-stack application using React Router (v7), Vite 7, and Tailwind CSS 4, targeting deployment on Cloudflare (Pages/Workers).

## Current Problem Analysis
- **Legacy Stack**: Python backend and Vanilla JS frontend are separate, making type safety across the boundary difficult.
- **Deployment**: Currently uses Docker/Docker Compose, which is different from the desired Cloudflare Workers/Pages serverless model.
- **Modernization**: Transitioning to React Router v7 (Full-stack) provides a unified development experience and better performance on the edge.

## Strategy and Approach
- **Unified Stack**: Use React Router v7 for both frontend and backend (loaders/actions).
- **Type Safety**: Leverage TypeScript throughout the application.
- **Database**: Transition from SQLModel/SQLite to a Cloudflare-compatible database (e.g., D1) or remain with external DB if needed, but Cloudflare D1 is preferred for the edge.
- **AI Integration**: Migrate OpenAI logic to the React Router actions/loaders.
- **Styling**: Upgrade to Tailwind CSS v4.

## Implementation Steps
1. **Initialize Project Structure** (Done: `package.json` reflects React Router v7/Vite 7) ✅
2. **Infrastructure Setup**
    - Configure `wrangler.toml` for Cloudflare deployment.
    - Set up Cloudflare D1 for state persistence (if replacing SQLAlchemy).
3. **Core Logic Migration**
    - Migrate `app/services/` (AI story generation) to TS utilities.
    - Port prompt templates and story logic.
4. **Data Model Migration**
    - Convert `app/models/` (SQLModel) to Drizzle ORM or similar for D1.
5. **API/Route Migration**
    - Convert FastAPI endpoints (`/api/v1/game`) to React Router actions and loaders.
6. **Frontend Migration**
    - Port `templates/` (HTML) and `static/` (Vanilla JS) to React components.
    - Integrate Mermaid.js for story map rendering.
7. **Deployment**
    - Deploy to Cloudflare using `bun run deploy`.

## Progress Tracking
- [✅] Project Initialization
- [⏳] Infrastructure Setup (Wrangler/D1)
- [ ] Core Logic Migration
- [ ] Data Model Migration
- [ ] API/Route Migration
- [ ] Frontend Migration
- [ ] Deployment

## Related Files
- `app/` (Legacy Backend)
- `static/`, `templates/` (Legacy Frontend)
- `package.json` (New Stack Config)
- `wrangler.toml` (New Deployment Config - Pending)
- `app/root.tsx`, `app/routes/` (New React Router files - Pending)
