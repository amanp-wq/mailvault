import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const createLabelSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name too long'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color format').optional(),
  accountId: z.string().min(1, 'accountId is required'),
});

// GET labels (optionally filtered by accountId)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId') || '';

    const where: { accountId?: string } = {};
    if (accountId) where.accountId = accountId;

    const labels = await db.label.findMany({
      where,
      include: {
        _count: { select: { emails: true } },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(
      labels.map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
        accountId: label.accountId,
        emailCount: label._count.emails,
      }))
    );
  } catch (error) {
    console.error('Failed to fetch labels:', error);
    return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 });
  }
}

// POST create a label
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createLabelSchema.safeParse(body);

    if (!validated.success) {
      const errors = validated.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { name, color, accountId } = validated.data;

    const label = await db.label.create({
      data: { name, color: color || '#6366f1', accountId },
    });

    return NextResponse.json(label, { status: 201 });
  } catch (error) {
    console.error('Failed to create label:', error);
    return NextResponse.json({ error: 'Failed to create label' }, { status: 500 });
  }
}

// DELETE a label
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Label ID is required' }, { status: 400 });
    }

    await db.label.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete label:', error);
    return NextResponse.json({ error: 'Failed to delete label' }, { status: 500 });
  }
}
