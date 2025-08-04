import { NextRequest, NextResponse } from 'next/server';

export async function middleware(req: NextRequest) {
  let userId: string | null = null;

  // Check if this is an MCP remote request (bypass auth for specific cases)
  const userAgent = req.headers.get('user-agent') || '';
  const isMCPRequest = userAgent.includes('node') || userAgent.includes('mcp') || 
                       req.headers.get('x-mcp-request') === 'true';

  // Get userId from query parameter
  userId = req.nextUrl.searchParams.get('userId');

  // If still no userId and it's a POST/PATCH request, try to get from body
  if (!userId && (req.method === 'POST' || req.method === 'PATCH')) {
    try {
      // Clone the request to read the body without consuming it
      const clonedRequest = req.clone();
      const body = await clonedRequest.text();
      if (body) {
        const parsedBody = JSON.parse(body);
        userId = parsedBody.userId;
      }
    } catch (error) {
      // If body parsing fails, continue without userId from body
    }
  }

  // If no userId found and it's not an MCP request, return unauthorized
  if (!userId && !isMCPRequest) {
    return NextResponse.json({ 
      message: 'Unauthorized - userId required as query parameter or in request body' 
    }, { status: 401 });
  }

  // Pass the userId to the API routes via a custom header (if available)
  const response = NextResponse.next();
  if (userId) {
    response.headers.set('x-user-id', userId);
  }
  return response;
}

export const config = {
  matcher: ['/api/items', '/api/items/:path*', '/api/chat'], // Apply middleware to protected routes
};