# TaskBoard

A simple Kanban task management application built with Next.js, SQLite, and Docker. Features user authentication and a clean task management interface with three columns: To Do, In Progress, and Complete.

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose (or Node.js for local development)

### Setup

1. **Clone and Configure**:
   ```bash
   git clone https://github.com/ritza-co/TaskBoard.git
   cd TaskBoard
   ```

2. **Environment Configuration**:
   Create a `.env` file:
   ```bash
   # Database configuration
   DATABASE_URL="file:./prisma/dev.db"
   ```

3. **Start with Docker**:
   ```bash
   docker-compose up --build
   ```

4. **Access Application**:
   - TaskBoard UI: http://localhost:3000

## 🎯 Features

### Task Management
- **Kanban Board**: Task organization (To Do → In Progress → Complete)
- **CRUD Operations**: Create, read, update, delete tasks
- **User Authentication**: Simple user registration and login
- **Real-time Updates**: Instant UI updates after task modifications

## 🛠️ Development

### Local Development
```bash
cd taskboard
npm install
npm run dev
# Runs on http://localhost:3000
```

### Database Management
```bash
cd taskboard
npx prisma migrate dev --name "migration_name"
npx prisma generate
```

## 🌐 Production Deployment

For production deployment:

1. **Deploy TaskBoard**: Use Vercel, Railway, or similar platform
2. **Database**: Configure persistent database (PostgreSQL recommended)
3. **Security**: Implement proper authentication and rate limiting
4. **Monitoring**: Set up logging and error tracking

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./prisma/dev.db` |

## 🚨 Troubleshooting

**Database issues?**
- Run `npx prisma migrate dev` to update database schema
- Check that `taskboard/prisma/dev.db` exists and is writable