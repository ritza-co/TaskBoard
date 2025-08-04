Yes, absolutely — simplifying the Trello-style structure into a **basic Kanban app** makes a lot of sense for your use case, especially if the main goal is to expose a clean, user-scoped API for later MCP integration.

Let’s revise the project to focus on the **core essentials**:

---

## ✅ Updated `GEMINI.md` — TaskBoard (Minimal Kanban MCP Demo)

### Purpose

This project is a **minimal Kanban-style task manager** built with **Next.js**, **SQLite**, and **Docker**, with clean separation of data per user. The focus is on simplicity, with a stable API and clear data ownership, so it can be easily wired up to an MCP server.

---

## 🔧 Simplified App Concept

This is **not** a full Trello clone. Instead, we’re building a **personal Kanban board** for each user. Users can:

* Register and log in with a username and password
* Create **items** (tasks) with:

  * A **title** (short text)
  * **Details** (longer description)
  * A **status**, which can only be one of:

    * `"todo"`
    * `"doing"`
    * `"done"`

Each item is owned by a user and scoped to their user ID. **Users can only access their own items**.

There are no boards, lists, or cards. Just items grouped by status.

---

## 🔐 Auth Model

### Registration & Login

* A user signs up with a `username` and `password`
* The server generates a **random user ID** (used as an API key)
* Passwords are hashed with bcrypt

### API Key = User ID

* After login, the server returns the user’s `userId`
* All API requests must include `Authorization: Bearer <userId>`
* No JWTs or session tokens; user ID is the persistent key

### Request Validation

* On each request, the server:

  * Validates the token
  * Loads the associated user
  * Ensures that all data reads/writes are scoped to that user

---

## 📦 Data Model (via Prisma)

There are only **two database models**:

### 1. `User`

* `id`: String (random ID used as API key)
* `username`: String (unique)
* `passwordHash`: String (bcrypt)

### 2. `Item`

* `id`: String (UUID)
* `userId`: String (foreign key to User)
* `title`: String
* `details`: String
* `status`: Enum (`todo`, `doing`, `done`)
* `createdAt`: Timestamp

All items are owned by a single user.

---

## 🧱 API Design

### Public Endpoints

* `POST /api/register`: Create a new user
* `POST /api/login`: Validate credentials and return the user’s API key

### Authenticated Endpoints

These require the `Authorization: Bearer <userId>` header:

* `GET /api/items`: Return all items for the user, grouped by status (optional query param: `?status=todo`)
* `POST /api/items`: Create a new item for the authenticated user
* `PATCH /api/items/:id`: Update an item (only if it belongs to the user)
* `DELETE /api/items/:id`: Delete an item (user-owned only)

Each response is filtered and validated to make sure the user only sees or modifies their own data.

---

## 📂 Project Layout

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
  /ChatPlaceholder.tsx  → Static div for future MCP use

/lib
  prisma.ts             → Prisma client setup
  auth.ts               → Password hash helpers
  middleware.ts         → Validates `Authorization: Bearer <userId>`

/prisma
  schema.prisma         → Database schema (User, Item)

/docker
  Dockerfile
  docker-compose.yml
```

---

## 🔑 Auth Flow Summary

1. User signs up at `/api/register`
2. Server creates the user, returns a random ID (`userId`)
3. Client stores `userId` and uses it as an API key in all requests
4. Each API route checks this key and filters by `userId`

---

## 🐳 Dockerization

* Uses `node:20-alpine`
* SQLite database runs inside the container (mounted volume optional)
* Prisma migrations run during startup
* App runs on port 3000

---

## ✅ Development Milestones

* [ ] SQLite + Prisma setup
* [ ] User registration and login
* [ ] API key = user ID
* [ ] Item model with title, details, and status
* [ ] CRUD API for user-specific items
* [ ] Docker container and compose
* [ ] Chat placeholder component
* [ ] Add MCP server and connect to API
* [ ] Extend item queries for smart filtering (e.g., due soon)

---

## Why This Design Works Well for MCP

* The API is **clean and minimal** — only one main resource (`Item`)
* Every API call is **auth-scoped by design**
* The authentication model is **stateless** — just a user ID
* Easy to build natural language flows like:

  * “Show me all my to-dos”
  * “Move ‘Finish blog post’ to done”
  * “What am I currently working on?”
