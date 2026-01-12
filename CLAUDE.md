# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Project Overview

AI Interactive Novel Generator - a full-stack TypeScript application with SSR.

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
│   ├── config/             # Client configuration (e.g., i18n.client.ts)
│   └── hooks/              # Custom React hooks
├── server/                 # Server-only code (NEVER import from app/ or client)
│   ├── services/           # Business logic, AI integration
│   ├── db/                 # Database client and schema
│   ├── config/             # Server configuration, env access
│   └── i18n.server.ts      # Server-side i18n utilities
├── shared/                 # Shared types and constants (no runtime code, types only)
│   ├── types/              # TypeScript type definitions
│   └── schemas/            # Zod schemas (validation)
```

### Path Aliases

- `~/` -> `./app/` (client-safe code)
- `@server/` -> `./server/` (server-only code)
- `@shared/` -> `./shared/` (shared types, no runtime)

## SSR and Hydration Rules

### CRITICAL: Import Boundaries

| From | Can Import | CANNOT Import |
|------|------------|---------------|
| `app/routes/*.tsx` | `~/`, `@server/` (in loader/action only), `@shared/` | - |
| `app/pages/*.tsx` | `~/`, `@shared/` | `@server/` |
| `app/components/*` | `~/`, `@shared/` | `@server/` |
| `server/*` | `@server/`, `@shared/` | `~/` (app code) |

### Server vs Client Code

**Server-only** (runs in loader/action, Node/Edge runtime):
- Database access (`@server/db/*`)
- Environment variables (`@server/config/env`)
- AI service calls (`@server/services/*`)
- Cookie extraction (`@server/i18n.server`)

**Client-only** (runs in browser after hydration):
- `document`, `window`, `localStorage`
- Browser APIs
- Event handlers, React state

**Isomorphic** (runs on both server and client):
- React components in `app/`
- Shared types from `@shared/`
- i18n `useTranslation()` hook

### Avoiding Hydration Mismatches

1. **Never** import server modules (`@server/*`) in component files
2. **Never** use browser APIs (`document`, `window`) during initial render
3. Use `useEffect` for client-only side effects
4. Pass server data through loader, not direct imports
5. For conditional client-only code:
   ```tsx
   const [isClient, setIsClient] = useState(false);
   useEffect(() => setIsClient(true), []);
   if (!isClient) return null; // or fallback
   ```

### Route File Pattern

```tsx
// app/routes/example.tsx

// 1. Server imports (for loader/action only)
import { getDb } from "@server/db/client";
import { SomeService } from "@server/services";

// 2. Shared type imports
import type { SomeType } from "@shared/types/example";

// 3. Client imports (for component)
import { SomePage } from "~/pages/SomePage";

// 4. Loader (server-only)
export async function loader({ context }: Route.LoaderArgs) {
  // Server code here
  return { data };
}

// 5. Action (server-only)
export async function action({ request }: Route.ActionArgs) {
  // Server code here
  return Response.json({ success: true });
}

// 6. Component (isomorphic - SSR then hydrate)
export default function ExampleRoute() {
  const { data } = useLoaderData<typeof loader>();
  return <SomePage data={data} />;
}
```

## Development Guidelines

- All new code must be TypeScript
- Use React Router v7 loaders for data fetching, actions for mutations
- Tailwind CSS v4 for styling
- Target Cloudflare edge runtime - avoid Node.js-specific APIs
- Run `bun run typecheck` before committing
