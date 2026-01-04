# AI 互动小说生成器 - Project Context

## Project Overview

This is an AI-powered dynamic interactive fiction game built with FastAPI. The application generates unique storylines, characters, and a visual story development roadmap based on player-selected story types, providing an immersive reading experience with unknowns and choices.

### Key Features
- **Dynamic Story Generation**: AI-driven core that dynamically creates story openings, developments, and multiple endings based on preset literary styles (e.g., "Eastern Fantasy", "Western Magic")
- **Randomized Authors & Works**: Each new game randomly generates "authors" and "book titles" that match the selected type, adding to the game's fun and immersion
- **Visual Story Roadmap**: Generates the entire story structure (Story Map) in advance and renders it on the frontend via Mermaid.js for players to visualize potential branches and endings
- **Branching Narrative**: Each player choice affects the story's direction, leading to different plot branches and final endings
- **Dynamic Writing Style**: AI generates unique writing style descriptions based on story type and applies them throughout the narrative

### Technology Stack
- **Backend**: FastAPI (Python web framework), SQLAlchemy & SQLModel (ORM), Redis (caching and SSE)
- **Frontend**: Vanilla JavaScript, Tailwind CSS, Mermaid.js
- **AI**: OpenAI GPT (story generation engine)
- **Deployment**: Docker & Docker Compose (containerized deployment)

## Architecture & Structure

### Project Structure
```
.
├── app/                # FastAPI backend application core code
│   ├── api/            # API routes and endpoints
│   ├── crud/           # Database operations (Create, Read, Update, Delete)
│   ├── models/         # SQLAlchemy data models
│   ├── schemas/        # Pydantic data validation models
│   ├── services/       # Core business logic (story generation)
│   ├── main.py         # FastAPI application entry point
│   └── database.py     # Database connection and initialization
├── static/             # Static files (CSS, JS, images)
├── templates/          # HTML templates
├── .env.example        # Environment variable example file
├── .gitignore          # Git ignore configuration
├── DESIGN.md           # System design documentation
├── docker-compose.yml  # Docker service orchestration
├── Dockerfile          # Web service Docker image configuration
└── README.md           # Documentation
```

### Core Components
- **app/main.py**: Main FastAPI application with startup/shutdown events, static file mounting, and API router inclusion
- **app/services/story_generator.py**: Core story generation logic with LLM integration, story map generation, and choice creation
- **app/api/v1/endpoints/game.py**: Game-related API endpoints (create game, make choice, get state, delete game)
- **app/core/config.py**: Application settings and environment variable management

## Building and Running

### Prerequisites
- Docker and Docker Compose installed

### Setup
1. Create environment variables file:
   ```bash
   cp .env.example .env
   ```
2. Edit `.env` file with your OpenAI API key and other configurations

### Running the Application
1. Build and start services:
   ```bash
   docker-compose up --build
   ```
2. Access the application at `http://localhost:1888`

### Development Commands
- Frontend style compilation: `npm run build` (watches and compiles tailwind.css)

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/game` | Create a new game, return initial scene and story map |
| `POST` | `/api/v1/game/{game_id}/choice` | Submit player choice, get next scene |
| `GET` | `/api/v1/game/{game_id}` | Get current full game state |
| `DELETE` | `/api/v1/game/{game_id}` | Delete a game session |

## Key Development Conventions

1. **Async Programming**: Heavy use of async/await for I/O operations and LLM calls
2. **Background Tasks**: Story generation runs as background tasks to avoid blocking
3. **Streaming Updates**: Uses Server-Sent Events (SSE) via Redis for real-time progress updates
4. **JSON Data Format**: Story maps and game states are stored as JSON strings in the database
5. **Environment Configuration**: All sensitive configuration managed through environment variables
6. **Error Handling**: Comprehensive error handling with fallback mechanisms for LLM failures
7. **Progressive Enhancement**: Story generation includes progress updates streamed to the frontend

## Special Notes

- The application uses a two-stage Docker build process (frontend build stage, then Python application stage)
- Story generation includes a complex workflow with author/title generation, story map creation, and dynamic scene generation
- The system includes automatic cleanup of inactive games based on the `INACTIVE_GAME_CLEANUP_HOURS` setting
- The application uses Mermaid.js for visualizing story maps in the frontend
- Redis is used for both caching and Server-Sent Events (SSE) message queuing