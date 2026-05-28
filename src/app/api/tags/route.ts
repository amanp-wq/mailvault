import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const createTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format').optional(),
});

// GET tags
export async function GET() {
  try {
    const tags = await db.tag.findMany({
      include: {
        _count: { select: { emails: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        color: tag.color,
        emailCount: tag._count.emails,
      }))
    );
  } catch (error) {
    console.error('Failed to fetch tags:', error);
    return NextResponse.json({ error: 'Failed to fetch tags' }, { status: 500 });
  }
}

// POST create a tag
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createTagSchema.safeParse(body);

    if (!validated.success) {
      const errors = validated.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { name, color } = validated.data;

    const tag = await db.tag.create({
      data: { name, color: color || '#6366f1' },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error('Failed to create tag:', error);
    return NextResponse.json({ error: 'Failed to create tag' }, { status: 500 });
  }
}

// DELETE a tag
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Tag ID is required' }, { status: 400 });
    }

    await db.tag.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete tag:', error);
    return NextResponse.json({ error: 'Failed to delete tag' }, { status: 500 });
  }
}
