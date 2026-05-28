import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { z } from 'zod';

const addLabelTagSchema = z.object({
  emailId: z.string().min(1, 'emailId is required'),
  labelId: z.string().optional(),
  tagId: z.string().optional(),
}).refine((data) => data.labelId || data.tagId, {
  message: 'Either labelId or tagId must be provided',
});

// POST - Add a label or tag to an email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = addLabelTagSchema.safeParse(body);

    if (!validated.success) {
      const errors = validated.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { emailId, labelId, tagId } = validated.data;

    if (labelId) {
      await db.emailLabel.create({
        data: { emailId, labelId },
      });
    }

    if (tagId) {
      await db.emailTag.create({
        data: { emailId, tagId },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to add label/tag:', error);
    return NextResponse.json({ error: 'Failed to add label/tag' }, { status: 500 });
  }
}

// POST - Remove a label or tag from an email (using POST instead of DELETE with body)
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = addLabelTagSchema.safeParse(body);

    if (!validated.success) {
      const errors = validated.error.issues.map((i) => i.message).join(', ');
      return NextResponse.json({ error: errors }, { status: 400 });
    }

    const { emailId, labelId, tagId } = validated.data;

    if (labelId) {
      await db.emailLabel.delete({
        where: { emailId_labelId: { emailId, labelId } },
      });
    }

    if (tagId) {
      await db.emailTag.delete({
        where: { emailId_tagId: { emailId, tagId } },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to remove label/tag:', error);
    return NextResponse.json({ error: 'Failed to remove label/tag' }, { status: 500 });
  }
}
