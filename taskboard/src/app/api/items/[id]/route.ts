import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * @swagger
 * /api/items/{id}:
 *   get:
 *     summary: Get specific item
 *     description: Retrieve a specific Kanban item by ID
 *     operationId: get_item_by_id
 *     tags: [Items]
 *     x-gram:
 *       name: get_task_by_id
 *       description: |
 *         <context>
 *         This endpoint retrieves a specific Kanban task by its unique ID.
 *         Only tasks belonging to the authenticated user can be accessed.
 *         </context>
 *         <prerequisites>
 *         - userId parameter is required for authentication
 *         - Valid task ID must be provided in the URL path
 *         </prerequisites>
 *       responseFilterType: jq
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique identifier of the item
 *         schema:
 *           type: string
 *         example: clh7x1234abcd5678efgh
 *       - name: userId
 *         in: query
 *         description: User ID (required for authentication)
 *         required: true
 *         schema:
 *           type: string
 *         example: clh7x1234abcd5678user
 *     responses:
 *       200:
 *         description: Successfully retrieved item
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *             example:
 *               id: clh7x1234abcd5678efgh
 *               userId: clh7x1234abcd5678user
 *               title: Complete project documentation
 *               details: Write comprehensive API documentation and user guides
 *               status: todo
 *               createdAt: '2025-07-31T20:30:00.000Z'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Unauthorized
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Item not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Internal server error
 *   put:
 *     summary: Update item
 *     description: Update an existing Kanban item
 *     operationId: update_item
 *     tags: [Items]
 *     x-gram:
 *       name: update_task
 *       description: |
 *         <context>
 *         This endpoint updates an existing Kanban task. You can modify the title, details, status, or any combination of these fields.
 *         Only tasks belonging to the authenticated user can be updated.
 *         </context>
 *         <prerequisites>
 *         - userId parameter is required for authentication
 *         - Valid task ID must be provided in the URL path
 *         - At least one field (title, details, or status) should be provided for update
 *         </prerequisites>
 *         <usage>
 *         - Use to move tasks between columns (todo → doing → done)
 *         - Use to update task details as work progresses
 *         - Use to correct typos or add more information to existing tasks
 *         </usage>
 *       responseFilterType: jq
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique identifier of the item
 *         schema:
 *           type: string
 *         example: clh7x1234abcd5678efgh
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateItemRequest'
 *           example:
 *             title: Updated task title
 *             details: Updated task details with more information
 *             status: doing
 *             userId: clh7x1234abcd5678user
 *     responses:
 *       200:
 *         description: Item successfully updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Item'
 *             example:
 *               id: clh7x1234abcd5678efgh
 *               userId: clh7x1234abcd5678user
 *               title: Updated task title
 *               details: Updated task details with more information
 *               status: doing
 *               createdAt: '2025-07-31T20:30:00.000Z'
 *       400:
 *         description: Bad request - invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Invalid status value
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Unauthorized
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Item not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Internal server error
 *   delete:
 *     summary: Delete item
 *     description: Delete a Kanban item
 *     operationId: delete_item
 *     tags: [Items]
 *     x-gram:
 *       name: delete_task
 *       description: |
 *         <context>
 *         This endpoint permanently deletes a Kanban task from the user's board.
 *         This action cannot be undone, so use with caution.
 *         </context>
 *         <prerequisites>
 *         - userId parameter is required for authentication
 *         - Valid task ID must be provided in the URL path
 *         </prerequisites>
 *         <usage>
 *         - Use to remove completed tasks that are no longer needed
 *         - Use to clean up duplicate or incorrect tasks
 *         - Consider moving tasks to 'done' status instead of deleting if you want to keep a record
 *         </usage>
 *       responseFilterType: jq
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Unique identifier of the item
 *         schema:
 *           type: string
 *         example: clh7x1234abcd5678efgh
 *       - name: userId
 *         in: query
 *         description: User ID (required for authentication)
 *         required: true
 *         schema:
 *           type: string
 *         example: clh7x1234abcd5678user
 *     responses:
 *       204:
 *         description: Item successfully deleted
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Unauthorized
 *       404:
 *         description: Item not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Item not found
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: Internal server error
 */

export async function GET(request: NextRequest) {
  let userId = request.headers.get('x-user-id');
  const id = request.nextUrl.pathname.split('/').pop(); // Extract ID from pathname

  // If no userId from middleware, try to get from query params directly
  if (!userId) {
    userId = new URL(request.url).searchParams.get('userId');
  }

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ message: 'Item ID not found' }, { status: 400 });
  }

  try {
    const item = await prisma.item.findFirst({
      where: {
        id,
        userId, // Ensure item belongs to the user
      },
    });

    if (!item) {
      return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    }

    return NextResponse.json(item);
  } catch (error) {
    console.error('Get item error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  let userId = request.headers.get('x-user-id');
  const id = request.nextUrl.pathname.split('/').pop(); // Extract ID from pathname

  // If no userId from middleware, try to get from query params directly
  if (!userId) {
    userId = new URL(request.url).searchParams.get('userId');
  }

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ message: 'Item ID not found' }, { status: 400 });
  }

  const { title, details, status, userId: bodyUserId } = await request.json();

  try {
    const item = await prisma.item.update({
      where: {
        id,
        userId, // Ensure item belongs to the user
      },
      data: {
        ...(title && { title }),
        ...(details && { details }),
        ...(status && { status }),
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Update item error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  let userId = request.headers.get('x-user-id');
  const id = request.nextUrl.pathname.split('/').pop(); // Extract ID from pathname

  // If no userId from middleware, try to get from query params directly
  if (!userId) {
    userId = new URL(request.url).searchParams.get('userId');
  }

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ message: 'Item ID not found' }, { status: 400 });
  }

  const { title, details, status, userId: bodyUserId } = await request.json();

  try {
    const item = await prisma.item.update({
      where: {
        id,
        userId, // Ensure item belongs to the user
      },
      data: {
        ...(title && { title }),
        ...(details && { details }),
        ...(status && { status }),
      },
    });
    return NextResponse.json(item);
  } catch (error) {
    console.error('Update item error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  let userId = request.headers.get('x-user-id');
  const id = request.nextUrl.pathname.split('/').pop(); // Extract ID from pathname

  // If no userId from middleware, try to get from query params directly
  if (!userId) {
    userId = new URL(request.url).searchParams.get('userId');
  }

  if (!userId) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  if (!id) {
    return NextResponse.json({ message: 'Item ID not found' }, { status: 400 });
  }

  try {
    await prisma.item.delete({
      where: {
        id,
        userId, // Ensure item belongs to the user
      },
    });
    return NextResponse.json({ message: 'Item deleted' }, { status: 200 });
  } catch (error) {
    console.error('Delete item error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}