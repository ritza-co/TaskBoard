# TaskBoard

This project is a minimal Kanban-style task manager built with Next.js, SQLite, and Docker, with clean separation of data per user. The focus is on simplicity, with a stable API and clear data ownership.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm
- Docker

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd taskboard
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Generate Prisma client and run migrations:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   ```

### Running the application with Docker Compose

1. Build and run the Docker containers:
   ```bash
   docker-compose up --build
   ```

   The application will be accessible at `http://localhost:3000`.

### Running the application locally (for development)

1. Start the development server:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Endpoints

### Public Endpoints

- `POST /api/register`: Register a new user. Returns `userId`.
- `POST /api/login`: Log in a user. Returns `userId`.

### Authenticated Endpoints (requires `Authorization: Bearer <userId>` header)

- `GET /api/items`: Get all items for the authenticated user. Optional query param: `?status=todo`.
- `POST /api/items`: Create a new item.
- `PATCH /api/items/:id`: Update an item.
- `DELETE /api/items/:id`: Delete an item.

## Project Structure

```
/app
  /page.tsx             → Login or redirect
  /dashboard/page.tsx   → Shows user’s items grouped by status

/api
  /register             → POST: register user
  /login                → POST: login and return userId
  /items                → CRUD API for Kanban items

/components
  /KanbanBoard.tsx      → Group items into To Do, Doing, Done columns
  /TaskModal.tsx        → Modal for creating new tasks

/lib
  prisma.ts             → Prisma client setup
  auth.ts               → Password hash helpers

/prisma
  schema.prisma         → Database schema (User, Item)

/docker
  Dockerfile
  docker-compose.yml
```