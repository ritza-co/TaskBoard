# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment Setup

**Required Environment Variables:**
Create a `.env` file in the root directory with:
```
OPENAI_API_KEY=your_openai_api_key_here
TASKBOARD_SERVER_URL=<your-public-facing-domain-or-ip-address>
```

See `.env.example` for details.

## Development Commands

**Full Stack Development:**
- `docker-compose up --build` - Start both services (recommended)
- `docker-compose down` - Stop all services

**TaskBoard (Next.js) - `/taskboard/` directory:**
- `npm install` - Install dependencies
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run lint` - Run Next.js linting
- `npx prisma generate` - Generate Prisma client (runs automatically on postinstall)
- `npx prisma migrate dev --name <name>` - Create and apply database migrations

**MCP Agent Service (FastAPI) - `/mcp-agent-service/` directory:**
- `pip install -r requirements.txt` - Install Python dependencies
- `uvicorn main:app --host 0.0.0.0 --port 8085` - Start MCP chat microservice

## Architecture Overview

This is a microservices-based Kanban task management application with integrated MCP chat:

1. **Next.js TaskBoard** (`/taskboard/`) - Main application with React frontend and API backend
2. **FastAPI MCP Agent Service** (`/mcp-agent-service/`) - MCP-enabled chat microservice
3. **Docker Orchestration** - Both services networked via docker-compose

### Core Architecture Patterns

**Authentication Flow:**
- Simple userId parameter authentication with MCP request bypass
- Middleware (`src/middleware.ts`) validates userId from URL parameters or request body for `/api/items/*` and `/api/chat` routes
- Special handling for MCP remote requests (bypasses auth when user-agent contains 'node', 'mcp', or x-mcp-request header is set)
- No JWT or complex auth - direct user ID validation against database

**Database Design:**
- SQLite with Prisma ORM
- Two main models: `User` (username, passwordHash) and `Item` (title, details, status, userId)
- Status values: "todo", "doing", "done"
- Each user owns their items via `userId` foreign key

**API Structure:**
- Public endpoints: `POST /api/register`, `POST /api/login`
- Protected endpoints: `/api/items/*`, `/api/chat` (requires `userId` in URL parameters)
- Middleware injects `x-user-id` header for protected routes  
- RESTful CRUD operations for items with status filtering
- Chat API proxies requests to FastAPI chat service

**Frontend Components:**
- `KanbanBoard.tsx` - Main board with three columns (todo/doing/done)
- `ChatComponent.tsx` - Full-featured MCP chat integration with session management
- Authentication pages at `/login` and `/register`
- Dashboard at `/dashboard` shows user's items and chat interface

### Key Implementation Details

**Database Location:** `taskboard/prisma/dev.db` (SQLite file, mounted as volume in Docker)
**Path Alias:** `@/*` maps to `./src/*` in taskboard directory
**Styling:** Tailwind CSS v4 with PostCSS
**TypeScript:** Strict mode enabled
**Package Management:** npm with package-lock.json
**Development Server:** Next.js with Turbopack enabled

**Authentication Parameters:**
Protected API routes expect: `userId` as URL parameter (e.g., `/api/items?userId=<userId>`)
Middleware converts this to `x-user-id` header for internal use.

**MCP Agent Service Integration:**
- FastAPI service runs on port 8085 with CORS enabled for localhost:3000
- Environment variable `CHAT_SERVICE_URL` configures service location (defaults to http://localhost:8085, or http://chat-service:8085 in Docker)
- Chat component includes session management, tool usage display, and error handling
- Message limit of 5 user messages per conversation to manage OpenAI costs
- Automatic session ID generation using UUID
- Tool usage extraction with detailed debugging and error handling

## MCP Integration Details

**MCP Agent Service (`/mcp-agent-service/`):**
- Uses `mcp-agent` library with OpenAI GPT-4o-mini via OpenAIAugmentedLLM
- Configured MCP servers in `mcp.json` (GramTaskboard tool via mcp-remote)
- Session-based conversation management with UUID generation
- Tool usage extraction from LLM history with detailed debugging
- Health check endpoint at `/health`
- User ID extraction from system messages in conversation history for TaskBoard tool integration
- CORS configured for localhost:3000 frontend integration
- Comprehensive error handling and debugging for tool usage extraction

**Frontend Integration:**
- `ChatComponent` replaces placeholder with full functionality
- Real-time chat UI with typing indicators and auto-resize
- Tool usage indicators show when AI uses external tools
- Expandable/collapsible interface integrated into dashboard