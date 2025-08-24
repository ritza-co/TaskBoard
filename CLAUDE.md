# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Environment Setup

**Required Environment Variables:**
Create a `.env` file in the root directory with:
```
DATABASE_URL="file:./prisma/dev.db"
```

See `.env.example` for details.

## Development Commands

**TaskBoard (Next.js) - `/taskboard/` directory:**
- `npm install` - Install dependencies
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run lint` - Run Next.js linting
- `npx prisma generate` - Generate Prisma client (runs automatically on postinstall)
- `npx prisma migrate dev --name <name>` - Create and apply database migrations

**Docker Development:**
- `docker-compose up --build` - Start application with Docker
- `docker-compose down` - Stop Docker services

## Architecture Overview

This is a Kanban task management application built with Next.js:

1. **Next.js TaskBoard** (`/taskboard/`) - Full-stack application with React frontend and API backend
2. **Docker Support** - Optional containerized deployment

### Core Architecture Patterns

**Authentication Flow:**
- Simple userId parameter authentication
- Middleware (`src/middleware.ts`) validates userId from URL parameters or request body for `/api/items/*` routes
- No JWT or complex auth - direct user ID validation against database

**Database Design:**
- SQLite with Prisma ORM
- Two main models: `User` (username, passwordHash) and `Item` (title, details, status, userId)
- Status values: "todo", "doing", "done"
- Each user owns their items via `userId` foreign key

**API Structure:**
- Public endpoints: `POST /api/register`, `POST /api/login`
- Protected endpoints: `/api/items/*` (requires `userId` in URL parameters)
- Middleware injects `x-user-id` header for protected routes  
- RESTful CRUD operations for items with status filtering

**Frontend Components:**
- `KanbanBoard.tsx` - Main board with three columns (todo/doing/done)
- `TaskModal.tsx` - Modal for creating new tasks
- Authentication pages at `/login` and `/register`
- Dashboard at `/dashboard` shows user's Kanban board

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