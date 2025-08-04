import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @swagger
 * /api/items:
 *   get:
 *     summary: Get user's items
 *     description: Retrieve all items belonging to the authenticated user, optionally filtered by status
 *     tags: [Items]
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
 *         description: User ID (alternative to Bearer token)
 *         required: false
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
 *     tags: [Items]
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