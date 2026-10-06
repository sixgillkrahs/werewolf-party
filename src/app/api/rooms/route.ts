import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, password } = body;

    if (!name || !password) {
      return NextResponse.json(
        { error: 'Name and password are required' },
        { status: 400 }
      );
    }

    const newRoom = await prisma.room.create({
      data: {
        name,
        password,
      },
    });

    return NextResponse.json({ id: newRoom.id, name: newRoom.name }, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json(
      { error: 'Failed to create room' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
     const rooms = await prisma.room.findMany({
        select: {
           id: true,
           name: true,
           createdAt: true
        },
        orderBy: {
           createdAt: 'desc'
        }
     });
     return NextResponse.json(rooms);
  } catch (error) {
     console.error('Error fetching rooms:', error);
     return NextResponse.json({ error: 'Failed to fetch rooms' }, { status: 500 });
  }
}
