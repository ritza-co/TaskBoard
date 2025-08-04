import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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