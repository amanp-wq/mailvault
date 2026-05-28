import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const createAccountSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
});

// GET all archive accounts with email counts
export async function GET() {
  try {
    const accounts = await db.archiveAccount.findMany({
      include: {
        _count: {
          select: { emails: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = accounts.map((account) => ({
      id: account.id,
      email: account.email,
      name: account.name,
      description: account.description,
      emailCount: account._count.emails,
      createdAt: account.createdAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

// POST create a new archive account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createAccountSchema.safeParse(body);

    if (!validated.success) {
      const errors = validated.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { email, name, description } = validated.data;

    // Check for duplicate email
    const existing = await db.archiveAccount.findFirst({
      where: { email },
    });
    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 });
    }

    const account = await db.archiveAccount.create({
      data: { email, name, description },
    });

    // Create default labels for the account
    const defaultLabels = [
      { name: 'Work', color: '#ef4444' },
      { name: 'Personal', color: '#22c55e' },
      { name: 'Finance', color: '#f59e0b' },
      { name: 'Legal', color: '#8b5cf6' },
      { name: 'HR', color: '#06b6d4' },
      { name: 'Client', color: '#ec4899' },
    ];

    await db.label.createMany({
      data: defaultLabels.map((label) => ({
        ...label,
        accountId: account.id,
      })),
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    console.error('Failed to create account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}

// DELETE an archive account
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    await db.archiveAccount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
