import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { comparePassword } from '@/lib/auth';

/**
 * @swagger
 * /api/login:
 *   post:
 *     summary: Authenticate user
 *     description: Login with username and password to receive user ID token
 *     operationId: user_login
 *     tags: [Authentication]
 *     security: []
 *     x-gram:
 *       name: login_user
 *       description: |
 *         <context>
 *         This endpoint authenticates a user with their username and password.
 *         Upon successful authentication, it returns a user ID that serves as the authentication token.
 *         </context>
 *         <prerequisites>
 *         - User must have an existing account (use register endpoint to create one)
 *         - Username and password are required
 *         </prerequisites>
 *         <usage>
 *         - Use the returned userId as a query parameter for subsequent API calls
 *         - Store the userId securely as it provides access to the user's data
 *         - Pass the userId as a query parameter in all authenticated requests
 *         </usage>
 *       responseFilterType: jq
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
 *       200:
 *         description: Successfully authenticated
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
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "Invalid credentials"
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
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    const passwordMatch = await comparePassword(password, user.passwordHash);

    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    return NextResponse.json({ userId: user.id }, { status: 200 });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}