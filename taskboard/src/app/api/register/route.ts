import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';

/**
 * @swagger
 * /api/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with username and password
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserCredentials'
 *           example:
 *             username: "john_doe"
 *             password: "secure_password123"
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               userId: "clh7x1234abcd5678efgh"
 *       400:
 *         description: Bad request - missing username or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Missing username or password"
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "User already exists"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Internal server error"
 */
export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ message: 'Missing username or password' }, { status: 400 });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ message: 'User already exists' }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
    });

    // Create demo tasks for new users
    const demoTasks = [
      {
        title: "Welcome to TaskBoard!",
        details: "This is your first task. Try moving it between columns using the arrow buttons or ask the Task Agent for help.",
        status: "todo" as const,
        userId: user.id,
      },
      {
        title: "Chat with Task Agent",
        details: "Click the chat button in the bottom right to talk with your AI-powered Task Agent. It can help manage tasks and boost productivity.",
        status: "todo" as const,
        userId: user.id,
      },
      {
        title: "Organize your workflow",
        details: "Move tasks through To Do → In Progress → Complete using the arrow buttons. Delete tasks you no longer need.",
        status: "doing" as const,
        userId: user.id,
      },
      {
        title: "Example completed task",
        details: "Great job! This is what a completed task looks like. You can use the Task Agent to analyze your progress and productivity.",
        status: "done" as const,
        userId: user.id,
      },
    ];

    await prisma.item.createMany({
      data: demoTasks,
    });

    return NextResponse.json({ userId: user.id }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}