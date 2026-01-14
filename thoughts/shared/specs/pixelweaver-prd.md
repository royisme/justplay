# PixelWeaver v0.2 PRD - The Interactive Novel Engine

## 1. Product Vision

**"Where Every Choice Weaves a New Reality."**
PixelWeaver is an AI-native interactive fiction platform that combines the depth of tabletop RPGs (D&D) with the visual immersion of retro pixel art games. It transforms passive reading into active world-shaping, where users are not just readers but protagonists in living, breathing worlds.

## 2. Core Value Propositions

1.  **AI-Driven Narrative**: Not just "choose your own adventure" branches, but a dynamic story engine that adapts to ANY user action.
2.  **Visual Immersion**: Real-time pixel art generation and rendering brings the text to life.
3.  **Trinity Slots**: A focused gameplay mechanic that encourages completion while allowing exploration.
4.  **Living Worlds**: Scenarios (game worlds) that have their own rules, styles, and physics.

## 3. User Personas

- **The Dreamer (Player)**: Wants to escape into a story where they matter. Loves RPGs, visual novels, and creative writing.
- **The Architect (Creator/Admin)**: Wants to build worlds for others to explore. Enjoys tweaking prompts, styles, and rules.

## 4. Key Features (v0.2 Scope)

### 4.1 Authentication & User System (Mandatory)

- **Gatekeeping**: No anonymous play. Users must sign up/login to create games.
- **Landing Page**: Public facing marketing page explaining the product.
- **User Dashboard**: The central hub for managing games.

### 4.2 The Trinity Slots System (Core Mechanic)

- **Constraint**: Each user has exactly **3 Save Slots**.
- **Lifecycle**:
  - **Empty**: Can start a new game.
  - **Active**: Game in progress. Can be played.
  - **Locked**: Cannot start new game if all 3 are active.
- **Resolution**: To free a slot, a user must either:
  1.  **Complete** the story (reach an ending). -> Becomes a "Book" in the Library.
  2.  **Abandon** the story (delete). -> Gone forever.

### 4.3 The Game Loop (The "Weaving")

1.  **Scenario Selection**: User picks a world (e.g., "Cyberpunk 2077", "Xianxia", "Cthulhu").
2.  **Character Creation**: AI interviews the user to build a persona (Name, Role, Stats).
3.  **Gameplay**:
    - **DM Agent**: Narrates the scene, controls NPCs, enforces world rules.
    - **User Action**: Free text input or selecting suggested actions.
    - **Visuals**: Scene updates based on narrative (Background, Characters, Items).
4.  **Memory System**: The AI remembers inventory, relationships, and past choices.

### 4.4 The Library (The "Grimoire")

- **Trophy Room**: Completed games are archived here.
- **Read-Only**: Users can read their past adventures like a novel (flattened story).
- **Sharing**: (Future v0.3) Share books with others.

### 4.5 Admin World Builder (The "Forge")

- **Scenario Management**: Create/Edit game worlds.
- **Prompt Engineering**: Tune the DM and Writer personalities for each world.
- **Style Control**: Define the visual style for the renderer.

## 5. Technical Requirements

### 5.1 Architecture (The "loom")

- **Frontend**: React Router v7 (SPA/SSR Hybrid).
- **Backend**: Cloudflare Workers (Edge Runtime).
- **Database**: D1 (SQLite on Edge) + Drizzle ORM.
- **Narrative**: **Ink Engine** (via `inkjs`) for state/logic + **AI** for prose.
- **AI Orchestration**: Vercel AI SDK (Model Agnostic).

### 5.2 The Agent Swarm

- **DM (Dungeon Master)**: Manages higher-level game flow, not micro-logic (which is Ink).
- **Writer**: Expands Ink's concise text into rich prose.
- **Scribe**: Summarization, memory management, inventory tracking. (Haiku/Fast)
- **Renderer**: Visual description -> Pixel Art generation.

### 5.3 Data Structure

- **Tree-based History**: Every choice creates a branch.
- **Active Path**: The current canonical story line.
- **Flattening**: Converting the tree to a linear list for "Book" mode.

## 6. Success Metrics

- **Completion Rate**: % of games that result in a "Book" vs "Abandoned".
- **Session Length**: Average time spent per turn.
- **Retention**: % of users who return to fill a second slot.

## 7. Roadmap (Beyond v0.2)

- v0.3: Social Sharing & Community Library.
- v0.4: Multiplayer (Co-op campaigns).
- v0.5: Monetization (Premium scenarios, more slots).
