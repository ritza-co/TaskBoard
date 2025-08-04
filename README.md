# TaskBoard with Gram MCP Integration

A full-stack Kanban task management application with integrated MCP (Model Context Protocol) chat functionality powered by **Gram remote servers**. Built with Next.js frontend and FastAPI chat microservice that connects to Gram's cloud-hosted MCP infrastructure.

## 🏗️ Architecture Overview

This application demonstrates a **distributed MCP architecture** where the AI chat service connects to **Gram remote MCP servers** instead of running MCP tools locally.

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────┐
│   Next.js       │    │   FastAPI        │    │   Gram Remote       │
│   TaskBoard     │◄──►│   Chat Service   │◄──►│   MCP Server        │
│   (Port 3000)   │    │   (Port 8085)    │    │   (Cloud Hosted)    │
└─────────────────┘    └──────────────────┘    └─────────────────────┘
         ▲                        │                          │
         │                        │                          ▼
         │                        │              ┌─────────────────────┐
         │                        │              │   Your TaskBoard    │
         │                        └─────────────►│   API Endpoints     │
         │                                       │   (Public Access)   │
         └───────────────────────────────────────┤   Required!         │
                 User Access                     └─────────────────────┘
```

### 🔄 How It Works

1. **User Interface**: Next.js TaskBoard provides the web interface for task management and chat
2. **Chat Processing**: FastAPI service receives chat messages and forwards them to Gram's remote MCP server
3. **Remote MCP Execution**: Gram's cloud infrastructure runs MCP tools and connects back to your TaskBoard API
4. **Task Integration**: The remote MCP server calls your publicly exposed TaskBoard API to read/write tasks

## 🌐 Public Exposure Requirement

**⚠️ CRITICAL**: Your TaskBoard instance **MUST be publicly accessible** for Gram remote servers to function.

The Gram remote MCP server needs to make HTTP requests to your TaskBoard API endpoints. This means:
- Your TaskBoard (port 3000) must be accessible from the internet
- Use services like ngrok, CloudFare tunnels, or deploy to a cloud provider
- The `TASKBOARD_SERVER_URL` environment variable must point to your public URL

### Example Public URLs:
```bash
# Using ngrok (local development)
TASKBOARD_SERVER_URL=https://abc123.ngrok.io

# Using CloudFlare tunnel
TASKBOARD_SERVER_URL=https://taskboard.yourdomain.com

# Cloud deployment
TASKBOARD_SERVER_URL=https://your-app.vercel.app
```

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- OpenAI API key
- Public access to your TaskBoard (ngrok, tunnel, or cloud deployment)

### Setup

1. **Clone and Configure**:
   ```bash
   git clone https://github.com/ritza-co/TaskBoard.git
   cd TaskBoard
   ```

2. **Environment Configuration**:
   Create a `.env` file:
   ```bash
   # OpenAI API Configuration
   OPENAI_API_KEY=your_openai_api_key_here
   
   # Your publicly accessible TaskBoard URL (REQUIRED!)
   TASKBOARD_SERVER_URL=https://your-public-domain.com
   
   # Database configuration
   DATABASE_URL="file:./prisma/dev.db"
   ```

   For example, if you are using ngrok, you can run the following command to expose port 3000 to the internet:

   ```bash
   ngrok http 3000
   ```

   Then, you can update the `TASKBOARD_SERVER_URL` to the ngrok URL:

   ```bash
   TASKBOARD_SERVER_URL=https://abc123.ngrok.io
   ```

3. **Make TaskBoard Publicly Accessible**:
   ```bash
   # Option 1: Using ngrok (for development)
   ngrok http 3000
   # Then update TASKBOARD_SERVER_URL with the ngrok URL
   
   # Option 2: Deploy to cloud (Vercel, Railway, etc.)
   # Option 3: Use CloudFlare tunnel
   ```

4. **Start Services**:
   ```bash
   docker-compose up --build
   ```

5. **Access Application**:
   - TaskBoard UI: http://localhost:3000 (and your public URL)
   - Chat Service: http://localhost:8085

## 🔧 Gram Remote MCP Configuration

The FastAPI chat service is configured to use Gram's remote MCP infrastructure:

**`mcp-agent-service/mcp_agent.config.yaml`**:
```yaml
mcp:
  servers:
    GramTaskboard:
      command: "npx"
      args: [
        "mcp-remote",
        "https://app.getgram.ai/mcp/ritza-rzx-taskboard",
        "--header",
        "MCP-TASKBOARD-SERVER-URL:${TASKBOARD_SERVER_URL}"
      ]
```

This configuration:
- Connects to Gram's hosted MCP server at `https://app.getgram.ai/mcp/ritza-rzx-taskboard`
- Passes your `TASKBOARD_SERVER_URL` as a header so Gram knows where to reach your API
- Uses `mcp-remote` npm package to establish the connection

## 🎯 Features

### Task Management
- **Kanban Board**: Drag-and-drop task organization (To Do → In Progress → Complete)
- **CRUD Operations**: Create, read, update, delete tasks
- **User Authentication**: Simple user registration and login
- **Real-time Updates**: Instant UI updates after task modifications

### AI Chat Integration
- **Streaming Responses**: Real-time message streaming with typewriter effect
- **Markdown Support**: Rich text formatting in chat messages
- **Tool Usage Indicators**: Visual feedback when AI uses TaskBoard tools
- **Session Management**: Persistent conversations with message history
- **Rate Limiting**: 5 messages per conversation to manage OpenAI costs

### MCP Tool Capabilities
The AI can interact with your tasks through these MCP tools (provided by Gram):
- List all user tasks
- Create new tasks
- Update existing tasks
- Delete tasks
- Filter tasks by status
- Analyze task progress and productivity

## 🛠️ Development

### Local TaskBoard Development
```bash
cd taskboard
npm install
npm run dev
# Runs on http://localhost:3000
```

### Local Chat Service Development
```bash
cd mcp-agent-service
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8085
```

### Database Management
```bash
cd taskboard
npx prisma migrate dev --name "migration_name"
npx prisma generate
```

## 🔐 Security Notes

- **API Keys**: Never commit API keys to version control
- **Public Exposure**: Your TaskBoard API is publicly accessible - implement proper authentication
- **Environment Variables**: Use `.env` file for all sensitive configuration
- **CORS**: Chat service is configured to accept requests from localhost:3000

## 🌐 Production Deployment

For production deployment:

1. **Deploy TaskBoard**: Use Vercel, Railway, or similar platform
2. **Update Environment**: Set `TASKBOARD_SERVER_URL` to your production domain
3. **Database**: Configure persistent database (PostgreSQL recommended)
4. **Security**: Implement proper authentication and rate limiting
5. **Monitoring**: Set up logging and error tracking

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key for chat functionality | `sk-proj-...` |
| `TASKBOARD_SERVER_URL` | **Public URL** of your TaskBoard instance | `https://taskboard.yourdomain.com` |
| `DATABASE_URL` | Database connection string | `file:./prisma/dev.db` |
| `CHAT_SERVICE_URL` | Internal chat service URL | `http://chat-service:8085` |

## 🤝 How Gram Remote MCP Works

1. **User sends chat message** to TaskBoard UI
2. **TaskBoard forwards message** to local FastAPI chat service
3. **Chat service connects** to Gram's remote MCP server using `mcp-remote`
4. **Gram processes the request** and determines if TaskBoard tools are needed
5. **Gram makes HTTP requests** to your public TaskBoard API endpoints
6. **Response flows back** through the chain to the user

This architecture allows you to leverage Gram's powerful MCP infrastructure without running MCP servers locally, while maintaining full control over your task data.

## 🚨 Troubleshooting

**Chat not working?**
- Verify `OPENAI_API_KEY` is set correctly
- Check if chat service is running on port 8085
- Ensure Gram can reach your `TASKBOARD_SERVER_URL`

**MCP tools failing?**
- Confirm your TaskBoard is publicly accessible
- Check that `TASKBOARD_SERVER_URL` is correct in your `.env`
- Verify API endpoints are responding (test with curl/Postman)

**Database issues?**
- Run `npx prisma migrate dev` to update database schema
- Check that `taskboard/prisma/dev.db` exists and is writable