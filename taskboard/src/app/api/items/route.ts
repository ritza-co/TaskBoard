import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserCredentials:
 *       type: object
 *       required:
 *         - username
 *         - password
 *       properties:
 *         username:
 *           type: string
 *           minLength: 3
 *           maxLength: 50
 *           description: Unique username for the account
 *           example: john_doe
 *         password:
 *           type: string
 *           minLength: 6
 *           maxLength: 100
 *           description: Password for the account
 *           example: secure_password123
 *     AuthResponse:
 *       type: object
 *       required:
 *         - userId
 *       properties:
 *         userId:
 *           type: string
 *           description: Unique identifier for the user (used as bearer token)
 *           example: clh7x1234abcd5678efgh
 *     ItemStatus:
 *       type: string
 *       enum: [todo, doing, done]
 *       description: Current status of the item in the Kanban board
 *     Item:
 *       type: object
 *       required:
 *         - id
 *         - userId
 *         - title
 *         - details
 *         - status
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           description: Unique identifier for the item
 *         userId:
 *           type: string
 *           description: ID of the user who owns this item
 *         title:
 *           type: string
 *           maxLength: 200
 *           description: Title of the item
 *         details:
 *           type: string
 *           maxLength: 1000
 *           description: Detailed description
 *         status:
 *           $ref: '#/components/schemas/ItemStatus'
 *         createdAt:
 *           type: string
 *           format: date-time
 *     CreateItemRequest:
 *       type: object
 *       required:
 *         - title
 *         - details
 *         - status
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 200
 *         details:
 *           type: string
 *           maxLength: 1000
 *         status:
 *           $ref: '#/components/schemas/ItemStatus'
 *         userId:
 *           type: string
 *           description: User ID (optional if provided via Bearer token or query param)
 *     UpdateItemRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           maxLength: 200
 *         details:
 *           type: string
 *           maxLength: 1000
 *         status:
 *           $ref: '#/components/schemas/ItemStatus'
 *         userId:
 *           type: string
 *           description: User ID (optional if provided via Bearer token or query param)
 *     ChatRequest:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           maxLength: 2000
 *         conversation_history:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, assistant]
 *               content:
 *                 type: string
 *               timestamp:
 *                 type: string
 *                 format: date-time
 *         session_id:
 *           type: string
 *           nullable: true
 *         userId:
 *           type: string
 *           description: User ID (optional if provided via Bearer token or query param)
 *     ChatResponse:
 *       type: object
 *       required:
 *         - response
 *         - session_id
 *         - user_message_count
 *       properties:
 *         response:
 *           type: string
 *         session_id:
 *           type: string
 *         user_message_count:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         tool_usage:
 *           type: object
 *           nullable: true
 *     ErrorResponse:
 *       type: object
 *       required:
 *         - message
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *   securitySchemes:
 *     UserIdParam:
 *       type: apiKey
 *       in: query
 *       name: userId
 *       description: User ID parameter for authentication
 */

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Get user's items
 *     description: Retrieve all items belonging to the authenticated user, optionally filtered by status
 *     operationId: get_user_items
 *     tags: [Items]
 *     x-gram:
 *       name: get_user_tasks
 *       description: |
 *         <context>
 *         This endpoint retrieves all Kanban tasks belonging to the authenticated user.
 *         Tasks can be filtered by status (todo, doing, done) to focus on specific work stages.
 *         </context>
 *         <prerequisites>
 *         - userId parameter is required for authentication
 *         </prerequisites>
 *         <usage>
 *         - Use without status parameter to get all tasks
 *         - Use status=todo to get pending tasks
 *         - Use status=doing to get in-progress tasks  
 *         - Use status=done to get completed tasks
 *         </usage>
 *       responseFilterType: jq
 *     security:
 *       - UserIdParam: []
 *     parameters:
 *       - name: status
 *         in: query
 *         description: Filter items by status
 *         required: false
 *         schema:
 *           $ref: '#/components/schemas/ItemStatus'
 *         example: "todo"
 *       - name: userId
 *         in: query
 *         description: User ID (required for authentication)
 *         required: true
 *         schema:
 *           type: string
 *         example: "clh7x1234abcd5678user"
 *     responses:
 *       200:
 *         description: Successfully retrieved items
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Item'
 *             example:
 *               - id: "clh7x1234abcd5678efgh"
 *                 userId: "clh7x1234abcd5678user"
 *                 title: "Complete project documentation"
 *                 details: "Write comprehensive API documentation and user guides"
 *                 status: "todo"
 *                 createdAt: "2025-07-31T20:30:00.000Z"
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
 *               message: "Internal server error"
 */
export async function GET(request: NextRequest) {
  let userId = request.headers.get('x-user-id'); // Get userId from custom header
  
  // If no userId from middleware, try to get from query params directly (for MCP requests)
  if (!userId) {
    userId = new URL(request.url).searchParams.get('userId');
  }

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  try {
    const items = await prisma.item.findMany({
      where: {
        userId,
        ...(status && { status }),
      },
    });
    return NextResponse.json(items);
  } catch (error) {
    console.error('Get items error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

/**
 * @swagger
 * /api/items:
 *   post:
 *     summary: Create new item
 *     description: Create a new Kanban item for the authenticated user
 *     operationId: create_user_item
 *     tags: [Items]
 *     x-gram:
 *       name: create_task
 *       description: |
 *         <context>
 *         This endpoint creates a new Kanban task for the authenticated user.
 *         Tasks can be created in any status (todo, doing, done) and will be associated with the user's account.
 *         </context>
 *         <prerequisites>
 *         - userId parameter is required for authentication
 *         - Title, details, and status are required fields
 *         </prerequisites>
 *         <usage>
 *         - Use status=todo for new tasks that need to be started
 *         - Use status=doing for tasks currently in progress
 *         - Use status=done for completed tasks
 *         - Title should be concise (max 200 characters)
 *         - Details can include full description (max 1000 characters)
 *         </usage>
 *       responseFilterType: jq
 *     security:
 *       - UserIdParam: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateItemRequest'
 *           example:
 *             title: "Implement user authentication"
 *             details: "Add JWT-based authentication with refresh tokens"
 *             status: "todo"
 *             userId: "clh7x1234abcd5678user"
 *     responses:
 *       201:
 *         description: Item successfully created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *             example:
 *               id: "clh7x9012qrst3456uvwx"
 *               userId: "clh7x1234abcd5678user"
 *               title: "Implement user authentication"
 *               details: "Add JWT-based authentication with refresh tokens"
 *               status: "todo"
 *               createdAt: "2025-07-31T21:45:00.000Z"
 *       400:
 *         description: Bad request - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Missing title, details, or status"
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
 *               message: "Internal server error"
 */
export async function POST(request: NextRequest) {
  let userId = request.headers.get('x-user-id'); // Get userId from custom header

  const { title, details, status, userId: bodyUserId } = await request.json();
  
  // If no userId from middleware, try to get from request body (for MCP requests)
  if (!userId && bodyUserId) {
    userId = bodyUserId;
  }

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!title || !details || !status) {
    return NextResponse.json({ message: 'Missing title, details, or status' }, { status: 400 });
  }

  try {
    const item = await prisma.item.create({
      data: {
        title,
        details,
        status,
        userId,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Create item error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}