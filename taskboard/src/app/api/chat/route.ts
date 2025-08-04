import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/chat:
 *   get:
 *     summary: Chat service health check
 *     description: Check the health status of the chat service and MCP integration
 *     tags: [Chat]
 *     security:
 *       - UserIdParam: []
 *     responses:
 *       200:
 *         description: Chat service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "healthy"
 *                 chat_service:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       example: "healthy"
 *                     service:
 *                       type: string
 *                       example: "mcp-chat-microservice"
 *             example:
 *               status: "healthy"
 *               chat_service:
 *                 status: "healthy"
 *                 service: "mcp-chat-microservice"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Unauthorized"
 *       503:
 *         description: Chat service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               status: "unhealthy"
 *               error: "Chat service unavailable"
 *   post:
 *     summary: Send chat message
 *     description: Send a message to the MCP-powered AI assistant and receive a response with optional tool usage
 *     tags: [Chat]
 *     security:
 *       - UserIdParam: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *           example:
 *             message: "Can you help me analyze the current deployment status?"
 *             conversation_history:
 *               - role: "user"
 *                 content: "Hello"
 *                 timestamp: "2025-07-31T20:00:00.000Z"
 *               - role: "assistant"
 *                 content: "Hi! How can I help you today?"
 *                 timestamp: "2025-07-31T20:00:05.000Z"
 *             session_id: "445cf28e-b95c-46d5-8af4-c327fe33149b"
 *     responses:
 *       200:
 *         description: Successfully processed chat message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *             example:
 *               response: "I can help you analyze the deployment status. Let me check the current system status using the available tools."
 *               session_id: "445cf28e-b95c-46d5-8af4-c327fe33149b"
 *               user_message_count: 2
 *               tool_usage:
 *                 has_tools: true
 *                 tool_calls:
 *                   - function:
 *                       name: "deployment_status_check"
 *                       arguments: '{"environment": "production"}'
 *                     content:
 *                       - type: "text"
 *                         text: "All services are running normally. Last deployment: 2025-07-31T18:30:00Z"
 *       400:
 *         description: Bad request - missing message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Message is required"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Unauthorized"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Failed to process chat request"
 */

interface ChatRequest {
  message: string;
  conversation_history: Array<{ role: string; content: string; timestamp?: string }>;
  session_id?: string;
  userId?: string;
}

interface ChatResponse {
  response: string;
  session_id: string;
  user_message_count: number;
  tool_usage?: any;
}

const CHAT_SERVICE_URL = process.env.CHAT_SERVICE_URL || 'http://localhost:8085';

export async function POST(request: NextRequest) {
  let userId = request.headers.get('x-user-id');
  
  // If no userId from middleware, try to get from query params directly
  if (!userId) {
    userId = new URL(request.url).searchParams.get('userId');
  }

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body: ChatRequest = await request.json();

    if (!body.message) {
      return NextResponse.json({ message: 'Message is required' }, { status: 400 });
    }

    // Prepare conversation history with system context about userId
    const conversationHistory = body.conversation_history || [];
    
    // Always add system message with userId as the first message
    // This ensures the agent knows the user ID for each request
    conversationHistory.unshift({
      role: 'system',
      content: 'User ID: ' + userId + '. When the user asks about their user ID, you can reference this value.',
      timestamp: new Date().toISOString()
    });

    // Forward the request to the chat microservice
    const requestBody = {
      message: body.message,
      conversation_history: conversationHistory,
      session_id: body.session_id,
    };
    
    const chatResponse = await fetch(`${CHAT_SERVICE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!chatResponse.ok) {
      throw new Error(`Chat service responded with status: ${chatResponse.status}`);
    }

    const chatData: ChatResponse = await chatResponse.json();

    return NextResponse.json(chatData);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { message: 'Failed to process chat request' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Health check for the chat service
    const healthResponse = await fetch(`${CHAT_SERVICE_URL}/health`);
    
    if (!healthResponse.ok) {
      throw new Error('Chat service unhealthy');
    }

    const healthData = await healthResponse.json();
    
    return NextResponse.json({
      status: 'healthy',
      chat_service: healthData,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'unhealthy', error: 'Chat service unavailable' },
      { status: 503 }
    );
  }
}