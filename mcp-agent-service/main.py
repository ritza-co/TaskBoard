import os
import uuid
import asyncio
import time
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from agents import Agent, Runner, SQLiteSession
from agents.mcp import MCPServerStdio
from dataclasses import dataclass
from enum import Enum

app = FastAPI(title="OpenAI Agents Chat Microservice", version="1.0.0")

# Validate required environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TASKBOARD_SERVER_URL = os.getenv("TASKBOARD_SERVER_URL")

if not TASKBOARD_SERVER_URL:
    raise ValueError("TASKBOARD_SERVER_URL environment variable is required")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY environment variable is required")

# Set OpenAI API key for the library
os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

# Add CORS middleware to allow requests from Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str
    conversation_history: List[Dict[str, Any]] = []
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    user_message_count: int
    tool_usage: Optional[Dict[str, Any]] = None

class CircuitBreakerState(Enum):
    CLOSED = "closed"
    OPEN = "open" 
    HALF_OPEN = "half_open"

@dataclass
class CircuitBreaker:
    failure_threshold: int = 5
    recovery_timeout: int = 60
    failure_count: int = 0
    last_failure_time: float = 0
    state: CircuitBreakerState = CircuitBreakerState.CLOSED
    
    def can_execute(self) -> bool:
        if self.state == CircuitBreakerState.CLOSED:
            return True
        elif self.state == CircuitBreakerState.OPEN:
            if time.time() - self.last_failure_time > self.recovery_timeout:
                self.state = CircuitBreakerState.HALF_OPEN
                return True
            return False
        else:  # HALF_OPEN
            return True
    
    def record_success(self):
        self.failure_count = 0
        self.state = CircuitBreakerState.CLOSED
    
    def record_failure(self):
        self.failure_count += 1
        self.last_failure_time = time.time()
        if self.failure_count >= self.failure_threshold:
            self.state = CircuitBreakerState.OPEN

# Global circuit breaker for MCP connections
mcp_circuit_breaker = CircuitBreaker()

def extract_user_id_from_history(conversation_history: List[Dict[str, Any]]) -> Optional[str]:
    """Extract user ID from system message in conversation history."""
    for msg in conversation_history:
        if msg.get('role') == 'system' and msg.get('content'):
            content = msg['content']
            if 'User ID:' in content:
                # Extract userId from system message like "User ID: cmdrrwoto0000p822xrunfrtt. When..."
                return content.split('User ID:')[1].split('.')[0].strip()
    return None

def extract_tool_usage_from_result(result) -> Optional[Dict[str, Any]]:
    """Extract tool usage information from the agent result."""
    tool_usage = None
    tool_calls = []
    
    try:
        # Check if the result has tool usage information
        if hasattr(result, 'tool_calls') and result.tool_calls:
            for tool_call in result.tool_calls:
                tool_call_data = {
                    "function": {
                        "name": tool_call.get('name', 'unknown'),
                        "arguments": tool_call.get('arguments', {})
                    },
                    "content": tool_call.get('result', 'No result')
                }
                tool_calls.append(tool_call_data)
        
        # Check if result has items with tool information
        elif hasattr(result, 'items') and result.items:
            for item in result.items:
                if hasattr(item, 'type') and 'tool' in item.type:
                    tool_call_data = {
                        "function": {
                            "name": getattr(item, 'name', 'unknown'),
                            "arguments": getattr(item, 'arguments', {})
                        },
                        "content": getattr(item, 'output', 'No result')
                    }
                    tool_calls.append(tool_call_data)
        
        if tool_calls:
            tool_usage = {
                "tool_calls": tool_calls,
                "has_tools": True
            }
            
    except Exception as e:
        print(f"Error extracting tool usage: {e}")
        tool_usage = None
    
    return tool_usage

@app.get("/health")
async def health_check():
    return {
        "status": "healthy", 
        "service": "openai-agents-chat-microservice",
        "mcp_circuit_breaker": {
            "state": mcp_circuit_breaker.state.value,
            "failure_count": mcp_circuit_breaker.failure_count,
            "can_execute": mcp_circuit_breaker.can_execute()
        }
    }

async def create_mcp_server_with_retry(max_retries: int = 3, base_delay: float = 2.0) -> MCPServerStdio:
    """Create MCP server connection with retry logic and circuit breaker."""
    
    # Check circuit breaker first
    if not mcp_circuit_breaker.can_execute():
        raise Exception(f"Circuit breaker is OPEN. MCP service is currently unavailable. State: {mcp_circuit_breaker.state.value}")
    
    for attempt in range(max_retries):
        try:
            print(f"Creating MCP server connection attempt {attempt + 1}/{max_retries}")
            
            # Create the MCP server connection with improved timeout handling
            mcp_server = MCPServerStdio(
                name="GramTaskboard",
                params={
                    "command": "npx",
                    "args": [
                        "mcp-remote",
                        "https://app.getgram.ai/mcp/ritza-rzx-taskboard-demo",
                        "--header",
                        f"MCP-TASKBOARD-SERVER-URL:{TASKBOARD_SERVER_URL}",
                        "--timeout", "120000"  # 2 minutes timeout for mcp-remote
                    ]
                },
                cache_tools_list=True,  # Enable caching for better performance
                client_session_timeout_seconds=120.0,  # 2 minutes timeout for MCP client session
                max_retry_attempts=2,  # Enable retries at the MCP level
                retry_backoff_seconds_base=2.0  # 2-second base delay for MCP retries
            )
            
            print("MCP server connection created successfully!")
            mcp_circuit_breaker.record_success()
            return mcp_server
            
        except Exception as e:
            print(f"MCP server creation attempt {attempt + 1} failed: {e}")
            mcp_circuit_breaker.record_failure()
            
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt)  # Exponential backoff
                print(f"Retrying in {delay} seconds...")
                await asyncio.sleep(delay)
            else:
                raise e

async def create_agent_with_mcp(user_id: str, mcp_server: MCPServerStdio) -> Agent:
    """Create an agent with the provided MCP server."""
    agent = Agent(
        name="TaskBoard Assistant",
        instructions=f"""You are a helpful assistant that can manage tasks in a TaskBoard application.
        You can list, create, update, delete, and search for tasks using the available MCP tools.
        
        When interacting with tasks:
        - Always use the provided MCP tools to perform TaskBoard operations
        - Be helpful and provide clear responses about task operations
        - If a user wants to move a task, update its status (todo, in-progress, done)
        - When listing tasks, organize them by status if helpful
        - When creating tasks, ask for clarification if title or description is unclear
        
        {f'The user ID is: {user_id}. Always use this user ID when calling TaskBoard tools.' if user_id else 'User ID not available - tools may not work properly.'}
        
        Available task statuses: todo, in-progress, done
        
        Use natural language to explain what actions you're taking and their results.""",
        model="gpt-4o-mini",
        mcp_servers=[mcp_server]
    )
    
    print("Agent created successfully!")
    return agent

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    # Generate session ID if not provided
    session_id = request.session_id or str(uuid.uuid4())
    
    # Count user messages in conversation history
    user_message_count = 1  # Current message
    for msg in request.conversation_history:
        if msg.get('role') == 'user':
            user_message_count += 1
    
    # Check if we've reached the limit
    if user_message_count > 5:
        return ChatResponse(
            response="This conversation has reached the maximum limit of 5 user messages. Please start a new conversation.",
            session_id=session_id,
            user_message_count=user_message_count
        )
    
    # Extract userId from conversation history
    user_id = extract_user_id_from_history(request.conversation_history)
    
    try:
        print(f"Processing chat request for user: {user_id}")
        
        # Create MCP server with retry logic
        mcp_server = await create_mcp_server_with_retry()
        
        # Use the MCP server with longer timeout and better error handling
        try:
            async with asyncio.timeout(180):  # 3 minute total timeout
                async with mcp_server as server:
                    print("MCP server connected successfully!")
                    
                    # Create agent with the connected MCP server
                    agent = await create_agent_with_mcp(user_id, server)
                    
                    # Create session for conversation persistence
                    session = SQLiteSession(session_id, "conversations.db")
                    
                    # Run the agent
                    result = await Runner.run(
                        agent,
                        request.message,
                        session=session
                    )
                    
                    # Extract tool usage information
                    tool_usage = extract_tool_usage_from_result(result)
                    
                    # Record success for circuit breaker
                    mcp_circuit_breaker.record_success()
                    
                    return ChatResponse(
                        response=result.final_output,
                        session_id=session_id,
                        user_message_count=user_message_count,
                        tool_usage=tool_usage
                    )
                    
        except asyncio.TimeoutError:
            print("Overall operation timed out after 3 minutes")
            mcp_circuit_breaker.record_failure()
            return ChatResponse(
                response="The TaskBoard service is taking too long to respond. This might be due to network issues or server load. Please try again in a few minutes.",
                session_id=session_id,
                user_message_count=user_message_count
            )
            
        except Exception as mcp_error:
            print(f"MCP server error: {mcp_error}")
            
            mcp_circuit_breaker.record_failure()
            
            # Provide specific error messages based on the error type
            if "circuit breaker" in str(mcp_error).lower():
                error_msg = "The TaskBoard service is temporarily unavailable due to multiple connection failures. Please try again in a few minutes."
            elif "timeout" in str(mcp_error).lower():
                error_msg = "The TaskBoard service connection timed out. Please try again."
            elif "connection" in str(mcp_error).lower() or "connect" in str(mcp_error).lower():
                error_msg = "Unable to connect to the TaskBoard service. Please check your connection and try again."
            elif "invalid url" in str(mcp_error).lower():
                error_msg = "There's a configuration issue with the TaskBoard server URL. Please check the server configuration."
            else:
                error_msg = f"TaskBoard service error: {str(mcp_error)}. The service may be temporarily unavailable."
                
            return ChatResponse(
                response=error_msg,
                session_id=session_id,
                user_message_count=user_message_count
            )
        
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        
        return ChatResponse(
            response="I'm experiencing technical difficulties. Please try again in a moment.",
            session_id=session_id,
            user_message_count=user_message_count
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8085)