import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uuid
from mcp_agent.app import MCPApp
from mcp_agent.agents.agent import Agent
from mcp_agent.workflows.llm.augmented_llm_openai import OpenAIAugmentedLLM

app = FastAPI(title="MCP Chat Microservice", version="1.0.0")

# Validate required environment variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
TASKBOARD_SERVER_URL = os.getenv("TASKBOARD_SERVER_URL", "http://taskboard:3000")

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

# Initialize MCP app with custom config if needed
mcp_app = MCPApp(name="mcp_fastapi_chat_app")



class ChatRequest(BaseModel):
    message: str
    conversation_history: List[Dict[str, Any]] = []
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    user_message_count: int
    tool_usage: Optional[Dict[str, Any]] = None

def extract_tool_usage_from_llm(llm):
    """Extract tool usage information from the LLM history."""
    tool_usage = None
    tool_calls = []
    
    try:
        # The history object is SimpleMemory(history=[...])
        # So we need to access the 'history' attribute of the history object
        if not (hasattr(llm, 'history') and llm.history and hasattr(llm.history, 'history')):
            print("No history found in LLM object")
            return None

        messages = llm.history.history
        print(f"Found {len(messages)} messages in history")

        # Get tools that have been used from the conversation history
        used_tools = []
        history = llm.history.history

        for message in history:
            if message.get('tool_calls'):
                print(f"Found message with tool_calls: {message}")
                for tool_call in message['tool_calls']:
                    print(f"Processing tool_call: {tool_call}")
                    print(f"Tool call type: {type(tool_call)}")
                    print(f"Tool call attributes: {dir(tool_call)}")
                    
                    # Handle both object and dictionary formats
                    if hasattr(tool_call, 'function'):
                        tool_name = tool_call.function.name
                        tool_args = tool_call.function.arguments
                        call_id = tool_call.id
                    elif isinstance(tool_call, dict):
                        tool_name = tool_call.get('function', {}).get('name')
                        tool_args = tool_call.get('function', {}).get('arguments')
                        call_id = tool_call.get('id')
                    else:
                        print(f"Unknown tool_call format: {tool_call}")
                        continue
                        
                    used_tools.append({
                        'name': tool_name,
                        'arguments': tool_args,
                        'call_id': call_id
                    })

        print("Used tools:", used_tools)

        # Or just get the tool names
        tool_names = []
        for message in history:
            if message.get('tool_calls'):
                for tool_call in message['tool_calls']:
                    if hasattr(tool_call, 'function'):
                        tool_names.append(tool_call.function.name)
                    elif isinstance(tool_call, dict):
                        tool_names.append(tool_call.get('function', {}).get('name'))

        print("Tool names used:", tool_names)

        for message in messages:
            if message.get('tool_calls'):
                for tool_call in message['tool_calls']:
                    # Handle both object and dictionary formats
                    if hasattr(tool_call, 'function'):
                        tool_name = tool_call.function.name
                        tool_args = tool_call.function.arguments
                        call_id = tool_call.id
                    elif isinstance(tool_call, dict):
                        tool_name = tool_call.get('function', {}).get('name')
                        tool_args = tool_call.get('function', {}).get('arguments')
                        call_id = tool_call.get('id')
                    else:
                        print(f"Unknown tool_call format in main loop: {tool_call}")
                        continue
                    
                    # Find the corresponding tool result in subsequent messages
                    tool_result = None
                    for result_msg in messages:
                        if (result_msg.get('role') == 'tool' and
                            result_msg.get('tool_call_id') == call_id):
                            tool_result = result_msg.get('content')
                            break
                    
                    tool_call_data = {
                        "function": {
                            "name": tool_name,
                            "arguments": tool_args
                        },
                        "content": tool_result if tool_result else [{"type": "text", "text": "No result"}]
                    }
                    tool_calls.append(tool_call_data)

        if tool_calls:
            tool_usage = {
                "tool_calls": tool_calls,
                "has_tools": True
            }
            print(f"Created tool usage with {len(tool_calls)} tool calls")
        else:
            print("No tool calls found in messages")

    except Exception as e:
        print(f"Error extracting tool usage: {e}")
        import traceback
        traceback.print_exc()
        tool_usage = None
    
    return tool_usage

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "mcp-chat-microservice"}

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
    
    # Extract userId from system message in conversation history
    user_id = None
    for msg in request.conversation_history:
        if msg.get('role') == 'system' and msg.get('content'):
            content = msg['content']
            if 'User ID:' in content:
                # Extract userId from system message like "User ID: cmdrrwoto0000p822xrunfrtt. When..."
                user_id = content.split('User ID:')[1].split('.')[0].strip()
                break
    
    # Create context from conversation history
    context = ""
    if request.conversation_history:
        context = "Previous conversation:\n"
        for msg in request.conversation_history:
            context += f"{msg['role']}: {msg['content']}\n"
        context += "\n"

    async with mcp_app.run() as mcp_agent_app:
        chat_agent = Agent(
            name="chat_agent",
            instruction=f"""You are a helpful assistant. Maintain context from the conversation history provided.
            You can use the GramTaskboard tool to get information about the tasks and their status.
            {f'The user ID is: {user_id}. Use this user ID when calling TaskBoard tools.' if user_id else ''}""",
            server_names=["GramTaskboard"],
        )

        async with chat_agent:
            def create_llm(agent):
                return OpenAIAugmentedLLM(agent=agent, default_model="gpt-4o-mini")
            
            llm = await chat_agent.attach_llm(llm_factory=create_llm)
            
            # Include context in the message
            full_message = context + f"User: {request.message}"
            
            # Generate response
            result = await llm.generate_str(message=full_message)

            print("Debuggy Wuggy: " + str(llm.history))
            
            # Extract tool usage using multiple approaches
            tool_usage = extract_tool_usage_from_llm(llm)
            
            return ChatResponse(
                response=result,
                session_id=session_id,
                user_message_count=user_message_count,
                tool_usage=tool_usage
            )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8085)